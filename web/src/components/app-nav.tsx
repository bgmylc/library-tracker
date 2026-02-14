"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/add", label: "Add" },
  { href: "/library", label: "Library" },
  { href: "/analytics", label: "Analytics" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="navPill" aria-label="Primary">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`navLink ${isActive ? "isActive" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
