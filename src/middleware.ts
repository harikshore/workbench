import NextAuth from "next-auth";

const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const authRoutes = ["/login", "/verify"];
  const protectedRoutes = ["/dashboard", "/onboarding"];

  if (authRoutes.includes(pathname) && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
