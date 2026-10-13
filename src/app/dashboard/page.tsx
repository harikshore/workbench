import { getCurrentUser } from "@/actions/user";
import { Overview } from "./overview";

export const instant = false;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <Overview
      user={{
        name: user?.name || nameFromEmail(user?.email || ""),
        email: user?.email || "",
        method: "Email code",
        verified: !!user?.emailVerified,
      }}
    />
  );
}

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
