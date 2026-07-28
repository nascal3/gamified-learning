import {auth, currentUser} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import {db} from "@/db/drizzle";
import {courses, enrollments, lessons, progress, users} from "@/db/schema";
import {and, desc, eq} from "drizzle-orm";
import {calculateLevel, calculateNextLevelPoints} from "@/lib/utils";

export async function GET () {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        const clerkUser = await currentUser();
        const username = clerkUser?.username
            || clerkUser?.firstName
            || clerkUser?.emailAddresses[0]?.emailAddress?.split("@")[0]
            || "Learner";

        const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
        if (dbUser.length === 0) {
            return NextResponse.json({
                username,
                level: 1,
                totalXP: 0,
                currentStreak: 0,
                longestStreak: 0,
                nextLevelPoints: 100,
                coursesInProgress: 0,
                completeCourses: 0,
                totalLessonsCompleted: 0,
                todayProgress: 0,
                todayCompleted: 0,
                remainingToday: 3,
                recentActivity: []
            });
        }

        const user = dbUser[0];

        //Get enrollments
        const allEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, user.id));

        const completeCourses = allEnrollments.filter((course) => course.completed ).length;
        const coursesInProgress = allEnrollments.filter((course) => !course.completed ).length;

        //Get completed lessons
        const completedLessons = await db
            .select({
                id: progress.id,
                completed: progress.completed,
                completedAt: progress.completedAt,
                lessonId: lessons.id,
                lessonTitle: lessons.title,
                lessonContent: lessons.content,
                lessonVideoUrl: lessons.videoUrl,
                lessonOrder: lessons.order,
                courseId: courses.id,
                courseTitle: courses.title,
                courseDescription: courses.description,
            })
            .from(progress)
            .leftJoin(lessons, eq(progress.lessonId, lessons.id))
            .leftJoin(courses, eq(lessons.courseId, courses.id))
            .where(and(eq(progress.userId, user.id), eq(progress.completed, true)))
            .orderBy(desc(progress.completedAt));

        const totalLessonsCompleted = completedLessons.length;

        //calculate today's progress
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const todayCompleted = completedLessons.filter((lesson) => {
            if (!lesson.completedAt) return false;
            const completedDate = new Date(lesson.completedAt);
            completedDate.setHours(0,0,0,0);
            return completedDate.getTime() === today.getTime();
        }).length;

        const dailyGoal = 3;

        const todayProgress = Math.min(
            Math.round((todayCompleted / dailyGoal) * 100) / 100,
        );

        const remainingToday = Math.max(dailyGoal - todayCompleted, 0);
        
        //recent activity (5)
        const recentActivity = completedLessons.slice(0, 5).map((lesson) => ({
            id: lesson.id,
            title: lesson.lessonTitle,
            courseTitle: lesson.courseTitle,
            completedAt: lesson.completedAt,
        }));

        const level = calculateLevel(user.points);
        const nextLevelPoints = calculateNextLevelPoints(user.points);

        return NextResponse.json({
            username,
            level,
            totalXP: user.points,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            nextLevelPoints,
            coursesInProgress,
            completeCourses,
            totalLessonsCompleted,
            todayProgress,
            todayCompleted,
            remainingToday,
            recentActivity
        });

    } catch (err) {
        console.error("[UNIFIED_STATS]", err);
        return new NextResponse(`Internal Server Error: ${err}`, {status: 500});
    }
}