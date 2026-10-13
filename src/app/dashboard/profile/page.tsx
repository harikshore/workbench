import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { ProfileForm } from "./profile-form";

export const instant = false;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ProfileForm
      user={{
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || null,
        country: user.country || "",
        timezone: user.timezone || "",
        emailVerified: !!user.emailVerified,
      }}
    />
  );
}
