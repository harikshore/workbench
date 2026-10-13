import { getUserCourse } from "@/actions/lms";
import { getCurrentUser } from "@/actions/user";
import { LmsClient } from "./lms-client";

export const instant = false;

export default async function LmsPage() {
  const [course, user] = await Promise.all([getUserCourse(), getCurrentUser()]);
  return (
    <LmsClient
      course={course ? JSON.parse(JSON.stringify(course)) : null}
      userName={user?.name || ""}
    />
  );
}
