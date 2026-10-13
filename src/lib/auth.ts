import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { sendOTPEmail } from "@/lib/email";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    {
      id: "email-otp",
      name: "Email OTP",
      type: "email",
      maxAge: 600,
      generateVerificationToken: generateOTP,
      sendVerificationRequest: async ({ identifier: email, token }) => {
        if (process.env.RESEND_API_KEY) {
          await sendOTPEmail(email, token);
        } else {
          console.log(`[AUTH] OTP for ${email}: ${token}`);
        }
      },
    },
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.id) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
          });
        } catch {}
      }
      return true;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
