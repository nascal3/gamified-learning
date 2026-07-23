import { pgTable, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";

export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(
      () => users.id, { onDelete: "cascade" }
  ),
  courseId: text("course_id").notNull().references(
      () => courses.id, { onDelete: "cascade" }
  ),
  completed: boolean("completed").default(false).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => {
  return {
    uniqueEnrollment: uniqueIndex("unique_enrollment_idx").on(
        table.userId,
        table.courseId
    ),
  }
});

export const enrollmentRelations = relations(enrollments, ({one}) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id]
  }),
  courseId: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id]
  })
}))
