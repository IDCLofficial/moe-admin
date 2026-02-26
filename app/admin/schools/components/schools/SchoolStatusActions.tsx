"use client";
import Swal from 'sweetalert2';
import { useReapproveApplicationMutation, useUpdateApplicationStatusMutation } from '@/app/admin/schools/store/api/schoolsApi';

import { Application } from '../../store/api/schoolsApi';
import { useAuth } from '@/contexts/AuthContext';

type MutateFunction<T> = (updater?: (data: T[]) => T[], revalidate?: boolean) => void;

interface SchoolStatusActionsProps {
  onSuccess?: () => void;
  onError?: () => void;
  mutate?: MutateFunction<Application>;
  mutateApproved?: MutateFunction<Application>;
  refetchApps?: () => void;
  setSelectedApplications?: (apps: string[]) => void;
  setOpenDropdown?: (dropdown: string | null) => void;
}

export function useSchoolStatusActions({
  onSuccess,
  onError,
  mutate,
  setSelectedApplications,
  setOpenDropdown
}: SchoolStatusActionsProps = {}) {
  const { token } = useAuth();
  // RTK Query mutations
  const [reapproveApplication] = useReapproveApplicationMutation();
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  // --- Approve One ---
  const handleApproveOne = async (appId: string, examType?: string) => {
  
    const result = await Swal.fire({
      title: 'Confirm Approval',
      text: 'Are you sure you want to approve this school?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve it!'
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Approving application, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        // Optimistic remove from applied
        if (mutate) {
          mutate((apps: Application[]) => apps?.filter((a: Application) => a._id !== appId), false);
        }

        await updateApplicationStatus({ appIds: appId, status: "approved", token: token!, examType }).unwrap();
        
        Swal.fire({
          title: 'Success!',
          text: 'Application approved successfully!',
          icon: 'success'
        });

        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to approve application. Please try again.',
          icon: 'error'
        });
        if (mutate) mutate(); // Revert optimistic update on error
        if (onError) onError();
      }
    }
  };

  // --- Approve Selected ---
  const handleApproveSelected = async (selectedApplications: string[]) => {
    const result = await Swal.fire({
      title: 'Confirm Approval',
      text: `Are you sure you want to approve ${selectedApplications.length} school${selectedApplications.length > 1 ? 's' : ''}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve them!'
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Approving applications, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await updateApplicationStatus({ appIds: selectedApplications, status: "approved", token: token! }).unwrap();

        Swal.fire({
          title: 'Success!',
          text: `${selectedApplications.length} application(s) approved successfully!`,
          icon: 'success'
        });
        
        // Optimistic remove from applied tab
        if (mutate) {
          mutate(
            (apps: Application[]) =>
              apps?.filter((a: Application) => !selectedApplications.includes(a._id)) ?? [],
            false
          );
        }

        if (setSelectedApplications) setSelectedApplications([]);
        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to approve selected applications. Please try again.',
          icon: 'error'
        });
        if (mutate) mutate(); // Revert optimistic update on error
        if (onError) onError();
      }
    }
  };

  // --- Reject Selected ---
  const handleRejectSelected = async (selectedApplications: string[]) => {
    // First dialog: Get rejection reason
    const { value: formValues } = await Swal.fire({
      title: `Reject ${selectedApplications.length} Application${selectedApplications.length > 1 ? 's' : ''}`,
      html: `
        <div style="text-align: left;">
          <label for="swal-reason" style="display: block; margin-bottom: 8px; font-weight: 600;">Reason for Rejection:</label>
          <select id="swal-reason" class="swal2-select" style="width: 70%; padding: 8px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="">Select a reason...</option>
            <option value="Incomplete documentation">Incomplete documentation</option>
            <option value="Inaccurate student data">Inaccurate student data</option>
            <option value="Missing required information">Missing required information</option>
            <option value="Does not meet eligibility criteria">Does not meet eligibility criteria</option>
            <option value="Duplicate application">Duplicate application</option>
            <option value="Invalid school credentials">Invalid school credentials</option>
            <option value="Other">Other (specify below)</option>
          </select>
          
          <label for="swal-notes" style="display: block; margin-bottom: 8px; font-weight: 600;">Additional Notes (Optional):</label>
          <textarea id="swal-notes" class="swal2-textarea" placeholder="Enter additional details..." style="width: 70%; min-height: 80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; resize: vertical;"></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Reject Applications',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      customClass: {
        popup: 'swal-wide'
      },
      didOpen: () => {
        const popup = document.querySelector('.swal-wide') as HTMLElement;
        if (popup) {
          popup.style.width = window.innerWidth <= 768 ? '80%' : '40%';
        }
      },
      preConfirm: () => {
        const reason = (document.getElementById('swal-reason') as HTMLSelectElement).value;
        const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement).value;
        
        if (!reason) {
          Swal.showValidationMessage('Please select a reason for rejection');
          return false;
        }
        
        // If "Other" is selected but no notes provided, show validation
        if (reason === 'Other' && !notes.trim()) {
          Swal.showValidationMessage('Please provide additional details when selecting "Other"');
          return false;
        }
        
        return { reason, notes };
      }
    });

    if (formValues) {
      // Construct review notes
      let reviewNotes = formValues.reason;
      if (formValues.notes.trim()) {
        reviewNotes += `: ${formValues.notes.trim()}`;
      }

      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Rejecting applications, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await updateApplicationStatus({ 
          appIds: selectedApplications, 
          status: "rejected", 
          token: token!,
          reviewNotes 
        }).unwrap();
        
        Swal.fire({
          title: 'Success!',
          text: `${selectedApplications.length} application(s) rejected successfully!`,
          icon: 'success'
        });
        
        if (setSelectedApplications) setSelectedApplications([]);
        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to reject selected applications. Please try again.',
          icon: 'error'
        });
        if (onError) onError();
      }
    }
  };

  // --- Send Confirmation (Complete Selected) ---
  const handleSendConfirmation = async (selectedApplications: string[]) => {
    const result = await Swal.fire({
      title: 'Send Confirmation',
      text: `Are you sure you want to mark ${selectedApplications.length} school${selectedApplications.length > 1 ? 's' : ''} as completed?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, send confirmation!'
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Sending confirmations, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await updateApplicationStatus({ appIds: selectedApplications, status: "completed", token: token! }).unwrap();
        
        Swal.fire({
          title: 'Success!',
          text: `${selectedApplications.length} school${selectedApplications.length > 1 ? 's' : ''} marked as completed successfully!`,
          icon: 'success'
        });
        
        if (setSelectedApplications) setSelectedApplications([]);
        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to send confirmations. Please try again.',
          icon: 'error'
        });
        if (onError) onError();
      }
    }
  };

  // --- Send Confirmation Single ---
  const handleSendConfirmationSingle = async (appId: string, examType?: string) => {
    const result = await Swal.fire({
      title: 'Send Confirmation',
      text: 'Are you sure you want to mark this school as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, send confirmation!'
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Sending confirmation, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await updateApplicationStatus({ appIds: appId, status: "completed", token: token!, examType }).unwrap();
        
        Swal.fire({
          title: 'Success!',
          text: 'School marked as completed successfully!',
          icon: 'success'
        });
        
        if (setOpenDropdown) setOpenDropdown(null); // Close the dropdown
        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to send confirmation. Please try again.',
          icon: 'error'
        });
        if (onError) onError();
      }
    }
  };

  // --- Reject One ---
  const handleRejectOne = async (appId: string, examType?: string) => {
    // First dialog: Get rejection reason
    const { value: formValues } = await Swal.fire({
      title: 'Reject Application',
      html: `
        <div style="text-align: left;">
          <label for="swal-reason" style="display: block; margin-bottom: 8px; font-weight: 600;">Reason for Rejection:</label>
          <select id="swal-reason" class="swal2-select" style="width: 70%; padding: 8px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="">Select a reason...</option>
            <option value="Incomplete documentation">Incomplete documentation</option>
            <option value="Inaccurate student data">Inaccurate student data</option>
            <option value="Missing required information">Missing required information</option>
            <option value="Does not meet eligibility criteria">Does not meet eligibility criteria</option>
            <option value="Duplicate application">Duplicate application</option>
            <option value="Invalid school credentials">Invalid school credentials</option>
            <option value="Other">Other (specify below)</option>
          </select>
          
          <label for="swal-notes" style="display: block; margin-bottom: 8px; font-weight: 600;">Additional Notes (Optional):</label>
          <textarea id="swal-notes" class="swal2-textarea" placeholder="Enter additional details..." style="width: 70%; min-height: 80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; resize: vertical;"></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Reject Application',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      customClass: {
        popup: 'swal-wide'
      },
      didOpen: () => {
        const popup = document.querySelector('.swal-wide') as HTMLElement;
        if (popup) {
          popup.style.width = window.innerWidth <= 768 ? '80%' : '40%';
        }
      },
      preConfirm: () => {
        const reason = (document.getElementById('swal-reason') as HTMLSelectElement).value;
        const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement).value;
        
        if (!reason) {
          Swal.showValidationMessage('Please select a reason for rejection');
          return false;
        }
        
        // If "Other" is selected but no notes provided, show validation
        if (reason === 'Other' && !notes.trim()) {
          Swal.showValidationMessage('Please provide additional details when selecting "Other"');
          return false;
        }
        
        return { reason, notes };
      }
    });

    if (formValues) {
      // Construct review notes
      let reviewNotes = formValues.reason;
      if (formValues.notes.trim()) {
        reviewNotes += `: ${formValues.notes.trim()}`;
      }

      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Rejecting application, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        // Optimistic remove from applied tab
        if (mutate) {
          mutate((apps: Application[]) => apps?.filter((a: Application) => a._id !== appId), false);
        }

        await updateApplicationStatus({ 
          appIds: appId, 
          status: "rejected", 
          token: token!, 
          examType,
          reviewNotes 
        }).unwrap();
        
        Swal.fire({
          title: 'Success!',
          text: 'Application rejected successfully!',
          icon: 'success'
        });
        
        if (setOpenDropdown) setOpenDropdown(null);
        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to reject application. Please try again.',
          icon: 'error'
        });
        if (mutate) mutate(); // Revert optimistic update on error
        if (onError) onError();
      }
    }
  };

  // --- Reapprove Rejected Application ---
  const handleReapproveOne = async (appId: string, examType?: string) => {
    const result = await Swal.fire({
      title: 'Reapprove Application',
      text: 'Are you sure you want to reapprove this rejected application?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reapprove it!'
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Reapproving application, please wait.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await reapproveApplication({ applicationId: appId, examType }).unwrap();
        
        Swal.fire({
          title: 'Success!',
          text: 'Application has been reapproved successfully!',
          icon: 'success'
        });

        // Close dropdown if it exists
        if (setOpenDropdown) setOpenDropdown(null);
        
        // RTK Query will automatically invalidate and refetch the cache
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to reapprove application. Please try again.',
          icon: 'error'
        });
        if (onError) onError();
      }
    }
  };

  return {
    handleApproveOne,
    handleApproveSelected,
    handleRejectSelected,
    handleSendConfirmation,
    handleSendConfirmationSingle,
    handleRejectOne,
    handleReapproveOne
  };
}
