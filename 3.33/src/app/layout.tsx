import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hind_Siliguri, Poppins } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bangla",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roy — The Script Writer | রয়, ডাবিং স্ক্রিপ্ট রাইটার",
  description:
    "অডিও বা ভিডিও আপলোড করুন, আর Gemini AI দিয়ে নিখুঁত, টাইমকোডযুক্ত বাংলা ডাবিং স্ক্রিপ্ট তৈরি করুন — Roy, The Script Writer।",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body
        className={`${hindSiliguri.variable} ${poppins.variable} min-h-screen bg-[#0a0a18] font-sans text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
