"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { MODULES, STATUS_CONFIG } from "@/lib/modules";

interface User {
  name: string;
  email: string;
  avatar: string | null;
}

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [width, setWidth] = useState(1200);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!frameRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 760;
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const mods = MODULES.map((m) => ({ ...m, ...STATUS_CONFIG[m.status] }));
  const handleSignOut = () => signOut({ callbackUrl: "/login" });

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
    },
  ];

  return (
    <div
      ref={frameRef}
      style={{
        flex: narrow ? 1 : "none",
        display: "flex",
        flexDirection: narrow ? "column" : "row",
        height: narrow ? "auto" : "100vh",
        minHeight: 0,
      }}
    >
      {/* Desktop sidebar */}
      {!narrow && (
        <aside
          style={{
            width: 248,
            flex: "none",
            borderRight: "2px solid var(--color-divider)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              padding: "var(--space-4)",
              borderBottom: "2px solid var(--color-divider)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                background: "var(--color-accent)",
                display: "block",
              }}
            />
            Workbench
          </div>
          <nav
            style={{
              flex: 1,
              overflow: "auto",
              padding: "var(--space-3) 0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover-row"
                style={{
                  textDecoration: "none",
                  cursor: "pointer",
                  padding: "6px var(--space-4) 6px calc(var(--space-4) - 3px)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.active
                    ? "var(--color-accent)"
                    : "var(--color-text)",
                  borderLeft: `3px solid ${item.active ? "var(--color-accent)" : "transparent"}`,
                  display: "block",
                }}
              >
                {item.label}
              </Link>
            ))}
            <h6
              className="text-muted"
              style={{
                padding: "var(--space-4) var(--space-4) var(--space-1)",
                margin: 0,
                fontSize: 11,
              }}
            >
              Modules
            </h6>
            {mods.map((m) => {
              const clickable = m.status === "live" || m.status === "building";
              const isActive = clickable && pathname.startsWith(m.href);
              const style: React.CSSProperties = {
                textDecoration: "none",
                padding: "5px var(--space-4)",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: clickable ? "pointer" : "default",
                color: isActive
                  ? "var(--color-accent)"
                  : m.status === "planned"
                    ? "color-mix(in srgb, var(--color-text) 55%, transparent)"
                    : "var(--color-text)",
              };
              const dot = (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    flex: "none",
                    background: isActive ? "var(--color-accent)" : m.dot,
                  }}
                />
              );
              if (clickable) {
                return (
                  <Link key={m.no} href={m.href} className="hover-row" style={style}>
                    {dot}
                    {m.title}
                  </Link>
                );
              }
              return (
                <div key={m.no} style={style}>
                  {dot}
                  {m.title}
                </div>
              );
            })}
          </nav>
          <div
            style={{
              borderTop: "2px solid var(--color-divider)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                flex: "none",
                background: user.avatar ? "transparent" : "var(--color-text)",
                color: "var(--color-bg)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 13,
                overflow: "hidden",
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                initials
              )}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                lineHeight: 1.3,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </div>
              <div
                className="text-muted"
                style={{
                  fontSize: 11,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="btn btn-icon"
              style={{ width: 32, height: 32 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <path d="M9 21H4V3h5M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile header */}
      {narrow && (
        <>
          <header
            style={{
              position: "sticky",
              top: 0,
              background: "var(--color-bg)",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "2px solid var(--color-divider)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                fontSize: 18,
                marginRight: "auto",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  background: "var(--color-accent)",
                  display: "block",
                }}
              />
              Workbench
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn btn-icon btn-secondary"
              style={{ width: 44, height: 44 }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <path
                  d={
                    menuOpen
                      ? "M6 6l12 12M18 6 6 18"
                      : "M3 6h18M3 12h18M3 18h18"
                  }
                />
              </svg>
            </button>
          </header>
          {menuOpen && (
            <nav
              style={{
                borderBottom: "2px solid var(--color-divider)",
                display: "flex",
                flexDirection: "column",
                padding: "var(--space-2) 0",
              }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="hover-row"
                  style={{
                    textDecoration: "none",
                    cursor: "pointer",
                    padding:
                      "10px var(--space-4) 10px calc(var(--space-4) - 3px)",
                    fontWeight: 600,
                    color: item.active
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                    borderLeft: `3px solid ${item.active ? "var(--color-accent)" : "transparent"}`,
                    display: "block",
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <h6
                className="text-muted"
                style={{
                  padding: "var(--space-3) var(--space-4) var(--space-1)",
                  margin: 0,
                  fontSize: 11,
                }}
              >
                Modules
              </h6>
              {mods.map((m) => {
                const clickable = m.status === "live" || m.status === "building";
                const isActive = clickable && pathname.startsWith(m.href);
                const style: React.CSSProperties = {
                  textDecoration: "none",
                  padding: "10px var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: isActive
                    ? "var(--color-accent)"
                    : m.status === "planned"
                      ? "color-mix(in srgb, var(--color-text) 55%, transparent)"
                      : "var(--color-text)",
                };
                const dot = (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: isActive ? "var(--color-accent)" : m.dot,
                    }}
                  />
                );
                if (clickable) {
                  return (
                    <Link
                      key={m.no}
                      href={m.href}
                      onClick={() => setMenuOpen(false)}
                      style={style}
                    >
                      {dot}
                      {m.title}
                    </Link>
                  );
                }
                return (
                  <div key={m.no} style={style}>
                    {dot}
                    {m.title}
                  </div>
                );
              })}
              <button
                onClick={handleSignOut}
                className="btn btn-ghost"
                style={{
                  justifyContent: "flex-start",
                  padding: "10px var(--space-4)",
                  marginTop: "var(--space-2)",
                  borderTop: "1px solid var(--color-divider)",
                }}
              >
                Sign out
              </button>
            </nav>
          )}
        </>
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: narrow ? "visible" : "auto",
          padding: "clamp(20px,4vw,48px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(24px,4vw,40px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
