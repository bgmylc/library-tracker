import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Library Tracker Next",
  description: "Single-user local library tracker with analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
