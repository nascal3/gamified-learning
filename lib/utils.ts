import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateLevel(points: number) {
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export function calculateNextLevelPoints(points: number) {
  const currentLevel = calculateLevel(points);
  return Math.pow(currentLevel, 2) * 100;
}