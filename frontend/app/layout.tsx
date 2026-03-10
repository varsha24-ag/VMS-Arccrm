import "./globals.css";

import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Visitor Management System",
  description: "ARC CRM Visitor Management Auth"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={sora.variable}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
