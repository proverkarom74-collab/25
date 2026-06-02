import * as fs from "fs";
import * as path from "path";
import { MovieTitle, UserReview, UserProfile, Achievement, UserAchievement, Director, CorrectionRequest } from "./src/types";
import { SEED_MOVIES, SEED_REVIEWS, SEED_DIRECTORS } from "./server-seed";
import { ACHIEVEMENTS } from "./src/lib/achievementsData";

export interface RegisteredUserAuth {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  passwordHash: string;
  favoriteMovieSlug?: string;
  favoriteMovieTitle?: string;
  profileCoverUrl?: string;
}

export interface DatabaseSchema {
  movies: MovieTitle[];
  reviews: UserReview[];
  users: UserProfile[];
  auth: RegisteredUserAuth[];
  achievements: Achievement[];
  user_achievements: UserAchievement[];
  directors: Director[];
  correctionRequests?: CorrectionRequest[];
}

const DB_PATH = path.join(process.cwd(), "db.json");

// In-Memory Fallback Cache for Serverless/Containered Deploys
let dbCache: DatabaseSchema | null = null;

function getInitialDB(): DatabaseSchema {
  return {
    movies: [],
    reviews: [],
    users: [],
    auth: [],
    achievements: ACHIEVEMENTS,
    user_achievements: [],
    directors: SEED_DIRECTORS,
    correctionRequests: []
  };
}

export function readDB(): DatabaseSchema {
  if (dbCache) {
    return dbCache;
  }

  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = getInitialDB();
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      } catch (err) {
        console.error("Failed to write initial db.json to disk. Serving from memory fallback.", err);
      }
      dbCache = initial;
      return initial;
    }

    const content = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(content) as DatabaseSchema;
    let fallbackNeeded = false;

    // Migrate elements if missing
    if (!parsed.directors) {
      parsed.directors = SEED_DIRECTORS;
      fallbackNeeded = true;
    }
    if (!parsed.movies) {
      parsed.movies = [];
      fallbackNeeded = true;
    }
    if (!parsed.reviews) {
      parsed.reviews = [];
      fallbackNeeded = true;
    }
    if (!parsed.users) {
      parsed.users = [];
      fallbackNeeded = true;
    }
    if (!parsed.auth) {
      parsed.auth = [];
      fallbackNeeded = true;
    }
    if (!parsed.achievements || parsed.achievements.length === 0) {
      parsed.achievements = ACHIEVEMENTS;
      fallbackNeeded = true;
    }
    if (!parsed.user_achievements) {
      parsed.user_achievements = [];
      fallbackNeeded = true;
    }
    if (!parsed.correctionRequests) {
      parsed.correctionRequests = [];
      fallbackNeeded = true;
    }

    if (fallbackNeeded) {
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf8");
      } catch (err) {
        console.error("Failed to update db.json on fallback migration.", err);
      }
    }

    dbCache = parsed;
    return parsed;
  } catch (err) {
    console.error("Failed to read DB, returning default clean schema", err);
    const initial = getInitialDB();
    dbCache = initial;
    return initial;
  }
}

export function writeDB(db: DatabaseSchema) {
  dbCache = db;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write db.json to disk. Updated in-memory successfully.", err);
  }
}
