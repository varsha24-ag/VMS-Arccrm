import "./globals.css";

import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";

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
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
