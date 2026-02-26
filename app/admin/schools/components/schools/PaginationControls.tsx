interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isLoading,
  onPageChange,
}: PaginationControlsProps) {
  // Only show pagination if there's more than 1 page
  if (totalPages <= 1) {
    return null;
  }

  const handlePreviousPage = () => {
    onPageChange(currentPage - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    onPageChange(currentPage + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-6">
      <button
        onClick={handlePreviousPage}
        disabled={!hasPrevPage || isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium 
          transition-all duration-200 shadow-sm
          ${
            !hasPrevPage || isLoading
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md"
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Previous</span>
      </button>

      <span className="px-4 text-sm font-semibold text-gray-700">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={handleNextPage}
        disabled={!hasNextPage || isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium 
          transition-all duration-200 shadow-sm
          ${
            !hasNextPage || isLoading
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md"
          }
        `}
      >
        <span>Next</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
