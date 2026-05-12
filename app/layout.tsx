import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medical Reimbursement System",
  description: "Internal medical reimbursement platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">

        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,

            success: {
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
              },
            },

            error: {
              style: {
                background: "#ffffff",
                color: "#dc2626",
                border: "1px solid #fecaca",
              },
            },
          }}
        />

      </body>
    </html>
  );
}