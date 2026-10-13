import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { OnboardingForm } from "./onboarding-form";

export const instant = false;

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await getCurrentUser();
  if (user?.onboarded) redirect("/dashboard");

  const emailName = (session.user.email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <div>
        <h6
          style={{
            color: "var(--color-accent)",
            marginBottom: "var(--space-3)",
          }}
        >
          03 — Set up your profile
        </h6>
        <h1 style={{ margin: 0, textWrap: "pretty" }}>Almost there.</h1>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
          Add a photo and a few details so your profile is ready to go.
        </p>
      </div>

      <OnboardingForm defaultName={emailName} />
    </>
  );
}
