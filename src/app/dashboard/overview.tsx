"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MODULES, STATUS_CONFIG } from "@/lib/modules";
import type { ModuleStatus } from "@/lib/modules";

interface User {
  name: string;
  email: string;
  method: string;
  verified: boolean;
}

type Filter = "all" | "live" | "next";

export function Overview({ user }: { user: User }) {
  const [filter, setFilter] = useState<Filter>("all");

  const firstName = user.name.split(" ")[0];
  const h = new Date().getHours();
  const greeting =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const sessionStarted = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const mods = MODULES.map((m) => ({ ...m, ...STATUS_CONFIG[m.status] }));
  const liveCount = mods.filter((m) => m.status === "live").length;
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: mods.length },
    { key: "live", label: "Live", count: liveCount },
    { key: "next", label: "Up next", count: mods.length - liveCount },
  ];
  const shown = mods.filter((m) =>
    filter === "all"
      ? true
      : filter === "live"
        ? m.status === "live"
        : m.status !== "live",
  );

  const sessionItems = [
    { k: "Signed in as", v: user.email, color: "var(--color-text)" },
    { k: "Method", v: user.method, color: "var(--color-text)" },
    {
      k: "Email",
      v: user.verified ? "Verified" : "Not verified",
      color: user.verified ? "var(--color-text)" : "var(--color-accent-700)",
    },
    { k: "Session started", v: sessionStarted, color: "var(--color-text)" },
  ];

  return (
    <>
      {/* Hero */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "var(--space-4)",
          borderBottom: "2px solid var(--color-divider)",
          paddingBottom: "var(--space-6)",
        }}
      >
        <div style={{ flex: "1 1 320px" }}>
          <h6
            className="text-muted"
            style={{ marginBottom: "var(--space-3)" }}
          >
            {today}
          </h6>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px,5vw,56px)",
              textWrap: "pretty",
            }}
          >
            {greeting},{" "}
            <span style={{ color: "var(--color-accent)" }}>{firstName}</span>.
          </h1>
          <p
            className="text-muted"
            style={{
              margin: "var(--space-3) 0 0",
              maxWidth: "52ch",
            }}
          >
            Everything here runs for real. Pick a module, try it, and come
            back — new ones ship regularly.
          </p>
        </div>
      </section>

      {/* Session info */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <h6 style={{ margin: 0 }}>Your session</h6>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
            borderTop: "2px solid var(--color-divider)",
            borderLeft: "2px solid var(--color-divider)",
          }}
        >
          {sessionItems.map((s) => (
            <div
              key={s.k}
              style={{
                borderRight: "2px solid var(--color-divider)",
                borderBottom: "2px solid var(--color-divider)",
                padding: "var(--space-3) var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 0,
              }}
            >
              <span
                className="text-muted"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.k}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  overflowWrap: "anywhere",
                  color: s.color,
                }}
              >
                {s.v}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <h2 style={{ margin: 0, marginRight: "auto" }}>Modules</h2>
          <div
            style={{
              display: "inline-flex",
              overflow: "hidden",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {filters.map((f, i) => (
              <label
                key={f.key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  borderLeft:
                    i > 0 ? "1px solid var(--color-divider)" : "none",
                  background:
                    filter === f.key ? "var(--color-accent)" : "transparent",
                  color:
                    filter === f.key ? "var(--color-bg)" : "var(--color-text)",
                }}
              >
                <input
                  type="radio"
                  name="flt"
                  checked={filter === f.key}
                  onChange={() => setFilter(f.key)}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                  }}
                />
                {f.label}
                <span style={{ opacity: 0.6 }}>{f.count}</span>
              </label>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            borderTop: "2px solid var(--color-divider)",
            borderLeft: "2px solid var(--color-divider)",
          }}
        >
          {shown.map((m) => (
            <ModuleCard key={m.no} module={m} />
          ))}
        </div>
      </section>
    </>
  );
}

function ModuleCard({
  module: m,
}: {
  module: {
    no: string;
    title: string;
    desc: string;
    status: ModuleStatus;
    href: string;
    label: string;
    tagClass: string;
    cta: string;
    btnStyle: "primary" | "secondary";
  };
}) {
  const router = useRouter();
  const isPrimary = m.btnStyle === "primary";
  const isLive = m.status === "live";

  const tagStyles: Record<string, React.CSSProperties> = {
    "tag-accent": {
      background: "var(--color-accent-100)",
      color: "var(--color-accent-800)",
    },
    "tag-outline": {
      border: "1px solid var(--color-accent)",
      color: "var(--color-accent)",
      background: "transparent",
    },
    "tag-neutral": {
      background: "var(--color-neutral-100)",
      color: "var(--color-neutral-800)",
    },
  };

  return (
    <article
      style={{
        borderRight: "2px solid var(--color-divider)",
        borderBottom: "2px solid var(--color-divider)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        minHeight: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="text-muted"
          style={{
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.04em",
          }}
        >
          {m.no}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 11,
            letterSpacing: "0.02em",
            padding: "3px 10px",
            borderRadius: 0,
            ...tagStyles[m.tagClass],
          }}
        >
          {m.label}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 20,
            lineHeight: 1.15,
            marginBottom: 6,
          }}
        >
          {m.title}
        </div>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{m.desc}</p>
      </div>
      <button
        disabled={!isLive}
        onClick={() => router.push(m.href)}
        className={`btn ${isPrimary ? "btn-primary" : "btn-secondary"} btn-block`}
        style={{
          justifyContent: "space-between",
          minHeight: 40,
          margin: 0,
        }}
      >
        {m.cta}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </article>
  );
}
