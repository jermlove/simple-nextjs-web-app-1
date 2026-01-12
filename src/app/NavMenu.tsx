"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Home", public: true },
  { href: "/about", label: "About", public: true },
  { href: "/dashboard", label: "Dashboard", public: false },
  { href: "/profile", label: "Profile", public: false },
];

export function NavMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav style={{ margin: "1rem 0", display: "flex", gap: 16 }}>
      {navLinks.map((link) => {
        if (!link.public && !session) return null;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontWeight: isActive ? "bold" : "normal",
              textDecoration: isActive ? "underline" : "none",
              color: isActive ? "var(--accent, #d7263d)" : "inherit",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
