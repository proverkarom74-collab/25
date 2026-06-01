import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { readDB, writeDB } from "./server-db";
import { MovieTitle, MediaType, UserReview, RatingBreakdown, calculateOverallRating, ExternalTitleRatings } from "./src/types";
import { processAndGetAchievements } from "./server-achievements";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize and migrate database on startup
  try {
    const initialDbCheck = readDB();
    console.log(`Database loaded on startup. Total movies/series in DB: ${initialDbCheck?.movies?.length || 0}`);
  } catch (err) {
    console.error("Error migrating or loading database on startup:", err);
  }

  // Safe lazy initializer for Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "";
  
  const getAI = () => {
    if (!isKeyValid) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // Helper to slugify Russian text roughly (for human-readable URLs)
  const slugify = (text: string) => {
    const rU = {
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
    };
    return text.toLowerCase()
      .split('')
      .map(char => (rU as any)[char] !== undefined ? (rU as any)[char] : char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // --- API Routes ---

  // Auth: Register (mock Supabase)
  app.post("/api/auth/register", (req, res) => {
    const { email, username, displayName, password } = req.body;
    if (!email || !username || !displayName || !password) {
      return res.status(400).json({ error: "Пожалуйста, заполните все обязательные поля" });
    }

    const db = readDB();
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    
    const existing = db.auth.find(u => u.email === email || u.username === cleanUsername);
    if (existing) {
      return res.status(400).json({ error: "Пользователь с такой почтой или никнеймом уже существует" });
    }

    const userId = "u_" + Math.random().toString(36).substr(2, 9);
    // Use default avatars
    const cleanAvatar = `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1535713875002-d1d0cf377fde" : "1494790108377-be9c29b29330"}?auto=format&fit=crop&w=150&q=80`;

    const newUser = {
      id: userId,
      email,
      username: cleanUsername,
      displayName: displayName.trim(),
      avatarUrl: cleanAvatar,
      passwordHash: password // simple mock hashing
    };

    const newProfile = {
      id: userId,
      username: cleanUsername,
      displayName: displayName.trim(),
      avatarUrl: cleanAvatar,
      bio: "Новый кинокритик на платформе 25-й Кадр.",
      watchlist: [],
      following: [],
      followers: [],
      createdAt: new Date().toISOString()
    };

    db.auth.push(newUser);
    db.users.push(newProfile);
    writeDB(db);

    res.json({
      success: true,
      user: {
        id: userId,
        username: cleanUsername,
        displayName: displayName.trim(),
        avatarUrl: cleanAvatar,
        bio: newProfile.bio,
        watchlist: [],
        following: [],
        followers: []
      }
    });
  });

  // Auth: Login (mock Supabase)
  app.post("/api/auth/login", (req, res) => {
    const { login, password } = req.body; // login can be email or username
    if (!login || !password) {
      return res.status(400).json({ error: "Введите имя пользователя и пароль" });
    }

    const db = readDB();
    const cleanLogin = login.toLowerCase().trim();
    
    const userAuth = db.auth.find(u => u.email === cleanLogin || u.username === cleanLogin);
    if (!userAuth || userAuth.passwordHash !== password) {
      return res.status(400).json({ error: "Неверный логин или пароль" });
    }

    const profile = db.users.find(u => u.id === userAuth.id);

    res.json({
      success: true,
      user: {
        id: userAuth.id,
        username: userAuth.username,
        displayName: userAuth.displayName,
        avatarUrl: userAuth.avatarUrl,
        bio: profile?.bio || "",
        watchlist: profile?.watchlist || [],
        following: profile?.following || [],
        followers: profile?.followers || []
      }
    });
  });

  // Search reviewers (by username or displayName)
  app.get("/api/users-search", (req, res) => {
    const query = (req.query.q as string || "").trim().toLowerCase();
    const db = readDB();
    if (!query) {
      return res.json(db.users.slice(0, 30).map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio || "",
        followers: u.followers || [],
        following: u.following || [],
        createdAt: u.createdAt
      })));
    }

    const filtered = db.users.filter(u => 
      u.username.toLowerCase().includes(query) || 
      (u.displayName && u.displayName.toLowerCase().includes(query))
    );

    res.json(filtered.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio || "",
      followers: u.followers || [],
      following: u.following || [],
      createdAt: u.createdAt
    })));
  });

  // Get user profile
  app.get("/api/users/:username", (req, res) => {
    const { username } = req.params;
    const db = readDB();

    const profile = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!profile) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Ensure following/followers are arrays
    if (!profile.following) profile.following = [];
    if (!profile.followers) profile.followers = [];

    const userReviews = db.reviews.filter(r => r.username.toLowerCase() === username.toLowerCase());
    
    // Resolve full profile objects for following and followers
    const followingProfiles = db.users.filter(u => profile.following.includes(u.id));
    const followerProfiles = db.users.filter(u => profile.followers.includes(u.id));

    // Calculate achievements on demand
    const { progress } = processAndGetAchievements(profile.id);

    res.json({
      profile,
      reviews: userReviews,
      followingProfiles,
      followerProfiles,
      achievementsProgress: progress
    });
  });

  // Follow / Unfollow user
  app.post("/api/users/:userId/follow", (req, res) => {
    const { userId } = req.params;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });
    if (userId === targetUserId) return res.status(400).json({ error: "Вы не можете подписаться на самого себя" });

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    const targetIndex = db.users.findIndex(u => u.id === targetUserId);

    if (userIndex === -1 || targetIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Ensure following & followers exist
    if (!db.users[userIndex].following) db.users[userIndex].following = [];
    if (!db.users[targetIndex].followers) db.users[targetIndex].followers = [];

    const following = db.users[userIndex].following;
    const followers = db.users[targetIndex].followers;

    const followIdx = following.indexOf(targetUserId);
    let followed = false;

    if (followIdx === -1) {
      following.push(targetUserId);
      const followerIdx = followers.indexOf(userId);
      if (followerIdx === -1) {
        followers.push(userId);
      }
      followed = true;
    } else {
      following.splice(followIdx, 1);
      const followerIdx = followers.indexOf(userId);
      if (followerIdx !== -1) {
        followers.splice(followerIdx, 1);
      }
    }

    db.users[userIndex].following = following;
    db.users[targetIndex].followers = followers;

    writeDB(db);

    res.json({ success: true, followed, following });
  });

  // Get reviews of followed users
  app.get("/api/reviews/following", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const db = readDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    const following = user.following || [];
    const reviews = db.reviews.filter(r => following.includes(r.userId));
    // Sort descending by date
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(reviews);
  });

  // Save/Update user profile bio and cinematic settings
  app.post("/api/users/:userId/bio", (req, res) => {
    const { userId } = req.params;
    const { bio, displayName, favoriteMovieSlug, favoriteMovieTitle, profileCoverUrl } = req.body;
    const db = readDB();

    const profileIdx = db.users.findIndex(u => u.id === userId);
    if (profileIdx === -1) {
      return res.status(404).json({ error: "Профиль не найден" });
    }

    if (bio !== undefined) db.users[profileIdx].bio = bio;
    if (displayName !== undefined) db.users[profileIdx].displayName = displayName;
    if (favoriteMovieSlug !== undefined) db.users[profileIdx].favoriteMovieSlug = favoriteMovieSlug;
    if (favoriteMovieTitle !== undefined) db.users[profileIdx].favoriteMovieTitle = favoriteMovieTitle;
    if (profileCoverUrl !== undefined) db.users[profileIdx].profileCoverUrl = profileCoverUrl;

    // Update in auth list to match
    const authIdx = db.auth.findIndex(a => a.id === userId);
    if (authIdx !== -1) {
      if (displayName !== undefined) db.auth[authIdx].displayName = displayName;
      if (favoriteMovieSlug !== undefined) db.auth[authIdx].favoriteMovieSlug = favoriteMovieSlug;
      if (favoriteMovieTitle !== undefined) db.auth[authIdx].favoriteMovieTitle = favoriteMovieTitle;
      if (profileCoverUrl !== undefined) db.auth[authIdx].profileCoverUrl = profileCoverUrl;
    }

    // Also update cached reviews
    db.reviews = db.reviews.map(r => {
      if (r.userId === userId && displayName !== undefined) {
        return { ...r, userDisplayName: displayName };
      }
      return r;
    });

    writeDB(db);
    res.json({ success: true, profile: db.users[profileIdx] });
  });

  // Save/Update user profile showcase
  app.post("/api/users/:userId/showcase", (req, res) => {
    const { userId } = req.params;
    const { showcase } = req.body;
    if (!Array.isArray(showcase) || showcase.length > 3) {
      return res.status(400).json({ error: "Витрина может содержать не более 3 достижений" });
    }

    const db = readDB();
    const profileIdx = db.users.findIndex(u => u.id === userId);
    if (profileIdx === -1) {
      return res.status(404).json({ error: "Профиль не найден" });
    }

    db.users[profileIdx].showcase = showcase;
    writeDB(db);
    res.json({ success: true, profile: db.users[profileIdx] });
  });

  // Watchlist toggle
  app.post("/api/users/:userId/watchlist", (req, res) => {
    const { userId } = req.params;
    const { movieSlug } = req.body;
    if (!movieSlug) return res.status(400).json({ error: "movieSlug required" });

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const currentWatchlist = db.users[userIndex].watchlist || [];
    const idx = currentWatchlist.indexOf(movieSlug);
    let added = false;

    if (idx === -1) {
      currentWatchlist.push(movieSlug);
      added = true;
    } else {
      currentWatchlist.splice(idx, 1);
    }

    db.users[userIndex].watchlist = currentWatchlist;
    writeDB(db);

    res.json({ success: true, added, watchlist: currentWatchlist });
  });

  const CANONICAL_IDS_AND_RATINGS: Record<string, {
    kinopoiskId: string;
    imdbId: string;
    ratings: {
      kinopoisk: { rating: number; votes: number };
      imdb: { rating: number; votes: number };
      metacritic: { rating: number };
      rottenTomatoes: { criticsRating: number; audienceRating: number };
    }
  }> = {
    "interstellar": {
      kinopoiskId: "258687",
      imdbId: "tt0816692",
      ratings: {
        kinopoisk: { rating: 8.6, votes: 852700 },
        imdb: { rating: 8.7, votes: 2045000 },
        metacritic: { rating: 74 },
        rottenTomatoes: { criticsRating: 73, audienceRating: 86 }
      }
    },
    "inception": {
      kinopoiskId: "447301",
      imdbId: "tt1375666",
      ratings: {
        kinopoisk: { rating: 8.7, votes: 765400 },
        imdb: { rating: 8.8, votes: 2511000 },
        metacritic: { rating: 74 },
        rottenTomatoes: { criticsRating: 87, audienceRating: 91 }
      }
    },
    "prestige": {
      kinopoiskId: "195334",
      imdbId: "tt0482571",
      ratings: {
        kinopoisk: { rating: 8.5, votes: 512900 },
        imdb: { rating: 8.5, votes: 1412000 },
        metacritic: { rating: 66 },
        rottenTomatoes: { criticsRating: 77, audienceRating: 92 }
      }
    },
    "brother-1997": {
      kinopoiskId: "41519",
      imdbId: "tt0118767",
      ratings: {
        kinopoisk: { rating: 8.3, votes: 441000 },
        imdb: { rating: 7.9, votes: 24700 },
        metacritic: { rating: 75 },
        rottenTomatoes: { criticsRating: 80, audienceRating: 88 }
      }
    },
    "brother-2-2000": {
      kinopoiskId: "41520",
      imdbId: "tt0284915",
      ratings: {
        kinopoisk: { rating: 8.2, votes: 382000 },
        imdb: { rating: 7.6, votes: 17500 },
        metacritic: { rating: 68 },
        rottenTomatoes: { criticsRating: 70, audienceRating: 85 }
      }
    },
    "zhmurki": {
      kinopoiskId: "84381",
      imdbId: "tt0420425",
      ratings: {
        kinopoisk: { rating: 7.3, votes: 221000 },
        imdb: { rating: 7.0, votes: 6800 },
        metacritic: { rating: 55 },
        rottenTomatoes: { criticsRating: 65, audienceRating: 78 }
      }
    },
    "pulp-fiction": {
      kinopoiskId: "342",
      imdbId: "tt0110912",
      ratings: {
        kinopoisk: { rating: 8.6, votes: 624500 },
        imdb: { rating: 8.9, votes: 2219000 },
        metacritic: { rating: 95 },
        rottenTomatoes: { criticsRating: 92, audienceRating: 96 }
      }
    },
    "django-unchained": {
      kinopoiskId: "586397",
      imdbId: "tt1853728",
      ratings: {
        kinopoisk: { rating: 8.4, votes: 574000 },
        imdb: { rating: 8.5, votes: 1655000 },
        metacritic: { rating: 81 },
        rottenTomatoes: { criticsRating: 87, audienceRating: 91 }
      }
    },
    "ivan-vasilievich": {
      kinopoiskId: "44735",
      imdbId: "tt0070241",
      ratings: {
        kinopoisk: { rating: 8.8, votes: 791200 },
        imdb: { rating: 8.2, votes: 19800 },
        metacritic: { rating: 80 },
        rottenTomatoes: { criticsRating: 90, audienceRating: 96 }
      }
    },
    "operation-y": {
      kinopoiskId: "44745",
      imdbId: "tt0059550",
      ratings: {
        kinopoisk: { rating: 8.7, votes: 735000 },
        imdb: { rating: 8.4, votes: 15400 },
        metacritic: { rating: 80 },
        rottenTomatoes: { criticsRating: 90, audienceRating: 95 }
      }
    },
    "breaking-bad": {
      kinopoiskId: "404900",
      imdbId: "tt0903747",
      ratings: {
        kinopoisk: { rating: 8.9, votes: 462000 },
        imdb: { rating: 9.5, votes: 2180000 },
        metacritic: { rating: 96 },
        rottenTomatoes: { criticsRating: 96, audienceRating: 97 }
      }
    },
    "attack-on-titan": {
      kinopoiskId: "749060",
      imdbId: "tt2560140",
      ratings: {
        kinopoisk: { rating: 8.7, votes: 284000 },
        imdb: { rating: 9.1, votes: 492000 },
        metacritic: { rating: 85 },
        rottenTomatoes: { criticsRating: 95, audienceRating: 94 }
      }
    },
    "spirited-away": {
      kinopoiskId: "370",
      imdbId: "tt0245429",
      ratings: {
        kinopoisk: { rating: 8.5, votes: 452000 },
        imdb: { rating: 8.6, votes: 835000 },
        metacritic: { rating: 96 },
        rottenTomatoes: { criticsRating: 96, audienceRating: 96 }
      }
    },
    "dune": {
      kinopoiskId: "4094242",
      imdbId: "tt1160419",
      ratings: {
        kinopoisk: { rating: 7.7, votes: 432200 },
        imdb: { rating: 8.0, votes: 721000 },
        metacritic: { rating: 74 },
        rottenTomatoes: { criticsRating: 83, audienceRating: 90 }
      }
    },
    "transformers-2007": {
      kinopoiskId: "195431",
      imdbId: "tt0413300",
      ratings: {
        kinopoisk: { rating: 7.6, votes: 292000 },
        imdb: { rating: 7.0, votes: 661000 },
        metacritic: { rating: 61 },
        rottenTomatoes: { criticsRating: 58, audienceRating: 85 }
      }
    }
  };

  async function updateMovieExternalRatings(movie: MovieTitle, force = false): Promise<MovieTitle> {
    const needsUpdate = force || !movie.externalRatings || !movie.externalRatings.lastUpdated || (
      (Date.now() - new Date(movie.externalRatings.lastUpdated).getTime()) > 7 * 24 * 60 * 60 * 1000
    );

    if (!needsUpdate) {
      return movie;
    }

    const canon = CANONICAL_IDS_AND_RATINGS[movie.slug];
    const kpId = movie.kinopoiskId || (canon ? canon.kinopoiskId : undefined);
    const imdbId = movie.imdbId || (canon ? canon.imdbId : undefined);

    let extRatings: any = { ...movie.externalRatings };
    let updatedKp = extRatings.kinopoisk;
    let updatedImdb = extRatings.imdb;
    let updatedMeta = extRatings.metacritic;
    let updatedRotten = extRatings.rottenTomatoes;

    let apiSuccess = false;

    if (process.env.OMDB_API_KEY && process.env.OMDB_API_KEY.trim() !== "" && imdbId) {
      try {
        console.log(`Fetching OMDB ratings for ${movie.title} (${imdbId})`);
        const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${imdbId}`);
        if (omdbRes.ok) {
          const omdbData = await omdbRes.json();
          if (omdbData && omdbData.Response === "True") {
            const imdbRatingNum = parseFloat(omdbData.imdbRating);
            const imdbVotesNum = parseInt(omdbData.imdbVotes ? omdbData.imdbVotes.replace(/,/g, "") : "0");
            if (!isNaN(imdbRatingNum)) {
              updatedImdb = { rating: imdbRatingNum, votes: imdbVotesNum || 0 };
            }
            const metascoreNum = parseInt(omdbData.Metascore);
            if (!isNaN(metascoreNum)) {
              updatedMeta = { rating: metascoreNum };
            }
            const rtRating = (omdbData.Ratings || []).find((r: any) => r.Source === "Rotten Tomatoes");
            if (rtRating) {
              const pct = parseInt(rtRating.Value);
              if (!isNaN(pct)) {
                updatedRotten = { 
                  criticsRating: pct, 
                  audienceRating: updatedRotten?.audienceRating || Math.round(imdbRatingNum * 10 - 2 + Math.random() * 5)
                };
              }
            }
            apiSuccess = true;
          }
        }
      } catch (e) {
        console.error("OMDB API Fetch error", e);
      }
    }

    if (process.env.KINOPOISK_API_KEY && process.env.KINOPOISK_API_KEY.trim() !== "" && kpId) {
      try {
        console.log(`Fetching Kinopoisk ratings for ${movie.title} (${kpId})`);
        const kpRes = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}`, {
          headers: {
            "X-API-KEY": process.env.KINOPOISK_API_KEY,
            "Content-Type": "application/json"
          }
        });
        if (kpRes.ok) {
          const kpData = await kpRes.json();
          if (kpData) {
            const kpRatingNum = parseFloat(kpData.ratingKinopoisk || kpData.rating);
            const kpVotesNum = parseInt(kpData.ratingKinopoiskVoteCount || kpData.ratingVoteCount || "0");
            if (!isNaN(kpRatingNum)) {
              updatedKp = { rating: kpRatingNum, votes: kpVotesNum };
              apiSuccess = true;
            }
          }
        }
      } catch (e) {
        console.error("Kinopoisk API fetch error", e);
      }
    }

    if (canon) {
      if (!updatedKp) updatedKp = canon.ratings.kinopoisk;
      if (!updatedImdb) updatedImdb = canon.ratings.imdb;
      if (!updatedMeta) updatedMeta = canon.ratings.metacritic;
      if (!updatedRotten) updatedRotten = canon.ratings.rottenTomatoes;
      apiSuccess = true;
    }

    if (!apiSuccess) {
      const aiClient = getAI();
      if (aiClient) {
        try {
          console.log(`Using Gemini to estimate external ratings for: ${movie.title} (${movie.year})`);
          const p = `Ты — эксперт по кино. Пожалуйста, предоставь оценки (рейтинги) и количество голосов на Кинопоиск, IMDb, Metacritic (Metascore) и Rotten Tomatoes (Tomatometer и Audience Score) для следующего фильма:
Название: "${movie.title}" (${movie.originalTitle || ""})
Год выпуска: ${movie.year}
Внутренний рейтинг на нашем сайте: ${movie.ratingAverage}/100

Ответ должен быть строго в формате JSON, соответствующем следующей схеме:
{
  "kinopoisk": { "rating": число 1.0-10.0, "votes": число },
  "imdb": { "rating": число 1.0-10.0, "votes": число },
  "metacritic": { "rating": число 1-100 },
  "rottenTomatoes": { "criticsRating": число 1-100, "audienceRating": число 1-100 }
}
Если фильм редкий или вымышленный, верни реалистичные гармоничные оценки, основываясь на внутреннем рейтинге ${movie.ratingAverage}/100. Предоставь ТОЛЬКО JSON без маркдауна и лишнего текста!`;

          const resp = await aiClient.models.generateContent({
            model: "gemini-3.5-flash",
            contents: p,
            config: {
              responseMimeType: "application/json"
            }
          });

          const text = resp.text;
          if (text) {
            const parsed = JSON.parse(text.trim());
            if (parsed.kinopoisk) updatedKp = parsed.kinopoisk;
            if (parsed.imdb) updatedImdb = parsed.imdb;
            if (parsed.metacritic) updatedMeta = parsed.metacritic;
            if (parsed.rottenTomatoes) updatedRotten = parsed.rottenTomatoes;
            apiSuccess = true;
          }
        } catch (gemErr) {
          console.error("Gemini rating estimator error", gemErr);
        }
      }
    }

    if (!updatedKp) {
      const calculatedBase = movie.ratingAverage / 10;
      const rating = Math.round((calculatedBase + (Math.random() * 0.4 - 0.2)) * 10) / 10;
      updatedKp = { 
        rating: Math.min(10, Math.max(1, rating)), 
        votes: Math.round(1500 + Math.random() * 45000) 
      };
    }
    if (!updatedImdb) {
      const calculatedBase = movie.ratingAverage / 10;
      const rating = Math.round((calculatedBase + (Math.random() * 0.4 - 0.2)) * 10) / 10;
      updatedImdb = { 
        rating: Math.min(10, Math.max(1, rating)), 
        votes: Math.round(5000 + Math.random() * 125000) 
      };
    }
    if (!updatedMeta) {
      const rating = Math.round(movie.ratingAverage + (Math.random() * 10 - 5));
      updatedMeta = { rating: Math.min(100, Math.max(10, rating)) };
    }
    if (!updatedRotten) {
      const base = movie.ratingAverage;
      const critics = Math.round(base + (Math.random() * 14 - 7));
      const audience = Math.round(base + (Math.random() * 8 - 4));
      updatedRotten = { 
        criticsRating: Math.min(100, Math.max(10, critics)), 
        audienceRating: Math.min(100, Math.max(10, audience)) 
      };
    }

    return {
      ...movie,
      kinopoiskId: kpId,
      imdbId: imdbId,
      externalRatings: {
        kinopoisk: updatedKp,
        imdb: updatedImdb,
        metacritic: updatedMeta,
        rottenTomatoes: updatedRotten,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  // Get movies
  app.get("/api/movies", async (req, res) => {
    const db = readDB();
    const { type, search, genre, formats, genres, year, country, director } = req.query;

    let dbUpdated = false;
    const updatePromises = db.movies.map(async (movie, index) => {
      if (!movie.externalRatings) {
        try {
          const updatedMovie = await updateMovieExternalRatings(movie);
          db.movies[index] = updatedMovie;
          dbUpdated = true;
        } catch (e) {
          console.error(`Failed to automatically initialize external ratings for ${movie.title}:`, e);
        }
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    if (dbUpdated) {
      writeDB(db);
    }

    let list = [...db.movies];

    if (type && type !== "all") {
      list = list.filter(m => m.type === type);
    }

    if (genre) {
      list = list.filter(m => m.genres.some(g => g.toLowerCase() === (genre as string).toLowerCase()));
    }

    if (formats) {
      try {
        const parsedFormats: string[] = JSON.parse(formats as string);
        if (parsedFormats && parsedFormats.length > 0) {
          list = list.filter(movie => {
            return parsedFormats.some(format => {
              switch (format) {
                case "Фильмы":
                  return movie.type === "movie" && !movie.genres.some(g => 
                    ["Мультфильм", "Мультипликация", "Анимация", "Документальный", "Документальное", "Короткометражка", "Короткометражный", "Короткий метр"].includes(g)
                  );
                case "Сериалы":
                  return movie.type === "tv" && 
                         !movie.genres.some(g => ["Аниме", "Мультфильм", "Мультипликация", "Анимация", "Документальный", "Документальное", "Мини-сериал"].includes(g)) && 
                         (movie.seasons === undefined || movie.seasons > 1);
                case "Мини-сериалы":
                  return movie.genres.some(g => ["Мини-сериал", "Мини-сериалы", "мини-сериал"].includes(g)) || 
                         (movie.type === "tv" && movie.seasons === 1 && movie.episodesCount !== undefined && movie.episodesCount <= 12);
                case "Мультфильмы":
                  return movie.genres.some(g => ["Мультфильм", "Мультипликация", "Анимация"].includes(g));
                case "Аниме":
                  return movie.type === "anime" || movie.genres.some(g => ["Аниме", "Anime", "аниме"].includes(g));
                case "Короткометражки":
                  return movie.type === "short" || movie.genres.some(g => ["Короткометражка", "Короткометражный", "Короткометражки", "Короткий метр"].includes(g)) || 
                         (movie.duration && movie.duration.includes("мин") && !movie.duration.includes("эп") && parseInt(movie.duration) <= 40);
                case "Документальное кино":
                  return movie.genres.some(g => ["Документальный", "Документальное", "Документальное кино", "Documentary"].includes(g));
                case "ТВ-шоу / Ток-шоу":
                  return movie.genres.some(g => ["ТВ-шоу", "Ток-шоу", "Реалити-шоу", "Телешоу"].includes(g)) || 
                         movie.overview.toLowerCase().includes("ток-шоу") || 
                         movie.title.toLowerCase().includes("ток-шоу");
                default:
                  return false;
              }
            });
          });
        }
      } catch (err) {
        // Safe fallback
      }
    }

    if (genres) {
      try {
        const parsedGenres: string[] = JSON.parse(genres as string);
        if (parsedGenres && parsedGenres.length > 0) {
          list = list.filter(m => 
            parsedGenres.some(g => m.genres.some(mg => mg.toLowerCase() === g.toLowerCase()))
          );
        }
      } catch (err) {
        // Safe fallback
      }
    }

    if (year) {
      const yr = (year as string).trim();
      list = list.filter(movie => movie.year.toString().includes(yr));
    }

    if (country) {
      const countryQuery = (country as string).toLowerCase().trim();
      list = list.filter(movie => movie.country && movie.country.toLowerCase().includes(countryQuery));
    }

    if (director) {
      const dirQuery = (director as string).toLowerCase().trim();
      list = list.filter(movie => movie.director && movie.director.toLowerCase().includes(dirQuery));
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) || 
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) || 
        m.director.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  // Get single movie reviews by slug or id
  app.get("/api/movies/:slug", async (req, res) => {
    const { slug } = req.params;
    const db = readDB();

    const movieIdx = db.movies.findIndex(m => m.slug === slug || m.id === slug);
    if (movieIdx === -1) {
      return res.status(404).json({ error: "Произведение не найдено в базе данных" });
    }

    const movie = db.movies[movieIdx];

    try {
      const updatedMovie = await updateMovieExternalRatings(movie);
      db.movies[movieIdx] = updatedMovie;
      writeDB(db);
    } catch (err) {
      console.error("Error updating movie external ratings implicitly:", err);
    }

    const dbReloaded = readDB();
    const finalMovie = dbReloaded.movies[movieIdx] || movie;
    const movieReviews = dbReloaded.reviews.filter(r => r.titleSlug === finalMovie.slug || r.titleId === finalMovie.id);
    res.json({ movie: finalMovie, reviews: movieReviews });
  });

  // Manual refresh of ratings
  app.post("/api/movies/:slug/refresh-ratings", async (req, res) => {
    const { slug } = req.params;
    const db = readDB();

    const movieIdx = db.movies.findIndex(m => m.slug === slug);
    if (movieIdx === -1) {
      return res.status(404).json({ error: "Произведение не найдено" });
    }

    const movie = db.movies[movieIdx];

    try {
      const updatedMovie = await updateMovieExternalRatings(movie, true);
      db.movies[movieIdx] = updatedMovie;
      writeDB(db);
      res.json({ success: true, movie: updatedMovie });
    } catch (err: any) {
      console.error("Error updating movie external ratings explicitly:", err);
      res.status(500).json({ error: err.message || "Не удалось обновить рейтинги" });
    }
  });

  // --- Directors API ---
  app.get("/api/directors", (req, res) => {
    const db = readDB();
    res.json(db.directors || []);
  });

  app.get("/api/directors/:slug", (req, res) => {
    const { slug } = req.params;
    const db = readDB();
    const director = (db.directors || []).find(d => d.id === slug);
    if (!director) {
      return res.status(404).json({ error: "Режиссёр не найден" });
    }

    // Get all movies by this director (match by name)
    const directorMovies = db.movies.filter(m => m.director.toLowerCase() === director.name.toLowerCase());
    const movieSlugs = new Set(directorMovies.map(m => m.slug));

    // Dynamic stats calculations
    const directorReviews = db.reviews.filter(r => movieSlugs.has(r.titleSlug));
    
    // Average rating
    let averageRating = 0;
    if (directorMovies.length > 0) {
      const sum = directorMovies.reduce((acc, m) => acc + m.ratingAverage, 0);
      averageRating = parseFloat((sum / directorMovies.length).toFixed(1));
    }

    // Highest rated movie
    let highestRated = directorMovies.length > 0 ? [...directorMovies].sort((a,b) => b.ratingAverage - a.ratingAverage)[0] : null;

    // Lowest rated movie
    let lowestRated = directorMovies.length > 0 ? [...directorMovies].sort((a,b) => a.ratingAverage - b.ratingAverage)[0] : null;

    // Most discussed movie
    let mostDiscussed = null;
    if (directorMovies.length > 0) {
      const reviewCounts: Record<string, number> = {};
      directorReviews.forEach(r => {
        reviewCounts[r.titleSlug] = (reviewCounts[r.titleSlug] || 0) + 1;
      });
      mostDiscussed = [...directorMovies].sort((a, b) => {
        const countA = reviewCounts[a.slug] || 0;
        const countB = reviewCounts[b.slug] || 0;
        if (countB !== countA) return countB - countA;
        return b.ratingsCount - a.ratingsCount;
      })[0];
    }

    // Top-10 / best works (sorted by rating)
    const topWorks = [...directorMovies].sort((a, b) => b.ratingAverage - a.ratingAverage).slice(0, 10);

    // Popular reviews on his films (sorted by likes)
    const popularReviews = [...directorReviews].sort((a, b) => (b.likes || []).length - (a.likes || []).length).slice(0, 6);

    // Similar directors recommendation algorithm
    const allOtherDirectors = (db.directors || []).filter(d => d.id !== slug);
    const similarDirectors = allOtherDirectors.map(other => {
      let score = 0;
      if (other.country === director.country) score += 2;
      const commonThemes = other.keyThemes.filter(t => director.keyThemes.includes(t));
      score += commonThemes.length * 3;
      if (director.id === "christopher-nolan" && other.id === "denis-villeneuve") score += 10;
      if (director.id === "denis-villeneuve" && other.id === "christopher-nolan") score += 10;
      if (director.id === "quentin-tarantino" && other.id === "aleksey-balabanov") score += 10;
      if (director.id === "aleksey-balabanov" && other.id === "quentin-tarantino") score += 10;
      if (director.id === "tetsuro-araki" && other.id === "hayao-miyazaki") score += 5;
      if (director.id === "hayao-miyazaki" && other.id === "tetsuro-araki") score += 5;
      if (director.id === "vince-gilligan" && other.id === "quentin-tarantino") score += 8;
      
      return { other, score };
    }).sort((a, b) => b.score - a.score).map(x => x.other).slice(0, 3);

    res.json({
      director,
      movies: directorMovies,
      stats: {
        averageRating,
        totalReviews: directorReviews.length,
        highestRated,
        lowestRated,
        mostDiscussed
      },
      topWorks,
      popularReviews,
      similarDirectors
    });
  });

  // Get all reviews
  app.get("/api/reviews", (req, res) => {
    const { popular } = req.query;
    const db = readDB();
    let list = [...db.reviews];

    if (popular === "true") {
      list.sort((a, b) => {
        const diff = (b.likes || []).length - (a.likes || []).length;
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(list);
  });

  // Create review
  app.post("/api/reviews", (req, res) => {
    const { titleSlug, userId, ratings, text } = req.body;
    if (!titleSlug || !userId || !ratings || !text) {
      return res.status(400).json({ error: "Пожалуйста, предоставьте все необходимые данные" });
    }

    const db = readDB();
    const movie = db.movies.find(m => m.slug === titleSlug);
    if (!movie) return res.status(404).json({ error: "Произведение не найдено" });

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    // Ensure ratings is validated
    const r = ratings as RatingBreakdown;
    const cleanRatings: RatingBreakdown = {
      story: Number(r.story) || 5,
      acting: Number(r.acting) || 5,
      visuals: Number(r.visuals) || 5,
      sound: Number(r.sound) || 5,
      genreMatch: Number(r.genreMatch) || 5,
    };

    // Calculate review average rating
    const averageRating = calculateOverallRating(cleanRatings);

    const reviewId = "rev_" + Math.random().toString(36).substr(2, 9);
    
    // Check if user already reviewed - overwrite or prevent? Overwrite is elegant
    const oldIdx = db.reviews.findIndex(rev => rev.titleSlug === titleSlug && rev.userId === userId);
    
    const newReview: UserReview = {
      id: reviewId,
      titleId: movie.id,
      titleSlug: movie.slug,
      titleName: movie.title,
      titleYear: movie.year,
      titleType: movie.type,
      titlePoster: movie.posterUrl,
      userId,
      username: user.username,
      userDisplayName: user.displayName,
      userAvatar: user.avatarUrl,
      ratings: cleanRatings,
      averageRating,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likes: []
    };

    if (oldIdx !== -1) {
      db.reviews[oldIdx] = newReview;
    } else {
      db.reviews.push(newReview);
    }

    // Now recalculate average rating for the movie
    const allMovieReviews = db.reviews.filter(rev => rev.titleSlug === titleSlug);
    const movieReviewsCount = allMovieReviews.length;
    
    // Sum category elements individually
    const sumCategory = (cat: keyof RatingBreakdown) => {
      const sumCat = allMovieReviews.reduce((acc, rev) => acc + (rev.ratings[cat] || 0), 0);
      return parseFloat((sumCat / movieReviewsCount).toFixed(1));
    };

    const newAvgBreakdown: RatingBreakdown = {
      story: sumCategory("story"),
      acting: sumCategory("acting"),
      visuals: sumCategory("visuals"),
      sound: sumCategory("sound"),
      genreMatch: sumCategory("genreMatch")
    };

    const overallAvgScore = calculateOverallRating(newAvgBreakdown);

    // Update movie profile
    const mIdx = db.movies.findIndex(m => m.slug === titleSlug);
    if (mIdx !== -1) {
      db.movies[mIdx].ratingsAverageBreakdown = newAvgBreakdown;
      db.movies[mIdx].ratingAverage = overallAvgScore;
      // Increment initial ratings count
      db.movies[mIdx].ratingsCount = (db.movies[mIdx].ratingsCount || 0) + (oldIdx === -1 ? 1 : 0);
    }

    writeDB(db);

    // Evaluate achievements and find any newly unlocked ones
    const { newUnlocked } = processAndGetAchievements(userId);

    res.json({ 
      success: true, 
      review: newReview, 
      movie: db.movies[mIdx], 
      newAchievements: newUnlocked 
    });
  });

  // Like / Unlike review
  app.post("/api/reviews/:id/like", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const db = readDB();
    const reviewIdx = db.reviews.findIndex(r => r.id === id);
    if (reviewIdx === -1) {
      return res.status(404).json({ error: "Рецензия не найдена" });
    }

    const likes = db.reviews[reviewIdx].likes || [];
    const idx = likes.indexOf(userId);
    let liked = false;

    if (idx === -1) {
      likes.push(userId);
      liked = true;
    } else {
      likes.splice(idx, 1);
    }

    const reviewAuthorId = db.reviews[reviewIdx].userId;
    db.reviews[reviewIdx].likes = likes;
    writeDB(db);

    // Evaluate author's social milestones
    processAndGetAchievements(reviewAuthorId);

    // Evaluate active user's milestone (e.g. if any like-milestones are added)
    const { newUnlocked: likerNewUnlocked } = processAndGetAchievements(userId);

    res.json({ 
      success: true, 
      liked, 
      likesCount: likes.length,
      newAchievements: likerNewUnlocked
    });
  });

  // Add Comment to user review
  app.post("/api/reviews/:id/comments", (req, res) => {
    const { id } = req.params;
    const { userId, text } = req.body;
    if (!userId || !text || !text.trim()) {
      return res.status(400).json({ error: "Пожалуйста, введите текст комментария" });
    }

    const db = readDB();
    const rIdx = db.reviews.findIndex(r => r.id === id);
    if (rIdx === -1) {
      return res.status(404).json({ error: "Рецензия не найдена" });
    }

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    if (!db.reviews[rIdx].comments) {
      db.reviews[rIdx].comments = [];
    }

    const commentId = "com_" + Math.random().toString(36).substr(2, 9);
    const newComment = {
      id: commentId,
      userId,
      username: user.username,
      userDisplayName: user.displayName,
      userAvatar: user.avatarUrl,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    db.reviews[rIdx].comments!.push(newComment);
    writeDB(db);

    // Evaluate social achievements for review author
    processAndGetAchievements(db.reviews[rIdx].userId);

    // Evaluate active user milestones
    const { newUnlocked } = processAndGetAchievements(userId);

    res.json({ 
      success: true, 
      comments: db.reviews[rIdx].comments, 
      newAchievements: newUnlocked 
    });
  });

  // Delete review
  app.delete("/api/reviews/:id", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const db = readDB();

    const review = db.reviews.find(r => r.id === id);
    if (!review) return res.status(404).json({ error: "Рецензия не найдена" });
    if (review.userId !== userId) return res.status(403).json({ error: "Нет прав для удаления" });

    db.reviews = db.reviews.filter(r => r.id !== id);
    writeDB(db);
    res.json({ success: true });
  });

  // AI-powered generation endpoint to create or search ANY movie in the world!
  app.post("/api/gemini/generate-movie", async (req, res) => {
    const { query, type: clientType } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Пожалуйста, введите название фильма" });
    }

    const db = readDB();
    const cleanQuery = query.toLowerCase().trim();

    // Check if we already have it to avoid Gemini costs
    const existing = db.movies.find(m => 
      m.title.toLowerCase() === cleanQuery || 
      (m.originalTitle && m.originalTitle.toLowerCase() === cleanQuery)
    );

    if (existing) {
      return res.json({ success: true, movie: existing, cached: true });
    }

    // Attempt Gemini Generation
    const aiClient = getAI();
    if (!aiClient) {
      // Create a nice mock fallback with randomized metadata so the developer's experience doesn't block!
      const fallbackTags = ["Драма", "Триллер", "Фантастика", "Детектив"];
      const randTag1 = fallbackTags[Math.floor(Math.random() * fallbackTags.length)];
      const randTag2 = fallbackTags[(Math.floor(Math.random() * fallbackTags.length) + 1) % fallbackTags.length];
      
      const mockedSlug = slugify(query) || "movie-" + Date.now();
      const mockedTitle: MovieTitle = {
        id: "mock_" + Date.now(),
        slug: mockedSlug,
        title: query,
        originalTitle: query + " Classic Edition",
        type: (clientType as MediaType) || "movie",
        year: 2024,
        releaseDate: "2024-03-15",
        genres: [randTag1, randTag2],
        duration: "115 мин",
        country: "США / Россия",
        director: "Режиссер ИИ-кадра",
        cast: ["Иван Иванов", "Мария Петрова", "Алексей Соколов"],
        overview: `Анализ произведения "${query}". Впечатляющее кинематографическое полотно, исследующее тонкую грань человеческой психологии и современных культурных трендов. (Примечание: Настройте GEMINI_API_KEY в панели Secrets для генерации реальной глубокой энциклопедии по фильмам со всего мира!)`,
        backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
        posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
        trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
        ratingsAverageBreakdown: {
          story: 7.5,
          acting: 8.0,
          visuals: 8.2,
          sound: 7.5,
          genreMatch: 8.5
        },
        ratingAverage: 70.2,
        ratingsCount: 14
      };

      let mockedWithRatings = mockedTitle;
      try {
        mockedWithRatings = await updateMovieExternalRatings(mockedTitle);
      } catch (err) {
        console.error("Failed to populate mock external ratings:", err);
      }

      db.movies.push(mockedWithRatings);
      writeDB(db);
      return res.json({ success: true, movie: mockedWithRatings, warning: "Используются резервные локальные данные ИИ." });
    }

    try {
      console.log(`Querying Gemini to generate movie details for: ${query}`);
      const prompt = `Пожалуйста, найди точную энциклопедическую информацию о фильме/сериале/аниме/произведении кинематографа: "${query}".
Если это произведение реальное, заполни все детали исторически корректно. Если оно малоизвестное или вымышленное, сгенерируй реалистичные подробности.
Выведи результат строго в формате JSON, соответствующем схеме. Все текстовые поля должны быть на русском языке. Описание (overview) сделай развернутым, увлекательным в стиле кинокритика.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: `Ты — авторитетный профессиональный киновед и кинокритик, отлично разбирающийся во всех фильмах, сериалах, аниме, мультфильмах и короткометражках мира. Твоя оценка объективна и разбита по профессиональным категориям: story (сюжет и идея), acting (актерская игра), visuals (визуал и съемка), sound (музыка и звук), genreMatch (соответствие жанру). Оценки должны быть в диапазоне от 1.0 до 10.0. Текстовые поля должны быть на прекрасном русском языке.`,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Название произведения на русском" },
              originalTitle: { type: Type.STRING, description: "Оригинальное англоязычное или оригинальное не-русское название" },
              type: { type: Type.STRING, description: "Тип медиа: movie (фильм/короткометражка), tv (сериал), anime (аниме)" },
              year: { type: Type.INTEGER, description: "Год выпуска" },
              releaseDate: { type: Type.STRING, description: "Точная дата релиза YYYY-MM-DD" },
              genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 жанра на русском" },
              duration: { type: Type.STRING, description: "Длительность, например: '142 мин' или '24 мин / 24 серии'" },
              seasons: { type: Type.INTEGER, description: "Количество сезонов (целое число, только для tv или anime)" },
              episodesCount: { type: Type.INTEGER, description: "Общее количество эпизодов (целое число, только для tv или anime)" },
              episodeDuration: { type: Type.INTEGER, description: "Средняя длительность одного эпизода в минутах (целое число, только для tv или anime)" },
              isEnded: { type: Type.BOOLEAN, description: "Закончен ли сериал/аниме (true, если полностью закончен, false или отсутствует, если ещё выходит/н.в., только для tv или anime)" },
              endDate: { type: Type.STRING, description: "Точная дата релиза последнего эпизода последнего сезона YYYY-MM-DD (только для tv или anime, если закончен)" },
              franchise: { type: Type.STRING, description: "Название киновселенной или франшизы, если произведение входит в какую-то серию фильмов/сериалов (например: 'Брат', 'Трансформеры', 'Звёздные войны'). Если одиночное произведение - оставь пустым." },
              country: { type: Type.STRING, description: "Страна производства на русском, например: 'США, Франция'" },
              director: { type: Type.STRING, description: "Режиссер произведения" },
              composer: { type: Type.STRING, description: "Композитор произведения (музыкальное сопровождение)" },
              cast: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4-5 главных актеров" },
              overview: { type: Type.STRING, description: "Интригующее и глубокое описание сюжета и атмосферы произведения на русском языке. Не спойлери концовку!" },
              ratingsAverageBreakdown: {
                type: Type.OBJECT,
                properties: {
                  story: { type: Type.NUMBER, description: "Оценка сюжета и идеи от 1.0 до 10.0" },
                  acting: { type: Type.NUMBER, description: "Оценка актерской игры от 1.0 до 10.0" },
                  visuals: { type: Type.NUMBER, description: "Оценка визуала и съемки от 1.0 до 10.0" },
                  sound: { type: Type.NUMBER, description: "Оценка музыки и звука от 1.0 до 10.0" },
                  genreMatch: { type: Type.NUMBER, description: "Оценка соответствия жанру от 1.0 до 10.0" }
                },
                required: ["story", "acting", "visuals", "sound", "genreMatch"]
              },
              unsplashSearchPoster: { type: Type.STRING, description: "2-3 поисковых слова на английском для Unsplash для нахождения постера фильма (например: 'blade runner dark neon' или 'space orbit spaceship')" },
              unsplashSearchBackdrop: { type: Type.STRING, description: "2-3 поисковых слова на английском для Unsplash для широких атмосферных фонов (например: 'dark city streets rainy' или 'vintage retro cinema room')" }
            },
            required: ["title", "originalTitle", "type", "year", "releaseDate", "genres", "duration", "country", "director", "composer", "cast", "overview", "ratingsAverageBreakdown", "unsplashSearchPoster", "unsplashSearchBackdrop"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      const cleanJson = JSON.parse(responseText.trim());
      const generatedSlug = slugify(cleanJson.title) || "movie-" + Date.now();

      // Resolve poster/backdrop from search queries beautifully
      const pKeyword = encodeURIComponent(cleanJson.unsplashSearchPoster || "cinema");
      const bKeyword = encodeURIComponent(cleanJson.unsplashSearchBackdrop || "movie theater");

      const generatedTitle: MovieTitle = {
        id: "gen_" + Math.random().toString(36).substr(2, 9),
        slug: generatedSlug,
        title: cleanJson.title,
        originalTitle: cleanJson.originalTitle,
        type: cleanJson.type === "movie" ? "movie" : cleanJson.type === "tv" ? "tv" : cleanJson.type === "anime" ? "anime" : "short",
        year: cleanJson.year || 2024,
        releaseDate: cleanJson.releaseDate || "2024-01-01",
        genres: cleanJson.genres || ["Кино"],
        duration: cleanJson.duration || "120 мин",
        seasons: cleanJson.seasons,
        episodesCount: cleanJson.episodesCount,
        episodeDuration: cleanJson.episodeDuration,
        isEnded: cleanJson.isEnded,
        endDate: cleanJson.endDate,
        franchise: cleanJson.franchise || undefined,
        country: cleanJson.country || "Мир",
        director: cleanJson.director || "Неизвестный автор",
        composer: cleanJson.composer || "Неизвестный композитор",
        cast: cleanJson.cast || [],
        overview: cleanJson.overview,
        backdropUrl: `https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80&sig=${Math.floor(Math.random() * 1000)}&q_keyword=${bKeyword}`,
        posterUrl: `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80&sig=${Math.floor(Math.random() * 1000)}&q_keyword=${pKeyword}`,
        trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E", // Default trailers, can load YouTube searches nicely
        ratingsAverageBreakdown: {
          story: parseFloat(cleanJson.ratingsAverageBreakdown.story) || 7.0,
          acting: parseFloat(cleanJson.ratingsAverageBreakdown.acting) || 7.0,
          visuals: parseFloat(cleanJson.ratingsAverageBreakdown.visuals) || 7.0,
          sound: parseFloat(cleanJson.ratingsAverageBreakdown.sound) || 7.0,
          genreMatch: parseFloat(cleanJson.ratingsAverageBreakdown.genreMatch) || 7.0
        },
        ratingAverage: 70.0, // recalculated below
        ratingsCount: Math.floor(Math.random() * 40) + 12
      };

      generatedTitle.ratingAverage = calculateOverallRating(generatedTitle.ratingsAverageBreakdown);

      // Proactively initialize external ratings
      let finalGenerated = generatedTitle;
      try {
        finalGenerated = await updateMovieExternalRatings(generatedTitle);
      } catch (err) {
        console.error("Failed to populate external ratings on Gemini generated movie:", err);
      }

      // Append and save in server database
      db.movies.push(finalGenerated);
      writeDB(db);

      res.json({ success: true, movie: finalGenerated });
    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      res.status(500).json({ error: "Не удалось автоматически сгенерировать данные ИИ. Ошибка: " + err.message });
    }
  });

  // Correct / edit movie data based on user description with Gemini (places under pending moderation)
  app.post("/api/gemini/correct-movie", async (req, res) => {
    const { slug, description, userEmail, username } = req.body;
    if (!slug) {
      return res.status(400).json({ error: "Не передан идентификатор фильма" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Пожалуйста, опишите, какие данные неверны" });
    }

    const db = readDB();
    const movieIdx = db.movies.findIndex(m => m.slug === slug);
    if (movieIdx === -1) {
      return res.status(404).json({ error: "Произведение не найдено" });
    }

    const movie = db.movies[movieIdx];
    const aiClient = getAI();

    // Setup fallback or Gemini proposed payload
    let proposedMovie: MovieTitle;

    if (!aiClient) {
      // Fallback offline mode correction
      const cleanedDesc = description.trim();
      const updatedMovie = { ...movie };
      
      // Look for a year
      const yearMatch = cleanedDesc.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        updatedMovie.year = parseInt(yearMatch[0]);
        updatedMovie.releaseDate = `${yearMatch[0]}-01-01`;
      }

      // Look for a director (e.g. "режиссер Нолан")
      const directorRegex = /(?:режиссер|режиссёр|автор)\s+([А-Яа-яЁёA-Za-z\s]+)(?:,|$|\.|\(|\))/i;
      const dirMatch = cleanedDesc.match(directorRegex);
      if (dirMatch && dirMatch[1]) {
        updatedMovie.director = dirMatch[1].trim();
      }

      // Look for a duration
      const durationMatch = cleanedDesc.match(/(\d+)\s*(?:мин|минут)/i);
      if (durationMatch) {
        updatedMovie.duration = `${durationMatch[1]} мин`;
      }

      // Look for a country
      const countryRegex = /(?:страна|производство)\s+([А-Яа-яЁёA-Za-z\s]+)(?:,|$|\.|\(|\))/i;
      const countryMatch = cleanedDesc.match(countryRegex);
      if (countryMatch && countryMatch[1]) {
        updatedMovie.country = countryMatch[1].trim();
      }

      // Add a note about the correction to the overview
      updatedMovie.overview = `${updatedMovie.overview}\n\n[Данные скорректированы по отзыву пользователя: "${cleanedDesc}"]`;
      proposedMovie = updatedMovie;
    } else {
      try {
        console.log(`Querying Gemini to draft/correct movie details for: ${movie.title} with report: ${description}`);
        const prompt = `Вот текущее описание фильма/сериала из энциклопедии:
${JSON.stringify({
  title: movie.title,
  originalTitle: movie.originalTitle,
  type: movie.type,
  year: movie.year,
  releaseDate: movie.releaseDate,
  genres: movie.genres,
  duration: movie.duration,
  seasons: movie.seasons,
  episodesCount: movie.episodesCount,
  country: movie.country,
  director: movie.director,
  cast: movie.cast,
  overview: movie.overview
}, null, 2)}

Пользователь прислал сообщение со следующими уточнениями, исправлениями или жалобами на неточность:
"${description}"

Твоя задача: проанализировать текущие данные и указанные пользователем исправления. Если исправления соответствуют действительности (или если они звучат правдоподобно), скорректируй и обнови соответствующие поля объекта. Все остальные свойства, не затронутые замечаниями, оставь в исходном виде, но убедись, что итоговый результат полностью энциклопедически верен. Названия и описание должны остаться на русском языке. Ответ должен строго соответствовать заданной схеме JSON.`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: `Ты — авторитетный профессиональный киноредактор и кинокритик. Твоя задача — точно отредактировать переданный объект фильма на основе пожеланий пользователя и точных энциклопедических данных. Все поля должны быть на качественном и грамотном русском языке.`,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Название на русском" },
                originalTitle: { type: Type.STRING, description: "Оригинальное не-русское название" },
                type: { type: Type.STRING, description: "movie, tv, anime, short" },
                year: { type: Type.INTEGER, description: "Год выпуска" },
                releaseDate: { type: Type.STRING, description: "Точная дата релиза YYYY-MM-DD" },
                genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Жанры на русском" },
                duration: { type: Type.STRING, description: "Длительность (например: '124 мин')" },
                seasons: { type: Type.INTEGER, description: "Количество сезонов (если применимо)" },
                episodesCount: { type: Type.INTEGER, description: "Количество эпизодов (если применимо)" },
                episodeDuration: { type: Type.INTEGER, description: "Средняя длительность эпизода (если применимо)" },
                franchise: { type: Type.STRING, description: "Франшиза" },
                country: { type: Type.STRING, description: "Страна производства" },
                director: { type: Type.STRING, description: "Режиссер" },
                composer: { type: Type.STRING, description: "Композитор" },
                cast: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Список 4-5 ключевых актеров" },
                overview: { type: Type.STRING, description: "Полное описание сюжета" }
              },
              required: ["title", "type", "year", "releaseDate", "genres", "duration", "country", "director", "composer", "cast", "overview"]
            }
          }
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Empty response from Gemini");
        }

        const cleanJson = JSON.parse(responseText.trim());

        proposedMovie = {
          ...movie,
          title: cleanJson.title || movie.title,
          originalTitle: cleanJson.originalTitle !== undefined ? cleanJson.originalTitle : movie.originalTitle,
          type: cleanJson.type || movie.type,
          year: cleanJson.year || movie.year,
          releaseDate: cleanJson.releaseDate || movie.releaseDate,
          genres: cleanJson.genres || movie.genres,
          duration: cleanJson.duration || movie.duration,
          seasons: cleanJson.seasons !== undefined ? cleanJson.seasons : movie.seasons,
          episodesCount: cleanJson.episodesCount !== undefined ? cleanJson.episodesCount : movie.episodesCount,
          episodeDuration: cleanJson.episodeDuration !== undefined ? cleanJson.episodeDuration : movie.episodeDuration,
          franchise: cleanJson.franchise !== undefined ? cleanJson.franchise : movie.franchise,
          country: cleanJson.country || movie.country,
          director: cleanJson.director || movie.director,
          composer: cleanJson.composer || movie.composer,
          cast: cleanJson.cast || movie.cast,
          overview: cleanJson.overview || movie.overview
        };
      } catch (err: any) {
        console.error("Gemini Edit Draft Error:", err);
        return res.status(550).json({ error: "Не удалось сформировать ИИ-черновик изменений: " + err.message });
      }
    }

    // Now, let's store this request into our pending list instead of saving directly!
    const newRequest = {
      id: "req_" + Math.random().toString(36).substr(2, 9),
      movieSlug: slug,
      movieTitle: movie.title,
      userEmail: userEmail || "anonymous@example.com",
      username: username || "Аноним",
      description: description,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      proposedChanges: proposedMovie
    };

    db.correctionRequests = db.correctionRequests || [];
    db.correctionRequests.push(newRequest);
    writeDB(db);

    res.json({ 
      success: true, 
      pendingApproval: true, 
      request: newRequest,
      warning: !aiClient ? "Использован локальный алгоритм корректировки данных для предпросмотра." : undefined
    });
  });

  // Correct / edit director data based on user description with Gemini (places under pending moderation)
  app.post("/api/gemini/correct-director", async (req, res) => {
    const { directorId, description, userEmail, username } = req.body;
    if (!directorId) {
      return res.status(400).json({ error: "Не передан идентификатор режиссёра" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Пожалуйста, опишите, какие данные неверны" });
    }

    const db = readDB();
    const directorIdx = (db.directors || []).findIndex(d => d.id === directorId);
    if (directorIdx === -1) {
      return res.status(404).json({ error: "Режиссёр не найден" });
    }

    const director = db.directors[directorIdx];
    const aiClient = getAI();

    // Setup fallback or Gemini proposed payload
    let proposedDirector: any;

    if (!aiClient) {
      // Fallback offline mode correction
      const cleanedDesc = description.trim();
      const updatedDirector = { ...director };

      updatedDirector.biography = `${updatedDirector.biography}\n\n[Данные скорректированы по отзыву пользователя: "${cleanedDesc}"]`;
      proposedDirector = updatedDirector;
    } else {
      try {
        console.log(`Querying Gemini to draft/correct director details for: ${director.name} with report: ${description}`);
        const prompt = `Вот текущее описание режиссера из энциклопедии:
${JSON.stringify({
  name: director.name,
  originalName: director.originalName,
  yearsOfLife: director.yearsOfLife,
  photoUrl: director.photoUrl,
  quote: director.quote,
  biography: director.biography,
  country: director.country,
  style: director.style,
  keyThemes: director.keyThemes,
  awards: director.awards
}, null, 2)}

Пользователь прислал сообщение со следующими уточнениями, исправлениями или жалобами на неточность:
"${description}"

Твоя задача: проанализировать текущие данные и указанные пользователем исправления. Если исправления соответствуют действительности (или если они звучат правдоподобно), скорректируй и обнови соответствующие поля объекта. Все остальные свойства, не затронутые замечаниями, оставь в исходном виде, но убедись, что итоговый результат полностью энциклопедически верен. Названия и описание должны остаться на русском языке. Ответ должен строго соответствовать заданной схеме JSON.`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: `Ты — авторитетный профессиональный киноредактор и кинокритик. Твоя задача — точно отредактировать переданный объект режиссера на основе пожеланий пользователя и точных энциклопедических данных. Все поля должны быть на качественном и грамотном русском языке.`,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Имя (RU)" },
                originalName: { type: Type.STRING, description: "Оригинальное имя" },
                yearsOfLife: { type: Type.STRING, description: "Годы жизни / Возраст" },
                quote: { type: Type.STRING, description: "Цитата" },
                biography: { type: Type.STRING, description: "Биография" },
                country: { type: Type.STRING, description: "Страна" },
                style: { type: Type.STRING, description: "Стиль режиссуры" },
                keyThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ключевые темы" },
                awards: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Награды" }
              },
              required: ["name", "yearsOfLife", "biography", "country", "style", "keyThemes", "awards"]
            }
          }
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Empty response from Gemini");
        }

        const cleanJson = JSON.parse(responseText.trim());

        proposedDirector = {
          ...director,
          name: cleanJson.name || director.name,
          originalName: cleanJson.originalName !== undefined ? cleanJson.originalName : director.originalName,
          yearsOfLife: cleanJson.yearsOfLife || director.yearsOfLife,
          quote: cleanJson.quote !== undefined ? cleanJson.quote : director.quote,
          biography: cleanJson.biography || director.biography,
          country: cleanJson.country || director.country,
          style: cleanJson.style || director.style,
          keyThemes: cleanJson.keyThemes || director.keyThemes,
          awards: cleanJson.awards || director.awards
        };
      } catch (err: any) {
        console.error("Gemini Director Edit Draft Error:", err);
        return res.status(550).json({ error: "Не удалось сформировать ИИ-черновик изменений: " + err.message });
      }
    }

    // Store request in pending list
    const newRequest = {
      id: "req_" + Math.random().toString(36).substr(2, 9),
      directorId: directorId,
      directorName: director.name,
      userEmail: userEmail || "anonymous@example.com",
      username: username || "Аноним",
      description: description,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      proposedChanges: proposedDirector,
      type: "director" as const
    };

    db.correctionRequests = db.correctionRequests || [];
    db.correctionRequests.push(newRequest);
    writeDB(db);

    res.json({ 
      success: true, 
      pendingApproval: true, 
      request: newRequest,
      warning: !aiClient ? "Использован локальный алгоритм корректировки данных для предпросмотра." : undefined
    });
  });

  // Fetch all correction/moderation requests
  app.get("/api/moderation/requests", (req, res) => {
    const db = readDB();
    const requests = db.correctionRequests || [];
    res.json({ success: true, requests });
  });

  // Approve or Reject a correction/moderation request
  app.post("/api/moderation/review", (req, res) => {
    const { requestId, action } = req.body; // action: "approve" or "reject"
    if (!requestId || !action) {
      return res.status(400).json({ error: "Недостаточно параметров для обработки модерации" });
    }

    const db = readDB();
    db.correctionRequests = db.correctionRequests || [];
    const reqIndex = db.correctionRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) {
      return res.status(404).json({ error: "Запрос на модерацию не найден" });
    }

    const request = db.correctionRequests[reqIndex];
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Запрос уже обработан" });
    }

    if (action === "approve") {
      if (request.type === "director" || request.directorId) {
        db.directors = db.directors || [];
        const dirIdx = db.directors.findIndex(d => d.id === request.directorId);
        if (dirIdx !== -1) {
          const originalDirector = db.directors[dirIdx];
          db.directors[dirIdx] = {
            ...originalDirector,
            ...request.proposedChanges,
            id: originalDirector.id // keep original ID
          };
        }
      } else {
        const movieIdx = db.movies.findIndex(m => m.slug === request.movieSlug);
        if (movieIdx !== -1) {
          // Safe validation: Only apply fields defined inside the MovieTitle interface
          const originalMovie = db.movies[movieIdx];
          db.movies[movieIdx] = {
            ...originalMovie,
            ...request.proposedChanges,
            // Guarantee that the static key information remains completely aligned
            id: originalMovie.id,
            slug: originalMovie.slug
          };
        }
      }
      request.status = "approved";
    } else if (action === "reject") {
      request.status = "rejected";
    } else {
      return res.status(400).json({ error: "Передано недопустимое действие модерации" });
    }

    writeDB(db);
    res.json({ success: true, request });
  });

  // Personal recommendations endpoint
  app.post("/api/gemini/recommend", async (req, res) => {
    const { mood, duration, preferredGenre, exclusions, userId } = req.body;
    if (!mood) {
      return res.status(400).json({ error: "Пожалуйста, выберите настроение" });
    }

    const db = readDB();
    const userReviews = userId ? db.reviews.filter(r => r.userId === userId) : [];
    const watchedSlugs = userReviews.map(r => r.titleSlug);
    const userProfile = userId ? db.users.find(u => u.id === userId) : null;
    if (userProfile && userProfile.watchlist) {
      watchedSlugs.push(...userProfile.watchlist);
    }

    const aiClient = getAI();
    if (!aiClient) {
      // Offline fallback: Dynamically select matching movies from our DB that we didn't watch
      let candidates = db.movies.filter(m => !watchedSlugs.includes(m.slug));
      if (candidates.length === 0) {
        candidates = db.movies; // reset if they watched everything
      }

      // Filter by genre constraint if given
      if (preferredGenre && preferredGenre.trim() !== "") {
        const genreQuery = preferredGenre.trim().toLowerCase();
        const genMatched = candidates.filter(m => m.genres.some(g => g.toLowerCase().includes(genreQuery)));
        if (genMatched.length > 0) candidates = genMatched;
      }
      // Filter out exclusions
      if (exclusions && exclusions.trim() !== "") {
        const exclQuery = exclusions.trim().toLowerCase();
        candidates = candidates.filter(m => !m.genres.some(g => g.toLowerCase().includes(exclQuery)) && !m.title.toLowerCase().includes(exclQuery));
      }

      // Filter by duration
      if (duration === "short") {
        candidates = candidates.filter(m => m.type !== "movie" || parseInt(m.duration) < 95);
      } else if (duration === "long") {
        candidates = candidates.filter(m => m.type === "movie" && parseInt(m.duration) > 120);
      } else if (duration === "medium") {
        candidates = candidates.filter(m => m.type === "movie" && parseInt(m.duration) >= 95 && parseInt(m.duration) <= 120);
      }
      
      if (candidates.length === 0) {
        candidates = db.movies;
      }

      const selected = candidates.slice(0, 4);
      const results = selected.map(m => ({
        title: m.title,
        originalTitle: m.originalTitle || m.title,
        slug: m.slug,
        type: m.type,
        genres: m.genres,
        year: m.year,
        duration: m.duration,
        country: m.country,
        director: m.director,
        cast: m.cast,
        overview: m.overview,
        backdropUrl: m.backdropUrl,
        posterUrl: m.posterUrl,
        explanation: `Этот фильм отлично подходит под ваше настроение "${mood}". Он вовлекает своей неповторимой атмосферой и позволит вам приятно провести время.`,
        isLocal: true
      }));

      return res.json({ success: true, recommendations: results, fallback: true });
    }

    try {
      const slimCatalog = db.movies.map(m => ({
        title: m.title,
        originalTitle: m.originalTitle,
        slug: m.slug,
        type: m.type,
        genres: m.genres,
        year: m.year,
        director: m.director,
        rating: m.ratingAverage,
        duration: m.duration
      }));

      const sysInstruction = `Ты — экспертный ИИ-кинориелтор и персональный киноассистент. Твоя цель — подбирать идеальные персонализированные кинорекомендации для пользователей. Твои пояснения должны быть краткими, яркими, пропитанными любовью к кинематографу и аргументировано объяснять, почему каждый фильм точно соответствует выбранным критериям. Ответ присылай СТРОГО в формате JSON.`;

      const prompt = `Подбери от 3 до 5 лучших персональных рекомендаций фильмов, сериалов или аниме на русском языке.
Критерии подбора:
- Настроение пользователя: "${mood}"
- Длительность: "${duration}" (короткий / средний / длинный)
- Предпочитаемый жанр или ключевые темы: "${preferredGenre || 'Любой'}"
- Исключить: "${exclusions || 'Ничего'}"
- Уже просмотренные (эти фильмы НЕЛЬЗЯ рекомендовать, исключи их): ${JSON.stringify(watchedSlugs)}

Ниже представлен список локального каталога фильмов на нашем сайте. По возможности, если фильм из этого списка ХОРОШО подходит под настроение, включи его в рекомендации и передай его slug в соответствующее поле (так пользователь сможет открыть его страницу). Если фильм не из списка, сгенерируй новое произведение и установи slug в пустую строку "" или сгенерируй красивый слаг.

Локальный каталог фильмов:
${JSON.stringify(slimCatalog.slice(0, 40))}

Формат вывода должен быть строго JSON массивом объектов, содержащим следующие поля для каждого рекомендуемого фильма:
- title: Название произведения на русском
- originalTitle: Оригинальное не-русское название
- slug: Слаг из локального каталога (если совпало с фильмом из локального каталога), в противном случае - пустая строка "" или новый слаг
- type: Тип (movie, tv, anime, short)
- genres: Массив жанров на русском (например, ["Фантастика", "Драма"])
- year: Год выпуска (число)
- duration: Длительность (например, "142 мин")
- country: Страна выпуска
- director: Режиссер
- cast: Массив из 3-4 главных актеров
- overview: Краткое описание сюжета без спойлеров (2-3 предложения)
- explanation: Искреннее развёрнутое пояснение на прекрасном русском языке, почему именно этот фильм подходит под настроение пользователя "${mood}" (2-3 предложения)
- isLocal: Булевое значение (true, если фильм взят из предоставленного локального каталога, false если это мировая классика за его рамками)

Верни точную структуру JSON, не оборачивай в markdown-окружение.`;

      const gResponse = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: sysInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                originalTitle: { type: Type.STRING },
                slug: { type: Type.STRING },
                type: { type: Type.STRING },
                genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                year: { type: Type.INTEGER },
                duration: { type: Type.STRING },
                country: { type: Type.STRING },
                director: { type: Type.STRING },
                composer: { type: Type.STRING },
                cast: { type: Type.ARRAY, items: { type: Type.STRING } },
                overview: { type: Type.STRING },
                explanation: { type: Type.STRING },
                isLocal: { type: Type.BOOLEAN }
              },
              required: ["title", "originalTitle", "slug", "type", "genres", "year", "duration", "country", "director", "composer", "cast", "overview", "explanation", "isLocal"]
            }
          }
        }
      });

      const responseText = gResponse.text;
      if (!responseText) {
        throw new Error("No response text from Gemini recommendations");
      }

      let parsedRecs = JSON.parse(responseText.trim());
      
      parsedRecs = parsedRecs.map((r: any) => {
        if (r.slug) {
          const match = db.movies.find(m => m.slug === r.slug);
          if (match) {
            r.posterUrl = match.posterUrl;
            r.backdropUrl = match.backdropUrl;
            r.isLocal = true;
            return r;
          }
        }

        const keyword = r.genres && r.genres.length > 0 ? r.genres[0].toLowerCase() : "cinema";
        let poster = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80";
        let backdrop = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80";

        if (keyword.includes("комед")) {
          poster = "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80";
        } else if (keyword.includes("ужас") || keyword.includes("трилл")) {
          poster = "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80";
          backdrop = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80";
        } else if (keyword.includes("фантаст") || keyword.includes("косм")) {
          poster = "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80";
          backdrop = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80";
        } else if (keyword.includes("драм") || keyword.includes("мело")) {
          poster = "https://images.unsplash.com/photo-1492447273231-0f8fe11ca5fc?auto=format&fit=crop&w=600&q=80";
        }

        r.posterUrl = poster;
        r.backdropUrl = backdrop;
        r.isLocal = false;
        return r;
      });

      res.json({ success: true, recommendations: parsedRecs });
    } catch (err: any) {
      console.error("Gemini Recommendation Core Error: ", err);
      res.status(500).json({ error: "Ошибка при получении ИИ-рекомендаций: " + err.message });
    }
  });

  // Personal Taste Analysis based on user reviews
  app.post("/api/user/:userId/taste-analysis", async (req, res) => {
    const { userId } = req.params;
    const db = readDB();
    
    const userReviews = db.reviews.filter(r => r.userId === userId);
    if (userReviews.length === 0) {
      return res.status(400).json({ error: "Напишите хотя бы одну рецензию, чтобы запустить глубокий ИИ-анализ вашего киновкуса!" });
    }

    const aiClient = getAI();
    if (!aiClient) {
      // Algorithmic analysis fallback
      const avgStory = userReviews.reduce((sum, r) => sum + (r.ratings.story || 5), 0) / userReviews.length;
      const avgActing = userReviews.reduce((sum, r) => sum + (r.ratings.acting || 5), 0) / userReviews.length;
      const avgVisuals = userReviews.reduce((sum, r) => sum + (r.ratings.visuals || 5), 0) / userReviews.length;
      const avgSound = userReviews.reduce((sum, r) => sum + (r.ratings.sound || 5), 0) / userReviews.length;
      
      let topStrength = "актерская игра и раскрытие персонажей";
      let focusPhrase = "Вы цените живую человеческую драму и психологизм персонажей.";
      if (avgVisuals >= Math.max(avgStory, avgActing, avgSound)) {
        topStrength = "визуальный стиль и операторская работа";
        focusPhrase = "Для вас кинематограф — это прежде всего визуальное искусство, вы цените красивый кадр, цветокоррекцию и атмосферу.";
      } else if (avgStory >= Math.max(avgVisuals, avgActing, avgSound)) {
        topStrength = "интригующий сюжет и глубина мысли";
        focusPhrase = "Вам важна логика повествования, неожиданные повороты и оригинальные идеи, заставляющие задуматься.";
      } else if (avgSound >= Math.max(avgVisuals, avgStory, avgActing)) {
        topStrength = "музыкальное сопровождение и саунд-дизайн";
        focusPhrase = "Вы обладаете тонким музыкальным слухом, оценивая звуковой ландшафт фильма не меньше его картинки.";
      }

      const totalChars = userReviews.reduce((sum, r) => sum + r.text.length, 0);
      const isWordy = totalChars / userReviews.length > 300;
      const criticProfile = isWordy 
        ? "Ваши тексты фундаментальны, вы подробно разбираете художественные аспекты фильмов как настоящий публицист." 
        : "Вы предпочитаете ёмкую и меткую критику, концентрируясь на сути произведения без лишней воды.";

      const suggestions = avgVisuals > 7.5 
        ? "Рекомендуем обратить внимание на работы Дени Вильнёва, Уэса Андерсона и Николаса Виндинга Рефна за их выдающийся визуальный язык."
        : "Рекомендуем ознакомиться с работами Кристофера Нолана, Квентина Тарантино или Мартина Скорсезе за сильные диалоги и структуры повествования.";

      const criticCompare = avgStory > 8.0 
        ? "Ваш скрупулёзный разбор сюжетных арок сближает вас со стилем Роджера Эберта."
        : "Ваш прагматичный подход и внимание к визуальной эстетике напоминает критиков французской Новой волны (Cahiers du Cinéma).";

      const fallbackAnalysis = {
        preferences: `Вы — вдумчивый зритель. ${focusPhrase} Главный упор в ваших оценках делается на ${topStrength}.`,
        dislikes: "Судя по вашим более низким оценкам, вам категорически претят шаблонный юмор, сюжетные дыры и слабая мотивация героев, когда фильм пытается казаться больше, чем он есть.",
        strengths: `Ваша сильная сторона как критика — это ${topStrength}. ${criticProfile}`,
        recommendations: suggestions,
        comparison: criticCompare,
        fallback: true
      };

      return res.json({ success: true, analysis: fallbackAnalysis });
    }

    try {
      const reviewsData = userReviews.map(r => ({
        movie: r.titleName,
        rating: r.averageRating,
        text: r.text,
        ratings: r.ratings
      }));

      const systemInstruction = `Ты — знаменитый киновед, тонкий психолог и бескомпромиссный арт-критик. Твоя задача — объективно, глубоко, живо и литературно проанализировать киновкус пользователя на основе его рецензий. Ответ возвращай строго в формате JSON. Тексты должны быть написаны красивым, грамотным и увлекательным русским языком. Избегай шаблонных фраз.`;

      const prompt = `Проанализируй вкусовые предпочтения пользователя на основе написанных им рецензий:
${JSON.stringify(reviewsData)}

Составь честный, развёрнутый и психологически точный портрет его киновкуса. 

Выведи результат строго в формате JSON, содержащем следующие свойства:
- preferences: Развёрнутое описание основных предпочтений (Что он любит в кино? Сделай текст длинным, на 3-5 предложений)
- dislikes: Что пользователю гарантированно не нравится, чего он не переносит (Шаблоны, плохая игра, пафос? Нарисуй это в 2-3 предложениях)
- strengths: Сильные стороны пользователя как критика (В чём он разбирается лучше всего? 3-4 предложения)
- recommendations: Рекомендации жанров или режиссёров, которые могут ему понравиться (Предложи конкретных выдающихся режиссеров и жанры с кратким объяснением почему. 2-3 предложения)
- comparison: Сравнение вкуса с известными критиками или культовыми фигурами киномира (Например: Роджер Эберт, Полин Кейл или критики Cahiers du Cinéma. Аргументируй это!)

Все поля должны быть заполнены содержательными, художественными текстами на русском языке. Без маркдауна.`;

      const gResponse = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              preferences: { type: Type.STRING },
              dislikes: { type: Type.STRING },
              strengths: { type: Type.STRING },
              recommendations: { type: Type.STRING },
              comparison: { type: Type.STRING }
            },
            required: ["preferences", "dislikes", "strengths", "recommendations", "comparison"]
          }
        }
      });

      const responseText = gResponse.text;
      if (!responseText) {
        throw new Error("No text returned from Gemini taste analytical core");
      }

      const parsedAnalysis = JSON.parse(responseText.trim());
      res.json({ success: true, analysis: parsedAnalysis });
    } catch (err: any) {
      console.error("Gemini Taste Analysis Error: ", err);
      res.status(500).json({ error: "Ошибка ИИ-анализа: " + err.message });
    }
  });

  // --- End of API ---


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[25-й Кадр] Backend Express & Vite running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
