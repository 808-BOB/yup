import { Inter } from "next/font/google";
import { Toaster } from "@/ui/toaster";
import Providers from "./providers";
import "./globals.css";
import type { Metadata } from 'next';
import 'tailwind-merge';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yup.RSVP – Next",
  description: "Modern event planning and RSVP management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gray-950 text-white">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 