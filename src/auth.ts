import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig, type AppRole } from "@/auth.config";
import { prisma } from "@/lib/prisma";

// Thrown instead of returning null so loginAction (src/app/login/actions.ts)
// can show "Account Deactivated, Contact System Admin" instead of the
// generic "Invalid email or password" -- distinguished from other
// authorize() failures via `code`, checked in the catch block there.
export class AccountDeactivatedError extends CredentialsSignin {
  code = "account_deactivated";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Lowercased/trimmed the same way signup stores it (src/lib/password.ts
        // / src/app/signup/actions.ts both lowercase the email before saving) --
        // without this, typing an email with different casing than it was
        // stored with (e.g. autocapitalized on a phone keyboard) fails the
        // exact-match lookup and shows the generic "Invalid email or
        // password" error even though the password itself is correct.
        const email = (credentials?.email as string | undefined)
          ?.trim()
          .toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Deactivated accounts (admin-managed, see /admin) can't sign in,
        // even with a correct password. Checked only after the password is
        // confirmed correct, so a wrong-password guess never reveals
        // whether a given account exists/is deactivated.
        if (user.accountStatus !== "active") {
          throw new AccountDeactivatedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Overrides authConfig's shared session callback (which just copies the
    // JWT's cached role onto session.user, cheap enough to also run at the
    // edge in src/proxy.ts). Here, on the Node runtime, every session read
    // re-checks the user's CURRENT role in the database instead of trusting
    // the role baked into the JWT at login time. Without this, an admin
    // changing someone's role while they're already signed in had no
    // visible effect until that user manually signed out and back in --
    // Server Components/Actions (which is what actually decides page
    // content and admin/reviewer permissions) kept using the stale
    // JWT-cached role for the rest of that session.
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as AppRole;
        session.user.id = token.id as string;

        if (token.id) {
          const current = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (current) {
            session.user.role = current.role;
          }
        }
      }
      return session;
    },
  },
});
