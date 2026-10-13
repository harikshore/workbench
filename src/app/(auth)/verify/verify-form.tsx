"use client";

import { useState } from "react";

export function VerifyForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = () => {
    if (code.length !== 6) {
      setError("The code is 6 digits.");
      return;
    }
    setIsPending(true);
    setError(null);
    window.location.href = `/api/auth/callback/email-otp?token=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent("/dashboard")}`;
  };

  const handleResend = async () => {
    setResent(true);
    const { sendOTP } = await import("@/actions/auth");
    try {
      await sendOTP(email);
    } catch {
      // sendOTP redirects, which throws on the client
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
        className="flex flex-col"
        style={{ gap: "var(--space-4)" }}
      >
        <div className="field">
          <label htmlFor="code">Sign-in code</label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            className="input"
            style={{
              fontSize: 28,
              letterSpacing: "0.4em",
              fontWeight: 600,
              minHeight: 56,
            }}
          />
          {error && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-accent-700)",
                marginTop: 5,
              }}
            >
              {error}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary btn-block"
          style={{
            minHeight: 44,
            justifyContent: "space-between",
            marginTop: "var(--space-2)",
          }}
        >
          {isPending ? "Verifying..." : "Verify and continue"}
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
      </form>

      <div
        className="flex items-center flex-wrap"
        style={{
          borderTop: "2px solid var(--color-divider)",
          paddingTop: "var(--space-4)",
          gap: "var(--space-2)",
          fontSize: 14,
        }}
      >
        Didn&apos;t get it?
        <button className="btn btn-ghost" onClick={handleResend}>
          {resent ? "Sent again" : "Resend"}
        </button>
        <a
          href="/login"
          className="btn btn-ghost"
          style={{ color: "var(--color-text)" }}
        >
          Use a different email
        </a>
      </div>
    </>
  );
}
