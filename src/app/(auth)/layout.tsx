export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ minHeight: "100vh", background: "var(--color-neutral-300)" }}
      className="flex justify-center"
    >
      <div
        style={{
          background: "var(--color-bg)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
        }}
        className="w-full max-w-full min-h-screen flex flex-col"
      >
        <header
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: "2px solid var(--color-divider)" }}
        >
          <span
            className="block"
            style={{
              width: 14,
              height: 14,
              background: "var(--color-accent)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-heading-weight)" as any,
              fontSize: 18,
              marginRight: "auto",
            }}
          >
            Workbench
          </span>
          <span className="text-muted hidden sm:inline" style={{ fontSize: 13 }}>
            Your app can have these features too
          </span>
        </header>

        <main className="flex-1 flex">
          <div
            className="w-full flex flex-col max-w-none md:max-w-[440px] md:border-r-2"
            style={{
              padding: "clamp(24px,6vw,64px) clamp(16px,5vw,48px)",
              gap: "var(--space-6)",
              borderColor: "var(--color-divider)",
            }}
          >
            {children}
          </div>

          <div
            className="flex-1 min-w-0 hidden md:flex"
            style={{ padding: "clamp(24px,4vw,48px)" }}
          >
            <div className="grayscale flex-1 min-w-0 relative">
              <img
                src="/auth-banner.jpg"
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </main>

        <footer
          className="flex gap-4 flex-wrap text-muted"
          style={{
            borderTop: "2px solid var(--color-divider)",
            padding: "var(--space-3) var(--space-4)",
            fontSize: 12,
          }}
        >
          <span>&copy; 2026 buttersmoothbuilds</span>
          {/* <span style={{ marginLeft: "auto" }}>Privacy &middot; Terms</span> */}
        </footer>
      </div>
    </div>
  );
}
