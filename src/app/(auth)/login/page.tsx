import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const instant = false;

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <>
      <div>
        <h6
          style={{
            color: "var(--color-accent)",
            marginBottom: "var(--space-3)",
          }}
        >
          01 — Authenticate
        </h6>
        <h1 style={{ margin: 0, textWrap: "pretty" }}>
          Welcome to Workbench.
        </h1>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
          Enter your email and we&apos;ll send a one-time code. New here? Your
          account is created automatically — no password needed.
        </p>
      </div>

      <LoginForm />
    </>
  );
}
