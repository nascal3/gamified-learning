import { pgTable, text, integer, json } from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/_relations";
import { userAchievements } from "@/db/schema/user_achievements";

export const achievement = pgTable("achievement", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  points: integer("points").default(50).notNull(),
  criteria: json("criteria").notNull(),
});

export const achievementRelation = relations(achievement, ({many}) => ({
  users: many(userAchievements)
}))

