"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function sendOTP(email: string) {
  await signIn("email-otp", {
    email,
    redirect: false,
  });
  redirect(`/verify?email=${encodeURIComponent(email)}`);
}
