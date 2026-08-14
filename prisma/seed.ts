import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client/client";
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

  const admin = await prisma.user.upsert({
    where: { email: "admin@cdf.org" },
    update: {},
    create: {
      name: "Alex Admin",
      email: "admin@cdf.org",
      passwordHash: password,
      role: "admin",
    },
  });

  console.log("Seeded users:");
  for (const u of [employee, employee2, reviewer, admin]) {
    console.log(`  ${u.role}: ${u.email} / password123`);
  }

  // --- Sample expense requests -------------------------------------------
  // Covers the scenarios CDF's sample-data guidance calls out. A request
  // demonstrating an *invalid* amount is intentionally NOT seeded here --
  // that scenario is meant to be triggered live through the app's own
  // validation (see docs/testing.md), not persisted as bad data.

  const existingRequests = await prisma.expenseRequest.count();
  if (existingRequests > 0) {
    console.log("Expense requests already seeded, skipping.");
    await prisma.$disconnect();
    return;
  }

  // 1. Valid office-supply request, submitted and awaiting review.
  const officeSupplies = await prisma.expenseRequest.create({
    data: {
      submitterId: employee.id,
      title: "Printer paper and toner",
      description: "Restocked office supplies for the volunteer coordination desk.",
      category: "Office supplies",
      expenseDate: new Date("2026-08-05"),
      totalAmount: "84.50",
      currency: "USD",
      receiptUrl: "https://example.com/receipts/office-supplies.pdf",
      receiptName: "office-supplies-receipt.pdf",
      receiptType: "application/pdf",
      status: "submitted",
    },
  });
  await prisma.reviewAction.create({
    data: {
      requestId: officeSupplies.id,
      action: "submitted",
      previousStatus: "draft",
      newStatus: "submitted",
    },
  });

  // 2. Travel request missing a receipt (still in draft, not yet submittable).
  await prisma.expenseRequest.create({
    data: {
      submitterId: employee.id,
      title: "Regional volunteer summit travel",
      description: "Round-trip mileage and parking for the Aug volunteer summit.",
      category: "Travel",
      expenseDate: new Date("2026-08-10"),
      totalAmount: "142.00",
      currency: "USD",
      status: "draft",
    },
  });

  // 3. Approved request, awaiting payment.
  const training = await prisma.expenseRequest.create({
    data: {
      submitterId: employee2.id,
      title: "Volunteer coordination training course",
      description: "Online course on nonprofit volunteer program management.",
      category: "Training",
      expenseDate: new Date("2026-07-28"),
      totalAmount: "199.00",
      currency: "USD",
      receiptUrl: "https://example.com/receipts/training.pdf",
      receiptName: "training-receipt.pdf",
      receiptType: "application/pdf",
      status: "approved",
    },
  });
  await prisma.reviewAction.createMany({
    data: [
      {
        requestId: training.id,
        action: "submitted",
        previousStatus: "draft",
        newStatus: "submitted",
      },
      {
        requestId: training.id,
        reviewerId: reviewer.id,
        action: "approved",
        comment: "Approved -- relevant to current programming needs.",
        previousStatus: "submitted",
        newStatus: "approved",
      },
    ],
  });
  await prisma.notification.create({
    data: {
      userId: employee2.id,
      requestId: training.id,
      message: "Your request 'Volunteer coordination training course' was approved.",
    },
  });

  // 4. Rejected request, with a reason.
  const meal = await prisma.expenseRequest.create({
    data: {
      submitterId: employee2.id,
      title: "Team lunch during planning session",
      description: "Lunch for a 6-person planning meeting.",
      category: "Meals",
      expenseDate: new Date("2026-08-01"),
      totalAmount: "310.00",
      currency: "USD",
      receiptUrl: "https://example.com/receipts/team-lunch.jpg",
      receiptName: "team-lunch-receipt.jpg",
      receiptType: "image/jpeg",
      status: "rejected",
    },
  });
  await prisma.reviewAction.createMany({
    data: [
      {
        requestId: meal.id,
        action: "submitted",
        previousStatus: "draft",
        newStatus: "submitted",
      },
      {
        requestId: meal.id,
        reviewerId: reviewer.id,
        action: "rejected",
        comment: "Exceeds the per-meal reimbursement guideline for a 6-person meeting. Please resubmit with an itemized receipt and updated amount.",
        previousStatus: "submitted",
        newStatus: "rejected",
      },
    ],
  });
  await prisma.notification.create({
    data: {
      userId: employee2.id,
      requestId: meal.id,
      message: "Your request 'Team lunch during planning session' was rejected.",
    },
  });

  // 5. Paid request -- full lifecycle.
  const software = await prisma.expenseRequest.create({
    data: {
      submitterId: employee.id,
      title: "Design software subscription",
      description: "Monthly subscription used for CDF flyer and newsletter design.",
      category: "Software or subscriptions",
      expenseDate: new Date("2026-07-15"),
      totalAmount: "52.99",
      currency: "USD",
      receiptUrl: "https://example.com/receipts/software.pdf",
      receiptName: "software-receipt.pdf",
      receiptType: "application/pdf",
      status: "paid",
    },
  });
  await prisma.reviewAction.createMany({
    data: [
      {
        requestId: software.id,
        action: "submitted",
        previousStatus: "draft",
        newStatus: "submitted",
      },
      {
        requestId: software.id,
        reviewerId: reviewer.id,
        action: "approved",
        comment: "Approved.",
        previousStatus: "submitted",
        newStatus: "approved",
      },
      {
        requestId: software.id,
        reviewerId: reviewer.id,
        action: "paid",
        comment: "Reimbursed via bank transfer.",
        previousStatus: "approved",
        newStatus: "paid",
      },
    ],
  });
  await prisma.notification.createMany({
    data: [
      {
        userId: employee.id,
        requestId: software.id,
        message: "Your request 'Design software subscription' was approved.",
      },
      {
        userId: employee.id,
        requestId: software.id,
        message: "Your request 'Design software subscription' was marked as paid.",
        readAt: new Date(),
      },
    ],
  });

  console.log("Seeded 5 sample expense requests across draft/submitted/approved/rejected/paid states.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
