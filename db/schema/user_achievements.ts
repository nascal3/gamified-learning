import {pgTable, text, timestamp, uniqueIndex} from "drizzle-orm/pg-core";
import { users } from "./users";
import { achievement } from "./achievement";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";

export const userAchievements = pgTable("user_achievements", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id).notNull(),
  achievementId: text("achievement_id").references(() => achievement.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
},(table) => {
  return {
    uniqueUserAchievement: uniqueIndex("unique_user_achievement_idx").on(
        table.userId,
        table.achievementId
    ),
  }
});

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
  users: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  }),
  achievement: one(achievement, {
    fields: [userAchievements.achievementId],
    references: [achievement.id]
  })
}))
