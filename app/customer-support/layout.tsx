export const dynamic = 'force-dynamic'

import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { ReduxProvider } from '@/app/admin/store/provider'

export const metadata: Metadata = {
  title: "MOPSE Customer Support - Ministry of Primary and Secondary Education",
  description: "Customer support dashboard for the Ministry of Primary and Secondary Education in Imo State.",
};

export default function CustomerSupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="customer-support-layout">
      <ReduxProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ReduxProvider>
    </div>
  );
}
