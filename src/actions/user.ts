"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
  });
}

export async function updateUserName(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  return db.user.update({
    where: { id: session.user.id },
    data: { name },
  });
}

export async function completeOnboarding(data: {
  name: string;
  country: string;
  timezone: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  return db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      country: data.country,
      timezone: data.timezone,
      onboarded: true,
    },
  });
}

export async function updateProfile(data: {
  name: string;
  country: string;
  timezone: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  return db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      country: data.country,
      timezone: data.timezone,
    },
  });
}

function fileKeyFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const key = path.split("/").pop();
    return key || null;
  } catch {
    return null;
  }
}

export async function removeAvatar() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.avatar) {
    const key = fileKeyFromUrl(user.avatar);
    if (key) {
      try { await utapi.deleteFiles(key); } catch {}
    }
  }

  return db.user.update({
    where: { id: session.user.id },
    data: { avatar: null },
  });
}
