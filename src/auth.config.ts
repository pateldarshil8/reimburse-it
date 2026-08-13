import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "employee" | "reviewer";
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isOnEmployee = nextUrl.pathname.startsWith("/employee");
      const isOnReviewer = nextUrl.pathname.startsWith("/reviewer");

      if (isOnEmployee || isOnReviewer) {
        if (!isLoggedIn) return false;
        if (isOnReviewer && role !== "reviewer") {
          return Response.redirect(new URL("/employee", nextUrl));
        }
        if (isOnEmployee && role !== "employee") {
          return Response.redirect(new URL("/reviewer", nextUrl));
        }
        return true;
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        const dest = role === "reviewer" ? "/reviewer" : "/employee";
        return Response.redirect(new URL(dest, nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
