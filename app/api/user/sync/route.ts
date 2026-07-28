import {auth, currentUser} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import {db} from "@/db/drizzle";
import { users } from "@/db/schema"
import {eq} from "drizzle-orm";

export async function POST() {
    try {
        const { userId } = await auth();
        const clerkUser = await currentUser();

        if (!clerkUser || !userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        const existingUser = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);

        const email =  clerkUser.emailAddresses[0]?.emailAddress;
        const name = clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
            : clerkUser.username || email?.split("@")[0] || "Learner";

        if (!existingUser) {
            const [newUser] = await db.insert(users).values({
                email: email,
                name: name,
                clerkId: userId,
                username: clerkUser.username || email?.split("@")[0],
                avatarUrl: clerkUser.imageUrl,
                points: 0,
                level: 1,
                currentStreak: 0,
                longestStreak: 0,
                lastActive: new Date(),
            })
                .returning();

            return NextResponse.json({
                success: true,
                user: newUser,
                message: "User successfully saved!",
            })
        } else {
            return NextResponse.json("user already exists!", {status: 409});
        }
    } catch (err) {
        console.log("[USER SYNC]", err);
        return NextResponse.json({
            success: false,
            details: err
        }, {status: 500 });
    }
}