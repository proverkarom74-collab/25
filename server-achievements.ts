import { readDB, writeDB } from "./server-db";
import { UserReview, UserAchievement, Achievement } from "./src/types";

// Static achievements list is imported from achievementsData
import { ACHIEVEMENTS } from "./src/lib/achievementsData";

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percent: number;
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Calculates user-related stats and checks/updates achievements for a specific user.
 * Returns the progress of all achievements for the user.
 */
export function processAndGetAchievements(userId: string): {
  progress: AchievementProgress[];
  newUnlocked: Achievement[];
} {
  const db = readDB();

  // Find user details and their reviews
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return { progress: [], newUnlocked: [] };
  }

  // Get all user's reviews
  const userReviews = db.reviews.filter(r => r.userId === userId);

  // Initialize arrays if they don't exist in DB
  if (!db.user_achievements) {
    db.user_achievements = [];
  }
  if (!db.achievements) {
    db.achievements = [];
  }

  // Ensure achievements global table is pre-filled
  if (db.achievements.length === 0) {
    db.achievements = ACHIEVEMENTS;
  }

  // Get what's currently unlocked for this user
  const currentUnlockedIds = new Set(
    db.user_achievements
      .filter(ua => ua.userId === userId)
      .map(ua => ua.achievementId)
  );

  const newUnlockedBadges: Achievement[] = [];
  const progressList: AchievementProgress[] = [];

  // Helper values for calculations
  const totalReviewsCount = userReviews.length;

  // Genre counts
  const genreCounts: { [genre: string]: number } = {};
  userReviews.forEach(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (movie && movie.genres) {
      movie.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  const uniqueGenresCount = Object.keys(genreCounts).length;
  const maxReviewsInSingleGenre = Object.values(genreCounts).length > 0 
    ? Math.max(...Object.values(genreCounts)) 
    : 0;

  // Specific content types counts
  const animeReviewsCount = userReviews.filter(r => {
    if (r.titleType === "anime") return true;
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie?.genres.includes("Аниме") || false;
  }).length;

  const tvReviewsCount = userReviews.filter(r => {
    if (r.titleType === "tv") return true;
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie?.genres.includes("Сериал") || false;
  }).length;

  const blockbusterReviewsCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    const isBlockbusterGenre = movie.genres.some(g => ["Боевик", "Экшен", "Фантастика", "Приключения"].includes(g));
    const isHeavyRating = (movie.ratingsCount || 0) >= 100;
    return movie.type === "movie" && (isBlockbusterGenre || isHeavyRating);
  }).length;

  const arthouseReviewsCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    const isArthouseGenre = movie.genres.some(g => ["Драма", "Артхаус", "Авторское кино", "Мелодрама"].includes(g));
    const isNiche = (movie.ratingsCount || 0) < 50;
    return isArthouseGenre || isNiche;
  }).length;

  const animationReviewsCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    return movie.genres.some(g => ["Мультфильм", "Анимация"].includes(g));
  }).length;

  const documentaryReviewsCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    return movie.genres.some(g => ["Документальный"].includes(g));
  }).length;

  const shortReviewsCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    if (movie.type === "short") return true;
    const minMatch = movie.duration ? movie.duration.match(/(\d+)\s*мин/i) : null;
    if (minMatch) {
      return parseInt(minMatch[1]) < 40;
    }
    return false;
  }).length;

  // Social metric Helpers
  const maxLikesOnSingleReview = userReviews.length > 0
    ? Math.max(...userReviews.map(r => (r.likes || []).length))
    : 0;

  const totalLikesOnAllReviews = userReviews.reduce(
    (sum, r) => sum + (r.likes || []).length, 
    0
  );

  // Safe cast comments check
  const maxCommentsOnSingleReview = userReviews.length > 0
    ? Math.max(...userReviews.map(r => {
        const anyR = r as any;
        return anyR.comments ? anyR.comments.length : 0;
      }))
    : 0;

  // Perfectionist reviews (all 5 categories filled with ratings >= 1)
  const perfectionistsCount = userReviews.filter(r => {
    const grades = r.ratings;
    return grades && 
      (grades.story || 0) >= 1 && 
      (grades.acting || 0) >= 1 && 
      (grades.visuals || 0) >= 1 && 
      (grades.sound || 0) >= 1 && 
      (grades.genreMatch || 0) >= 1;
  }).length;

  // Pioneer reviews: movie had < 5 reviews when reviewed, or movie currently has < 5 total reviews on the platform
  const pioneerCount = userReviews.filter(r => {
    const movieReviewsCount = db.reviews.filter(rev => rev.titleSlug === r.titleSlug).length;
    // Less than 5 reviews on this movie slug currently, or reviewed near launch
    return movieReviewsCount < 5;
  }).length;

  // Night reviews (00:00 - 06:00)
  const nightReviewsCount = userReviews.filter(r => {
    const date = new Date(r.createdAt);
    // Keep it robust to timezone or UTC, check hours
    const h = date.getHours();
    return h >= 0 && h < 6;
  }).length;

  // Marathoner helper: group by day (YYYY-MM-DD)
  const reviewsByDay: { [date: string]: number } = {};
  userReviews.forEach(r => {
    const day = r.createdAt.slice(0, 10);
    reviewsByDay[day] = (reviewsByDay[day] || 0) + 1;
  });
  const maxReviewsInSingleDay = Object.values(reviewsByDay).length > 0
    ? Math.max(...Object.values(reviewsByDay))
    : 0;

  // Monthly active helper: count of reviews written in the current calendar month
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-05"
  const currentMonthReviewsCount = userReviews.filter(r => r.createdAt.startsWith(currentMonthStr)).length;

  // Golden pen: average of user's overall reviews score is >= 8.5 (meaning 85.0 on our 0-100 system)
  // must have at least 30 reviews
  const avgOverallRating = userReviews.length > 0
    ? userReviews.reduce((sum, r) => sum + r.averageRating, 0) / userReviews.length
    : 0;

  // 1. Тематические и Сезонные
  const newYearMarathonCount = userReviews.filter(r => {
    const m = new Date(r.createdAt).getMonth();
    return m === 11 || m === 0; // December or January
  }).length;

  const halloweenHorrorCount = userReviews.filter(r => {
    const date = new Date(r.createdAt);
    if (date.getMonth() !== 9) return false; // October (month index 9)
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.genres.some(g => ["Ужасы", "Хоррор", "Horror"].includes(g)) : false;
  }).length;

  const summerBlockbusterCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie || !movie.releaseDate) return false;
    const releaseMonth = new Date(movie.releaseDate).getMonth();
    return releaseMonth === 5 || releaseMonth === 6 || releaseMonth === 7; // June, July, August
  }).length;

  const autumnArthouseCount = userReviews.filter(r => {
    const date = new Date(r.createdAt);
    const m = date.getMonth();
    if (m !== 8 && m !== 9 && m !== 10) return false; // Sept, Oct, Nov
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    const isArthouseGenre = movie.genres.some(g => ["Драма", "Артхаус", "Авторское кино", "Мелодрама"].includes(g));
    const isNiche = (movie.ratingsCount || 0) < 50;
    return isArthouseGenre || isNiche;
  }).length;

  // 2. Режиссёрские и Авторские
  const nolanFanCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.director.toLowerCase().includes("нолан") || movie.director.toLowerCase().includes("nolan") : false;
  }).length;

  const tarantinoFanCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.director.toLowerCase().includes("тарантино") || movie.director.toLowerCase().includes("tarantino") : false;
  }).length;

  const villeneuveFanCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.director.toLowerCase().includes("вильнёв") || movie.director.toLowerCase().includes("villeneuve") : false;
  }).length;

  const hitchcockFanCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.director.toLowerCase().includes("хичкок") || movie.director.toLowerCase().includes("hitchcock") : false;
  }).length;

  const geekCultCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    const dir = movie.director.toLowerCase();
    return dir.includes("райт") || dir.includes("wright") || dir.includes("ганн") || dir.includes("gunn");
  }).length;

  const directorCappedCounts: Record<string, number> = {};
  userReviews.forEach(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (movie && movie.director) {
      const d = movie.director.trim();
      directorCappedCounts[d] = Math.min(2, (directorCappedCounts[d] || 0) + 1);
    }
  });
  const auteurDetectiveCount = Object.values(directorCappedCounts).reduce((sum, count) => sum + count, 0);

  // 3. Сложные и Челленджи
  const totalCharactersCount = userReviews.reduce((sum, r) => sum + (r.text ? r.text.length : 0), 0);

  const criticalLookCount = userReviews.filter(r => r.averageRating < 30).length;

  const goldStandardCount = userReviews.filter(r => r.averageRating > 85).length;

  const seriesBingeCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.type === "tv" && movie.isEnded === true : false;
  }).length;

  const decadesSet = new Set<number>();
  userReviews.forEach(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (movie && movie.year) {
      const decade = Math.floor(movie.year / 10) * 10;
      decadesSet.add(decade);
    }
  });
  const timeTravelCount = decadesSet.size;

  // 3. Географические и Культурные
  const uniqueCountries = new Set<string>();
  userReviews.forEach(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (movie && movie.country) {
      movie.country.split(",").forEach(c => {
        const trimmed = c.trim();
        if (trimmed) uniqueCountries.add(trimmed.toLowerCase());
      });
    }
  });
  const tasteTravelerCount = uniqueCountries.size;

  const japanophileCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    const isJapan = movie.country && (movie.country.toLowerCase().includes("япония") || movie.country.toLowerCase().includes("japan"));
    return isJapan || movie.type === "anime" || movie.genres.includes("Аниме");
  }).length;

  const europeanCountries = ["великобритания", "франция", "германия", "италия", "испания", "швеция", "норвегия", "дания", "финляндия", "польша", "ирландия", "бельгия", "нидерланды", "швейцария", "австрия", "чехия", "венгрия"];
  const euroCriticCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    if (!movie) return false;
    const isEuro = movie.country && movie.country.split(",").some(c => europeanCountries.includes(c.trim().toLowerCase()));
    const isArthouse = movie.genres.some(g => ["Драма", "Артхаус", "Авторское кино", "Мелодрама"].includes(g)) || (movie.ratingsCount || 0) < 50;
    return isEuro && isArthouse;
  }).length;

  const koreanWaveCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.country && (movie.country.toLowerCase().includes("корея") || movie.country.toLowerCase().includes("korea")) : false;
  }).length;

  // 4. Поведенческие и Стильные
  const brevitySoulCount = userReviews.filter(r => r.text && r.text.length < 400).length;
  const novelistCount = userReviews.filter(r => r.text && r.text.length > 1500).length;

  const countEmojis = (text: string): number => {
    if (!text) return 0;
    const matches = text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}/gu);
    return matches ? matches.length : 0;
  };
  const emojiExplosionCount = userReviews.filter(r => countEmojis(r.text) >= 8).length;

  const spoilerphobeCount = userReviews.filter(r => {
    const t = r.text.toLowerCase();
    return t.includes("без спойлеров") || t.includes("спойлеров нет");
  }).length;

  const honestCriticCount = userReviews.filter(r => r.averageRating < 50).length;

  // 5. Сообщество и Взаимодействие
  const mentorCount = db.reviews
    .filter(r => r.userId !== userId)
    .reduce((total, r) => {
      const userCommentsCount = (r.comments || []).filter(c => c.userId === userId).length;
      return total + userCommentsCount;
    }, 0);

  const duelistCount = ((user as any).battlesCount || 0) + userReviews.filter(r => r.text.toLowerCase().includes(" vs ") || r.text.toLowerCase().includes(" против ")).length;
  const tasteCollectorCount = ((user as any).collectionsCount || 0) + Math.floor((user.watchlist || []).length / 3);
  const activeVotingCount = ((user as any).votesCount || 0) + Math.floor(totalLikesOnAllReviews / 5);

  // 6. Экстремальные и Челлендж
  const nightReviewsByDate: Record<string, number> = {};
  userReviews.forEach(r => {
    const date = new Date(r.createdAt);
    const h = date.getHours();
    if (h >= 0 && h < 8) {
      const dStr = r.createdAt.slice(0, 10);
      nightReviewsByDate[dStr] = (nightReviewsByDate[dStr] || 0) + 1;
    }
  });
  const sleeplessCount = Object.values(nightReviewsByDate).length > 0 ? Math.max(...Object.values(nightReviewsByDate)) : 0;

  const loneWarriorCount = userReviews.filter(r => {
    const movieReviewsCount = db.reviews.filter(rev => rev.titleSlug === r.titleSlug).length;
    return movieReviewsCount < 3;
  }).length;

  const currentYearInt = new Date().getFullYear();
  const retroArchaeologistCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? (currentYearInt - movie.year) > 30 : false;
  }).length;

  const futuristCount = userReviews.filter(r => {
    const movie = db.movies.find(m => m.slug === r.titleSlug);
    return movie ? movie.year >= 2024 && movie.year <= 2026 : false;
  }).length;

  const weekendCounts: Record<string, number> = {};
  userReviews.forEach(r => {
    const d = new Date(r.createdAt);
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6) {
      const sat = new Date(d);
      sat.setDate(d.getDate() - (day === 0 ? 1 : 0));
      const satStr = sat.toISOString().slice(0, 10);
      weekendCounts[satStr] = (weekendCounts[satStr] || 0) + 1;
    }
  });
  const weekendMarathonCount = Object.values(weekendCounts).length > 0 ? Math.max(...Object.values(weekendCounts)) : 0;

  // 7. Легендарные / Очень редкие
  const legendMatch = totalReviewsCount >= 3000 && totalLikesOnAllReviews >= 15000;
  const criticLegendCount = legendMatch ? 3000 : Math.min(2999, totalReviewsCount);

  const cinemaEncyclopediaCount = uniqueGenresCount;

  const daysDiff = Math.max(1, Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const yearsElapsed = daysDiff / 365;
  const immortalVoiceCount = parseFloat(yearsElapsed.toFixed(1));

  const goldenFundCount = userReviews.filter(r => (r.likes || []).length >= 100).length;

  // Check each achievement
  ACHIEVEMENTS.forEach(ach => {
    let current = 0;
    let target = 1;

    switch (ach.id) {
      // 1. Прогресс
      case "first-frame":
        target = 1;
        current = totalReviewsCount;
        break;
      case "viewer-5":
        target = 5;
        current = totalReviewsCount;
        break;
      case "critic-novice-10":
        target = 10;
        current = totalReviewsCount;
        break;
      case "twenty-fifth-frame-25":
        target = 25;
        current = totalReviewsCount;
        break;
      case "active-critic-50":
        target = 50;
        current = totalReviewsCount;
        break;
      case "film-critic-100":
        target = 100;
        current = totalReviewsCount;
        break;
      case "screen-master-250":
        target = 250;
        current = totalReviewsCount;
        break;
      case "cinema-legend-500":
        target = 500;
        current = totalReviewsCount;
        break;
      case "immortal-1000":
        target = 1000;
        current = totalReviewsCount;
        break;

      // 2. Жанры
      case "animenik-30":
        target = 30;
        current = animeReviewsCount;
        break;
      case "tv-addict-40":
        target = 40;
        current = tvReviewsCount;
        break;
      case "blockbuster-enthusiast-30":
        target = 30;
        current = blockbusterReviewsCount;
        break;
      case "arthouse-gourmet-20":
        target = 20;
        current = arthouseReviewsCount;
        break;
      case "cartoon-expert-25":
        target = 25;
        current = animationReviewsCount;
        break;
      case "documentalist-15":
        target = 15;
        current = documentaryReviewsCount;
        break;
      case "short-connoisseur-20":
        target = 20;
        current = shortReviewsCount;
        break;
      case "versatile-critic-12":
        target = 12;
        current = uniqueGenresCount;
        break;
      case "deep-specialist-50":
        target = 50;
        current = maxReviewsInSingleGenre;
        break;

      // 3. Влияние
      case "voice-of-people":
        target = 50;
        current = maxLikesOnSingleReview;
        break;
      case "popular-critic":
        target = 200;
        current = maxLikesOnSingleReview;
        break;
      case "king-of-likes":
        target = 500;
        current = maxLikesOnSingleReview;
        break;
      case "influential-voice":
        target = 1000;
        current = totalLikesOnAllReviews;
        break;
      case "discussed":
        target = 30;
        current = maxCommentsOnSingleReview;
        break;

      // 4. Особые
      case "perfectionist-10":
        target = 10;
        current = perfectionistsCount;
        break;
      case "pioneer":
        target = 1;
        current = pioneerCount;
        break;
      case "night-critic-10":
        target = 10;
        current = nightReviewsCount;
        break;
      case "marathoner-7":
        target = 7;
        current = maxReviewsInSingleDay;
        break;
      case "critic-of-the-month":
        target = 15;
        current = currentMonthReviewsCount;
        break;
      case "golden-pen":
        target = 30;
        // Requires 30 reviews AND average score >= 8.5 (85.0 on our 100 scale)
        if (totalReviewsCount < 30) {
          current = totalReviewsCount;
        } else if (avgOverallRating >= 85.0) {
          current = 30;
        } else {
          current = 29; // cap at 29 to say "not met due to average"
        }
        break;

      // 5. Сезонные
      case "new-year-marathon":
        target = 15;
        current = newYearMarathonCount;
        break;
      case "halloween-horror":
        target = 10;
        current = halloweenHorrorCount;
        break;
      case "summer-blockbuster":
        target = 12;
        current = summerBlockbusterCount;
        break;
      case "autumn-arthouse":
        target = 8;
        current = autumnArthouseCount;
        break;

      // 6. Режиссёры / Авторские
      case "nolan-fan":
        target = 10;
        current = nolanFanCount;
        break;
      case "tarantino-fan":
        target = 8;
        current = tarantinoFanCount;
        break;
      case "villeneuve-fan":
        target = 7;
        current = villeneuveFanCount;
        break;
      case "hitchcock-fan":
        target = 6;
        current = hitchcockFanCount;
        break;
      case "geek-cult":
        target = 9;
        current = geekCultCount;
        break;
      case "auteur-detective":
        target = 15;
        current = auteurDetectiveCount;
        break;

      // 7. География
      case "taste-traveler":
        target = 20;
        current = tasteTravelerCount;
        break;
      case "japanophile":
        target = 25;
        current = japanophileCount;
        break;
      case "euro-critic":
        target = 20;
        current = euroCriticCount;
        break;
      case "korean-wave":
        target = 15;
        current = koreanWaveCount;
        break;

      // 8. Стиль
      case "brevity-soul":
        target = 20;
        current = brevitySoulCount;
        break;
      case "novelist":
        target = 10;
        current = novelistCount;
        break;
      case "emoji-explosion":
        target = 15;
        current = emojiExplosionCount;
        break;
      case "spoilerphobe":
        target = 10;
        current = spoilerphobeCount;
        break;
      case "honest-critic":
        target = 20;
        current = honestCriticCount;
        break;

      // 9. Сообщество
      case "mentor":
        target = 30;
        current = mentorCount;
        break;
      case "duelist":
        target = 15;
        current = duelistCount;
        break;
      case "taste-collector":
        target = 20;
        current = tasteCollectorCount;
        break;
      case "active-voting":
        target = 10;
        current = activeVotingCount;
        break;

      // 10. Челленджи
      case "encyclopedist":
        target = 50000;
        current = totalCharactersCount;
        break;
      case "critical-look":
        target = 10;
        current = criticalLookCount;
        break;
      case "gold-standard":
        target = 15;
        current = goldStandardCount;
        break;
      case "series-binge":
        target = 5;
        current = seriesBingeCount;
        break;
      case "time-traveler":
        target = 7;
        current = timeTravelCount;
        break;
      case "sleepless":
        target = 5;
        current = sleeplessCount;
        break;
      case "lone-warrior":
        target = 3;
        current = loneWarriorCount;
        break;
      case "retro-archaeologist":
        target = 30;
        current = retroArchaeologistCount;
        break;
      case "futurist":
        target = 30;
        current = futuristCount;
        break;
      case "weekend-marathon":
        target = 20;
        current = weekendMarathonCount;
        break;

      // 11. Легендарные
      case "critic-legend":
        target = 3000;
        current = criticLegendCount;
        break;
      case "cinema-encyclopedia":
        target = 18;
        current = cinemaEncyclopediaCount;
        break;
      case "immortal-voice":
        target = 2; // Represents 2 years
        current = immortalVoiceCount;
        break;
      case "golden-fund":
        target = 50;
        current = goldenFundCount;
        break;
    }

    const isUnlocked = current >= target;
    const percent = Math.min(100, Math.floor((current / target) * 100));

    // Resolve date if already unlocked
    let unlockedAtStr: string | undefined;
    const existingRecord = db.user_achievements.find(
      ua => ua.userId === userId && ua.achievementId === ach.id
    );

    if (existingRecord) {
      unlockedAtStr = existingRecord.unlockedAt;
    }

    // If newly met and not previously in db, create unlock record!
    if (isUnlocked && !existingRecord) {
      unlockedAtStr = new Date().toISOString();
      const newRecord: UserAchievement = {
        id: "ua_" + Math.random().toString(36).substr(2, 9),
        userId,
        achievementId: ach.id,
        unlockedAt: unlockedAtStr
      };
      db.user_achievements.push(newRecord);
      newUnlockedBadges.push(ach);
    }

    progressList.push({
      achievementId: ach.id,
      current,
      target,
      percent,
      unlocked: isUnlocked,
      unlockedAt: unlockedAtStr
    });
  });

  // Write changes back to DB if any new accomplishments were unlocked
  if (newUnlockedBadges.length > 0) {
    writeDB(db);
  }

  return {
    progress: progressList,
    newUnlocked: newUnlockedBadges
  };
}
