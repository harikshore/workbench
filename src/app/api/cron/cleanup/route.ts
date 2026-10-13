import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();
const INACTIVE_DAYS = 5;
const OWNER_EMAIL = "harikshoresridharan@gmail.com";

function fileKeyFromUrl(url: string): string | null {
  try {
    return new URL(url).pathname.split("/").pop() || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);

  const inactiveUsers = await db.user.findMany({
    where: {
      lastActiveAt: { lt: cutoff },
      NOT: { email: OWNER_EMAIL },
    },
    select: { id: true, email: true, avatar: true },
  });

  let deletedUsers = 0;
  let deletedAvatars = 0;
  let deletedTokens = 0;

  for (const user of inactiveUsers) {
    if (user.avatar) {
      const key = fileKeyFromUrl(user.avatar);
      if (key) {
        try {
          await utapi.deleteFiles(key);
          deletedAvatars++;
        } catch {}
      }
    }

    await db.account.deleteMany({ where: { userId: user.id } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
    deletedUsers++;
  }

  const expiredTokens = await db.verificationToken.deleteMany({
    where: { expires: { lt: new Date() } },
  });
  deletedTokens = expiredTokens.count;

  return NextResponse.json({
    ok: true,
    deletedUsers,
    deletedAvatars,
    deletedTokens,
    cutoff: cutoff.toISOString(),
  });
}
