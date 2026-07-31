import {auth} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import {db} from "@/db/drizzle";
import {courses, enrollments, progress, users} from "@/db/schema";
import {and, eq, inArray} from "drizzle-orm";

export async function GET(req: Request, {params}: {params: Promise<{courseId: string}>}) {
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
            with: {
                lessons: {
                    orderBy: (lessons: any, {asc}: any) => [asc(lessons.order)]
                }
            }
        });

        if (!course) {
            return new NextResponse("Course not found", {status: 404});
        }

        const enrollment = await (db as any).query.enrollments.findFirst({
            where: and(
                eq(enrollments.userId, user.id),
                eq(enrollments.courseId, courseId),
            )
        });

        //get progress for each lesson if enrolled
        let lessonsWithProgress = course?.lessons;
        if (enrollment) {
            const lessonsIds = course.lessons?.map((lesson: any) => lesson.id);
            const userProgress = await (db as any).query.progresss.findMany({
                where: and(
                    eq(progress.userId, user.id),
                    inArray(progress.lessonId, lessonsIds),
                ),
            });

            lessonsWithProgress = course.lessons.map((lesson: any) => ({
                ...lesson,
                completed: userProgress.some(
                    (p) => p.lessonId === lesson.id && p.completed,
                )
            }));
        } else {
            lessonsWithProgress = course.lessons.map((lesson: any) => ({
                ...lesson,
                completed: false,
            }));
        }

        return NextResponse.json({
            ...course,
            lessons: lessonsWithProgress,
            enrolled: !!enrollment,
            completed: enrollment?.completed || false,
        })

    } catch (err) {
        return new NextResponse(`[COURSE_GET]: ${err}`, {status: 500});
    }
}