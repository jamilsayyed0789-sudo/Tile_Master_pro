import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import { users, sessions, accounts, verifications, subscriptions } from "@/db/schema";
// import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  /* === TRIAL SUBSCRIPTION DISABLED FOR DEMO — re-enable later === */
  // databaseHooks: {
  //   user: {
  //     create: {
  //       after: async (user) => {
  //         const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  //         await db.insert(subscriptions).values({
  //           id: crypto.randomUUID(),
  //           userId: user.id,
  //           planType: "trial",
  //           trialEndDate: trialEnd,
  //           accountStatus: "active",
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         });
  //       },
  //     },
  //   },
  // },
});
