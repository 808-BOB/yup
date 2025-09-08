import { Inconsolata, Inter } from "next/font/google";
import { Toaster } from "@/ui/toaster";
import { Footer } from "@/ui/footer";
import Providers from "./providers";
import "./globals.css";
import type { Metadata } from 'next';
import 'tailwind-merge';

const inconsolata = Inconsolata({ subsets: ["latin"] });
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
    <html lang="en" className="bg-black text-white">
      <body className={`${inconsolata.className} flex flex-col min-h-screen`}>
        <Providers>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 