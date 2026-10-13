import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { DashboardShell } from "./dashboard-shell";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await getCurrentUser();
  if (!user?.onboarded) redirect("/onboarding");

  return (
    <DashboardShell
      user={{
        name: user.name || session.user.email?.split("@")[0] || "",
        email: user.email || session.user.email || "",
        avatar: user.avatar || null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
