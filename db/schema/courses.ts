import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";
import {lessons} from "@/db/schema/lessons";
import {enrollments} from "@/db/schema/enrollments";

export const courses = pgTable("courses", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail"),
  duration: integer("duration").notNull(),
  points: integer("points").default(100).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const courseRelations = relations(courses, ({many}) =>({
  lessons: many(lessons),
  enrollments: many(enrollments),
}))
