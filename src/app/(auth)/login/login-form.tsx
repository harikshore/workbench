"use client";

import { useActionState } from "react";
import { sendOTP } from "@/actions/auth";

export function LoginForm() {
  const [error, action, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const email = formData.get("email") as string;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Enter a valid email address.";
      }
      try {
        await sendOTP(email);
        return null;
      } catch {
        return "Something went wrong. Please try again.";
      }
    },
    null,
  );

  return (
    <form
      action={action}
      className="flex flex-col"
      style={{ gap: "var(--space-4)" }}
    >
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          className="input"
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
        {isPending ? "Sending..." : "Email me a code"}
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
  );
}
