import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { courses } from "./courses";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";
import {progress} from "@/db/schema/progress";

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  courseId: text("course_id").references(() => courses.id, {onDelete: "cascade"}).notNull(),
  videoUrl: text("video_url"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonsRelations = relations(lessons, ({one, many}) => ({
  courses: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  progress: many(progress)
}))