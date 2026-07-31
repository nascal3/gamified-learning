import {auth} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import {db} from "@/db/drizzle";
import {and, eq} from "drizzle-orm";
import {courses, enrollments, users} from "@/db/schema";

export async function POST(req: Request, {params}: {params: Promise<{courseId: string}>}) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        const {courseId} = await params;

        const user = await (db as any).query.users.findFirst({
            where: eq(users.clerkId, userId),
        });
        if (!user) {
            return new NextResponse("User not found", {status: 404})
        }

        // Get courses with lessons
        const course = await (db as any).query.courses.findFirst({
            where: eq(courses.id, courseId),
        });

        if (!course) {
            return new NextResponse("Course not found", {status: 404});
        }

        const existingEnrollment = await (db as any).query.enrollments.findFirst({
            where: and(
                eq(enrollments.userId, user.id),
                eq(enrollments.courseId, courseId),
            )
        });

        if (existingEnrollment) {
            return NextResponse.json({
                message: "Enrollment already exists",
                enrollment: true,
            });
        }

        const enrollment = await db.insert(enrollments).values({
            userId: user.id,
            courseId: courseId,
            enrolledAt: new Date(),
            completed: false
        }).returning();

        return NextResponse.json({
            success: true,
            enrollment: enrollment[0],
            message: "Successfully enrolled in course",
        })

    } catch (err) {
        return new NextResponse(`[ENROLL_COURSE]: ${err}`, {status: 500});
    }

}

export async function DELETE(req: Request, {params}: {params: Promise<{courseId: string}>}) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        const {courseId} = await params;

        const user = await (db as any).query.users.findFirst({
            where: eq(users.clerkId, userId),
        });

        if (!user) {
            return new NextResponse("user not found", {status: 404});
        }

        await (db as any).delete(enrollments).where(
            and(
                eq(enrollments.userId, user.id),
                eq(enrollments.courseId, courseId),
            )
        );

        return NextResponse.json({
            success: true,
            message: "Successfully unenrolled from course",
        })
    } catch (err) {
        return new NextResponse(`[UNENROLL_COURSE]: ${err}`, {status: 500});
    }
}