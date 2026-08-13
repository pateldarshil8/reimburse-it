import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const employee = await prisma.user.upsert({
    where: { email: "employee@cdf.org" },
    update: {},
    create: {
      name: "Erin Employee",
      email: "employee@cdf.org",
      passwordHash: password,
      role: "employee",
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: "employee2@cdf.org" },
    update: {},
    create: {
      name: "Evan Employee",
      email: "employee2@cdf.org",
      passwordHash: password,
      role: "employee",
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@cdf.org" },
    update: {},
    create: {
      name: "Rita Reviewer",
      email: "reviewer@cdf.org",
      passwordHash: password,
      role: "reviewer",
    },
  });

  console.log("Seeded users:");
  console.log(`  employee: ${employee.email} / password123`);
  console.log(`  employee2: ${employee2.email} / password123`);
  console.log(`  reviewer: ${reviewer.email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
