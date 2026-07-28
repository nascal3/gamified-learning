import {pgTable, text, boolean, timestamp, uniqueIndex} from "drizzle-orm/pg-core";
import { users } from "./users";
import { lessons } from "./lessons";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";

export const progress = pgTable("progress", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, {onDelete: "cascade"}).notNull(),
  lessonId: text("lesson_id").references(() => lessons.id, {onDelete: "cascade"}).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => {
  return {
    uniqueProgress: uniqueIndex("unique_progress_idx").on(
        table.userId,
        table.lessonId
    ),
  }
});

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id]
  }),
  lesson: one(lessons, {
    fields: [progress.lessonId],
    references: [lessons.id]
  })

}))
