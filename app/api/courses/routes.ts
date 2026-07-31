import {auth} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import {db} from "@/db/drizzle";
import {enrollments, users} from "@/db/schema";
import {eq} from "drizzle-orm";

export  async function GET() {
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

        // get all courses with enrollments
        const allCourses = await db.query.courses.findMany({
            with: {
                lessons: true,
                enrollments: {
                    where: eq(enrollments.userId, user.id)
                },
            },
        });

        const formattedCourses = allCourses.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            duration: course.duration,
            points: course.points,
            totalLessons: course.totalLessons,
            enrolled: course.enrollments.length > 0,
            progress: 0
        }));

        return NextResponse.json(formattedCourses);

    } catch (err) {
        return new NextResponse("Internal Server Error", {status: 500});
    }
}