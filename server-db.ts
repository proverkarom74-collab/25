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

function getInitialDB(): DatabaseSchema {
  const devUsers: UserProfile[] = [
    {
      id: "critic1",
      username: "kinoman_99",
      displayName: "Александр Елисеев",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      bio: "Пишу рецензии на главные новинки кинопроката и космические драмы. Ценю Нолана, Быкова и Тарковского.",
      watchlist: ["interstellar", "inception", "dune"],
      following: ["critic2", "critic4", "critic6"],
      followers: ["critic2", "critic3"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic2",
      username: "balabanov_fan",
      displayName: "Мария Смирнова",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      bio: "Кадры Балабанова, музыка Балабанова, эстетика провинциального реализма.",
      watchlist: ["brother-1997", "brother-2-2000"],
      following: ["critic1"],
      followers: ["critic1"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic3",
      username: "otaku_review",
      displayName: "Константин Ким",
      avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
      bio: "Отаку со стажем, разбираю аниме по кирпичикам. Кодзима — гений, Миядзаки — бог.",
      watchlist: ["attack-on-titan", "spirited-away"],
      following: ["critic1", "critic8"],
      followers: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic4",
      username: "tarantino_kid",
      displayName: "Артур Ларин",
      avatarUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80",
      bio: "Изучаю каждый кадр Тарантино и Скорсезе. Люблю нелинейные сюжеты, черный юмор и сочные диалоги.",
      watchlist: ["pulp-fiction", "django-unchained"],
      following: ["critic1", "critic10"],
      followers: ["critic1"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic5",
      username: "indie_critic",
      displayName: "Анна Власова",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
      bio: "Инди-кино, артхаус, фестивальные новинки. Сандэнс и Канны — мои ориентиры. Пишу честно.",
      watchlist: ["prestige", "dune"],
      following: ["critic6"],
      followers: ["critic4", "critic6", "critic8"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic6",
      username: "scifi_girl",
      displayName: "Елена Рей",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      bio: "Космическая фантастика, киберпанк и постапокалипсис. Разбираю научную достоверность фантастики.",
      watchlist: ["interstellar", "inception", "dune"],
      following: ["critic1", "critic5"],
      followers: ["critic1", "critic5"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic7",
      username: "gorky_cine",
      displayName: "Сергей Калугин",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      bio: "Преподаватель киношколы. Разбираю монтажные склейки, цвет и композицию кадра. Классика мирового кино.",
      watchlist: ["brother-1997", "pulp-fiction"],
      following: ["critic5"],
      followers: ["critic4", "critic8"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic8",
      username: "doroma_love",
      displayName: "Ирина Цой",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      bio: "Японская анимация, корейский кинематограф. Пишу про волшебство Миядзаки.",
      watchlist: ["spirited-away", "attack-on-titan"],
      following: ["critic3", "critic5"],
      followers: ["critic3"],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic9",
      username: "popcorn_time",
      displayName: "Михаил Борисов",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      bio: "Простой зритель. Смотрю попкорновые блокбастеры, боевики Бэя. Главное — зрелищность!",
      watchlist: ["transformers-2007", "inception"],
      following: [],
      followers: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "critic10",
      username: "nostalgia_critic_ru",
      displayName: "Дмитрий Пучков",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
      bio: "Советская классика, комедии Гайдая и Рязанова. Олдскульный разбор фильмов нашей молодости.",
      watchlist: ["ivan-vasilievich", "operation-y"],
      following: [],
      followers: ["critic4", "critic2"],
      createdAt: new Date().toISOString()
    }
  ];

  const devAuth: RegisteredUserAuth[] = devUsers.map((u) => ({
    id: u.id,
    email: `${u.username}@example.com`,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    passwordHash: "123456"
  }));

  return {
    movies: SEED_MOVIES,
    reviews: SEED_REVIEWS,
    users: devUsers,
    auth: devAuth,
    achievements: ACHIEVEMENTS,
    user_achievements: [],
    directors: SEED_DIRECTORS,
    correctionRequests: []
  };
}

export function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = getInitialDB();
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(content) as DatabaseSchema;
    let fallbackNeeded = false;

    // Migrate elements if missing or incomplete
    if (!parsed.directors || parsed.directors.length === 0) {
      parsed.directors = SEED_DIRECTORS;
      fallbackNeeded = true;
    }
    if (!parsed.movies || parsed.movies.length < SEED_MOVIES.length) {
      parsed.movies = SEED_MOVIES;
      fallbackNeeded = true;
    }
    if (!parsed.reviews || parsed.reviews.length < SEED_REVIEWS.length) {
      parsed.reviews = SEED_REVIEWS;
      fallbackNeeded = true;
    }
    if (!parsed.users || parsed.users.length < 10) {
      const def = getInitialDB();
      // Keep registered non-seed users if any, but ensure our 10 seed users are there
      const existingIds = new Set(parsed.users.map(u => u.id));
      for (const u of def.users) {
        if (!existingIds.has(u.id)) {
          parsed.users.push(u);
          const a = def.auth.find(x => x.id === u.id);
          if (a) parsed.auth.push(a);
        }
      }
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
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf8");
    }
    return parsed;
  } catch (err) {
    console.error("Failed to read DB, returning default schema", err);
    return getInitialDB();
  }
}

export function writeDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to DB", err);
  }
}
