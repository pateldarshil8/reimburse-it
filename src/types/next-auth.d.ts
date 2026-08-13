import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "employee" | "reviewer";
  }

  interface Session {
    user: {
      role: "employee" | "reviewer";
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "employee" | "reviewer";
    id: string;
  }
}
