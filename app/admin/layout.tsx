export const dynamic = 'force-dynamic'

import type { Metadata } from "next";
import "../globals.css";
import ConditionalLayout from './components/ConditionalLayout'
import { AuthProvider } from '@/contexts/AuthContext'
import { ReduxProvider } from '@/app/admin/schools/store/provider'

export const metadata: Metadata = {
  title: "MOPSE Admin Dashboard - Ministry of Primary and Secondary Education",
  description: "Administrative dashboard for the Ministry of Primary and Secondary Education in Imo State.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-layout">
      <ReduxProvider>
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </ReduxProvider>
    </div>
  );
}