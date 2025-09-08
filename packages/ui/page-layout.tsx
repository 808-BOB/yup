"use client";

import React from "react";
import Header from "../dash/header";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showHeader?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full"
};

export default function PageLayout({ 
  children, 
  className = "", 
  maxWidth = "xl",
  showHeader = true 
}: PageLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-page-background">
      {showHeader && <Header />}
      <div className={`${maxWidthClasses[maxWidth]} mx-auto p-6 pt-28 ${className}`}>
        {children}
      </div>
    </div>
  );
}

