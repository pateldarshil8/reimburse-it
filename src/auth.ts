import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
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
        const email = credentials?.email as string | undefined;
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
  },
});
