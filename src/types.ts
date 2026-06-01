export interface RatingBreakdown {
  story: number;       // Сюжет и идея
  acting: number;      // Актёрская игра
  visuals: number;     // Визуал и съёмка
  sound: number;       // Музыка и звук
  genreMatch: number;  // Соответствие жанру
}

export function calculateOverallRating(breakdown: Partial<RatingBreakdown> | undefined): number {
  if (!breakdown) return 0;
  const story = Number(breakdown.story) || 5;
  const acting = Number(breakdown.acting) || 5;
  const visuals = Number(breakdown.visuals) || 5;
  const sound = Number(breakdown.sound) || 5;
  const genreMatch = Number(breakdown.genreMatch) || 5;

  const sumVal = story + acting + visuals + sound;
  const multiplier = 1.0 + ((genreMatch - 1) / 9.0) * 1.5;
  const rawScore = sumVal * multiplier;
  return parseFloat(Math.min(100, Math.max(0, rawScore)).toFixed(1));
}

export type MediaType = 'movie' | 'tv' | 'anime' | 'short';

export interface ExternalTitleRatings {
  kinopoisk?: { rating: number; votes: number };
  imdb?: { rating: number; votes: number };
  metacritic?: { rating: number };
  rottenTomatoes?: { criticsRating: number; audienceRating: number };
  lastUpdated?: string;
}

export interface MovieTitle {
  id: string; // TMDB ID or slugified title
  slug: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  year: number;
  releaseDate: string;
  genres: string[];
  duration: string; // e.g. "124 мин" or "24 мин / 12 сер."
  seasons?: number;
  episodesCount?: number;
  episodeDuration?: number;
  franchise?: string;
  isEnded?: boolean;
  endDate?: string;
  country: string;
  director: string;
  composer?: string; // Композитор
  cast: string[];
  overview: string;
  backdropUrl: string;
  posterUrl: string;
  trailerUrl?: string; // Youtube link or key
  ratingsAverageBreakdown: RatingBreakdown;
  ratingAverage: number; // calculated overall rating (1-10)
  ratingsCount: number;
  kinopoiskId?: string;
  imdbId?: string;
  externalRatings?: ExternalTitleRatings;
}

export function getSeasonsLabel(seasons: number): string {
  const mod10 = seasons % 10;
  const mod100 = seasons % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${seasons} сезонов`;
  }
  if (mod10 === 1) {
    return `${seasons} сезон`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${seasons} сезона`;
  }
  return `${seasons} сезонов`;
}

export function getEpisodesLabel(episodes: number): string {
  const mod10 = episodes % 10;
  const mod100 = episodes % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${episodes} серий`;
  }
  if (mod10 === 1) {
    return `${episodes} серия`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${episodes} серии`;
  }
  return `${episodes} серий`;
}

export function formatMovieDuration(movie: {
  type: string;
  duration: string;
  seasons?: number;
  episodesCount?: number;
  episodeDuration?: number;
}): string {
  if (movie.type === "tv" || movie.type === "anime") {
    const seasons = movie.seasons || 1;
    let episodesCount = movie.episodesCount;
    let episodeDuration = movie.episodeDuration;

    // Fallback parsing if we somehow don't have seasons, episodesCount or episodeDuration
    if (!episodesCount || !episodeDuration) {
      // Try to parse from movie.duration (e.g. "24 мин / 87 эп." or "49 мин / 62 эп.")
      const match = movie.duration.match(/(\d+)\s*мин\s*\/\s*(\d+)/i);
      if (match) {
        episodeDuration = parseInt(match[1]);
        episodesCount = parseInt(match[2]);
      } else {
        // Just return the raw duration if we can't parse or format
        return movie.duration;
      }
    }

    const sLabel = getSeasonsLabel(seasons);
    const eLabel = getEpisodesLabel(episodesCount);
    return `${sLabel} / ${eLabel} / ${episodeDuration} мин`;
  }
  return movie.duration;
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
    return dateString;
  }
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }
  return dateString;
}

export function formatMovieReleaseDate(movie: {
  type: string;
  releaseDate: string;
  isEnded?: boolean;
  endDate?: string;
}): string {
  if (movie.type === "tv" || movie.type === "anime") {
    const start = formatDate(movie.releaseDate);
    if (movie.isEnded) {
      const end = formatDate(movie.endDate);
      return end ? `${start} – ${end}` : `${start} – н.в.`;
    } else {
      return `${start} – н.в.`;
    }
  }
  return formatDate(movie.releaseDate);
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  watchlist: string[]; // movie slugs or IDs
  following: string[]; // list of user IDs this user follows
  followers: string[]; // list of user IDs following this user
  createdAt: string;
  showcase?: string[]; // list of user showcase achievement IDs (max 3)
  favoriteMovieSlug?: string;
  favoriteMovieTitle?: string;
  profileCoverUrl?: string;
}

export interface UserReview {
  id: string;
  titleId: string;
  titleSlug: string;
  titleName: string;
  titleYear: number;
  titleType: MediaType;
  titlePoster: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatar: string;
  ratings: RatingBreakdown;
  averageRating: number;
  text: string;
  createdAt: string;
  likes: string[]; // list of userIds who liked
  comments?: {
    id: string;
    userId: string;
    username: string;
    userDisplayName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
  }[];
}

export interface MovieSearchParams {
  query: string;
  type?: MediaType | 'all';
  genre?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface Director {
  id: string; // url-friendly slug
  name: string;
  originalName: string;
  yearsOfLife: string;
  photoUrl: string;
  quote: string;
  biography: string;
  country: string;
  style: string;
  keyThemes: string[];
  awards: string[];
}


export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percent: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CorrectionRequest {
  id: string;
  movieSlug?: string;
  movieTitle?: string;
  directorId?: string;
  directorName?: string;
  userEmail: string;
  username: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  proposedChanges: any;
  type?: "movie" | "director";
}


