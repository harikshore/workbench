import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VerifyForm } from "./verify-form";

export const instant = false;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const { email } = await searchParams;
  if (!email) redirect("/login");

  return (
    <>
      <div
        style={{
          width: 48,
          height: 48,
          background: "var(--color-accent)",
          color: "var(--color-bg)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        >
          <rect x="2" y="4" width="20" height="16" />
          <path d="m22 7-10 6L2 7" />
        </svg>
      </div>

      <div>
        <h6
          style={{
            color: "var(--color-accent)",
            marginBottom: "var(--space-3)",
          }}
        >
          02 — Check your email
        </h6>
        <h1 style={{ margin: 0, textWrap: "pretty" }}>Enter your code.</h1>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
          We sent a 6-digit code to{" "}
          <strong style={{ color: "var(--color-text)" }}>{email}</strong>. It
          expires in 10 minutes.
        </p>
      </div>

      <VerifyForm email={email} />
    </>
  );
}
