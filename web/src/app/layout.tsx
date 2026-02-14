import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Library Tracker",
  description: "Single-user local library tracker with analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <header className="siteHeader">
            <div className="brandWrap">
              <p className="brandKicker">Personal Reading OS</p>
              <h1>Library Tracker</h1>
            </div>
            <AppNav />
          </header>
          <main className="shellMain">{children}</main>
        </div>
      </body>
    </html>
  );
}
