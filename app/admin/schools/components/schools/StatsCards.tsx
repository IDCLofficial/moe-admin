"use client";

import { useState, useEffect } from "react";
import { getAllStudents, fetchAllPayments, getSchoolNames } from "@/services/schoolService";
import { School as SchoolType } from "@/services/schoolService";
import CountUp from "react-countup";

interface Payment {
  _id: string;
  totalAmount: number;
  [key: string]: unknown;
}

// ✅ Define School interface with students typed
export interface School {
  _id: string;
  schoolName: string;
  status: string;
}

interface StatCardProps {
  title: string;
  value: number;
  delay?: number;
}


function StatCard({ title, value, delay = 0 }: StatCardProps) {
  
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStartAnimation(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <p className="text-lg font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold text-teal-700`}>
        {startAnimation ? (
          <CountUp end={value} duration={2} separator="," />
        ) : (
          "0"
        )}
      </p>
    </div>
  );
}

export default function StatsCards() {
const [schoolsLength, setSchoolLength] = useState(0)
const [approvedSchools, setApprovedSchools] = useState(0)
const [studentsLength, setStudentsLength] = useState(0)
const [paymentsLength, setPaymentsLength] = useState(0)
const [loading, setLoading] = useState(true)

 useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Fetch school stats
        const getSchoolStats = await getSchoolNames()
     
        const getApproved = getSchoolStats.filter((school: SchoolType) => school.status === "approved")
        setSchoolLength(getSchoolStats.length)
        setApprovedSchools(getApproved.length)
        
        // Fetch students
        const lengthOfStudents = await getAllStudents()

        setStudentsLength(lengthOfStudents.totalItems)
        
        // Fetch payments and calculate total amount
        const totalPayments = await fetchAllPayments();
    
        
        // Sum all totalAmount values from payments
        const totalPaymentAmount = totalPayments.data.reduce((sum: number, payment: Payment) => {
          return sum + (payment.totalAmount || 0);
        }, 0);
        
        setPaymentsLength(totalPaymentAmount)
        
        // Set loading to false when all data is fetched
        setLoading(false)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setLoading(false)
      }
    }
    
    fetchAllStats()
 }, [])


  // --- Calculate stats ---
 
  const stats = [
    // {
    //   title: "Total Schools Registered",
    //   value: schoolsLength,
    // },
    {
      title: "Total Approved",
      value: approvedSchools,
    },
    {
      title: "Total Students Onboarded",
      value: studentsLength,
    },
    {
      title: "Total Payments Collected (Naira)",
      value: paymentsLength,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div
            key={`${s.title}-${i}`}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse"
          >
            <div className="h-4 text-sm py-2 rounded w-3/4 font-bold mb-4">{s.title}</div>
            <div className="h-6 bg-gray-200 rounded mt-3 w-1/2"></div>
          </div>
        ))}
        
       
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s, i) => (
        <StatCard
          key={s.title}
          title={s.title}
          value={s.value}
          delay={i * 200}
        />
      ))}
    </div>
  );
}
