import  { auth } from "@clerk/nextjs/server"
import {NextResponse} from "next/server";
import {db} from "@/db/drizzle";
import {achievement, userAchievements, users} from "@/db/schema";
import {eq} from "drizzle-orm";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
        if (!dbUser.length) {
            return new NextResponse("User not found", {status: 404})
        }
        const user = dbUser[0];

        const allAchievements = await db.select().from(achievement);

        const userAchievementsList = await db.select().from(userAchievements).where(
            eq(userAchievements.userId, user.id)
        );

        const earnedAchievementsIds =  new Set(
            userAchievementsList.map((achievement) => achievement.achievementId)
        )

        const achievementsWithStatus = allAchievements.map((achievement) => ({
            ...achievement,
            earned: earnedAchievementsIds.has(achievement.id),
            earnedAt: userAchievementsList.find(
                (achievement) => achievement.achievementId === achievement.id
            )?.earnedAt,
        }));

        return NextResponse.json(achievementsWithStatus, {status: 200})

    } catch (err) {
        console.error("[ACHIEVEMENTS GET]", err);
        return new NextResponse(`Internal server error: ${err}`, {status: 500});
    }
}