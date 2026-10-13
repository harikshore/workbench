import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const f = createUploadthing();
const utapi = new UTApi();

export const uploadRouter = {
  avatar: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const user = await db.user.findUnique({ where: { id: metadata.userId } });
      if (user?.avatar) {
        try {
          const oldKey = new URL(user.avatar).pathname.split("/").pop();
          if (oldKey) await utapi.deleteFiles(oldKey);
        } catch {}
      }

      await db.user.update({
        where: { id: metadata.userId },
        data: { avatar: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
