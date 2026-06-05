import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SECRET_KEY || "TileMasterPro_SuperSecretKey_ChangeInProd_2026";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = session.user;

    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id));

    const activeSubscription = userSubscriptions[0] || null;

    let accessStatus = "active";
    if (activeSubscription) {
      if (activeSubscription.accountStatus === "blocked") {
        accessStatus = "blocked";
      } else if (activeSubscription.accountStatus === "expired") {
        accessStatus = "expired";
      } else if (
        activeSubscription.trialEndDate &&
        new Date() > activeSubscription.trialEndDate &&
        activeSubscription.planType === "trial"
      ) {
        await db
          .update(subscriptions)
          .set({
            accountStatus: "expired",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, activeSubscription.id));
        accessStatus = "expired";
      } else if (
        activeSubscription.subscriptionEndDate &&
        new Date() > activeSubscription.subscriptionEndDate
      ) {
        await db
          .update(subscriptions)
          .set({
            accountStatus: "expired",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, activeSubscription.id));
        accessStatus = "expired";
      }
    }

    const fastApiToken = jwt.sign(
      {
        sub: user.email,
        userId: user.id,
        name: user.name,
        accessStatus,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token: fastApiToken,
      tokenType: "bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: activeSubscription
        ? {
            planType: activeSubscription.planType,
            accountStatus: accessStatus,
            trialEndDate: activeSubscription.trialEndDate,
            subscriptionEndDate: activeSubscription.subscriptionEndDate,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Exchange failed", detail: error.message },
      { status: 500 }
    );
  }
}
