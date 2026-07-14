export const dynamic = 'force-dynamic'

import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Name Correction - Ministry of Primary and Secondary Education",
  description: "Student name correction portal for the Ministry of Primary and Secondary Education in Imo State.",
};

export default function NameCorrectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="name-correction-layout">{children}</div>;
}
