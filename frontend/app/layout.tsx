import "./globals.css";

import type { Metadata } from "next";
import { Sora } from "next/font/google";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Visitor Management System",
  description: "ARC CRM Visitor Management Auth",
  icons: {
    icon: "/icon.svg",
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={sora.variable}>{children}</body>
    </html>
  );
}
