import {pgTable, text, integer, timestamp, uniqueIndex} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";
import {userAchievements} from "@/db/schema/user_achievements";
import {enrollments} from "@/db/schema/enrollments";
import {progress} from "@/db/schema/progress";

export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  clerkId: text("clerk_id").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActive: timestamp("last_active"),
},(table) => {
  return {
    clerkIdIdx: uniqueIndex("clerk_id_idx").on(table.clerkId),
    emailIdx: uniqueIndex("email_idx").on(table.email),
    usernameIdx: uniqueIndex("username_idx").on(table.username),
  }
});

export const userRelations = relations(users, ({many}) => ({
  achievements: many(userAchievements),
  enrollments: many(enrollments),
  progress: many(progress),
}));
