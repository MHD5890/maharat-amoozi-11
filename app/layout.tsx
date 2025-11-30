import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "سامانه مهارت آموزی",
  description: "سامانه مهارت آموزی - ثبت نام و مدیریت مهارت آموزان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      {/*
        suppressHydrationWarning: some browser extensions (e.g. Scholarcy) or
        client-side scripts can inject attributes into the DOM after the server
        rendered HTML is sent. That produces a React hydration mismatch warning
        even though the app itself didn't change. We intentionally suppress
        the warning at the root <body> element to avoid noisy console errors.
        If you prefer to see these warnings, remove this prop and disable the
        browser extension while developing.
      */}
      <body suppressHydrationWarning={true}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
