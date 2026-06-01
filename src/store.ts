import { create } from "zustand";
import { MovieTitle, UserReview, UserProfile, MediaType, Achievement, UserAchievement, AchievementProgress, Director, CorrectionRequest } from "./types";

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  watchlist: string[];
  following: string[];
  followers: string[];
  showcase?: string[];
  favoriteMovieSlug?: string;
  favoriteMovieTitle?: string;
  profileCoverUrl?: string;
}

interface AppState {
  // Navigation Routing Space
  currentPage: "home" | "title" | "profile" | "tops" | "search" | "recommendations" | "director";
  activeSlug: string; // for title page or director id
  activeUsername: string; // for profile page
  
  // App Data Cache
  movies: MovieTitle[];
  currentMovie: MovieTitle | null;
  currentMovieReviews: UserReview[];
  profileUser: UserProfile | null;
  profileReviews: UserReview[];
  profileFollowingProfiles: UserProfile[];
  profileFollowerProfiles: UserProfile[];
  followingReviews: UserReview[];
  popularReviews: UserReview[];
  userReviews: UserReview[];
  
  // Director state cache
  directorsList: Director[];
  currentDirectorData: {
    director: Director;
    movies: MovieTitle[];
    stats: {
      averageRating: number;
      totalReviews: number;
      highestRated: MovieTitle | null;
      lowestRated: MovieTitle | null;
      mostDiscussed: MovieTitle | null;
    };
    topWorks: MovieTitle[];
    popularReviews: UserReview[];
    similarDirectors: Director[];
  } | null;
  loadingDirector: boolean;
  favoriteDirectors: string[]; // director ids
  subscribedDirectors: string[]; // director ids
  
  // UI Loading States
  loadingMovies: boolean;
  loadingMovieDetail: boolean;
  loadingProfile: boolean;
  loadingFollowingReviews: boolean;
  loadingPopularReviews: boolean;
  generatingMovie: boolean;
  correctingMovieData: boolean;
  correctingDirectorData: boolean;
  moderationRequests: CorrectionRequest[];
  loadingModeration: boolean;
  errorMsg: string | null;
  
  // Searching and Filtering State
  searchQuery: string;
  filterType: MediaType | "all";
  filterGenre: string;
  searchResultCount: number;
  selectedFormats: string[];
  selectedGenres: string[];
  extraYear: string;
  extraCountry: string;
  extraDirector: string;

  // Active Authenticated User (Supabase Mock)
  user: AuthUser | null;
  authError: string | null;

  // Actions
  setPage: (page: "home" | "title" | "profile" | "tops" | "search" | "recommendations" | "director", slug?: string, username?: string) => void;
  setSearchFilters: (query: string, type?: MediaType | "all", genre?: string) => void;
  setSelectedFormats: (formats: string[]) => void;
  setSelectedGenres: (genres: string[]) => void;
  setExtraYear: (year: string) => void;
  setExtraCountry: (country: string) => void;
  setExtraDirector: (director: string) => void;
  resetAllFilters: () => void;
  clearError: () => void;
  
  // API Core Methods
  fetchMovies: () => Promise<void>;
  fetchMovieBySlug: (slug: string) => Promise<void>;
  generateNewMovie: (title: string, type: MediaType) => Promise<boolean>;
  correctMovieData: (slug: string, description: string) => Promise<boolean>;
  refreshMovieRatings: (slug: string) => Promise<boolean>;
  correctDirectorBio: (directorId: string, description: string) => Promise<boolean>;
  fetchModerationRequests: () => Promise<void>;
  reviewModerationRequest: (requestId: string, action: "approve" | "reject") => Promise<boolean>;
  fetchUserProfile: (username: string) => Promise<void>;
  fetchUserReviews: () => Promise<void>;
  
  // Director Specific Methods
  fetchDirectors: () => Promise<void>;
  fetchDirectorById: (slug: string) => Promise<void>;
  toggleFavoriteDirector: (id: string) => void;
  toggleSubscribeDirector: (id: string) => void;
  
  // Auth core methods
  register: (payload: any) => Promise<boolean>;
  login: (payload: any) => Promise<boolean>;
  logout: () => void;
  updateBio: (bio: string, displayName: string, favoriteMovieSlug?: string, favoriteMovieTitle?: string, profileCoverUrl?: string) => Promise<any>;
  updateShowcase: (showcase: string[]) => Promise<boolean>;
  toggleWatchlist: (movieSlug: string) => Promise<void>;
  toggleFollowUser: (targetUserId: string) => Promise<void>;
  fetchFollowingReviews: () => Promise<void>;
  fetchPopularReviews: () => Promise<void>;
  
  // Review Actions
  submitReview: (text: string, ratings: any) => Promise<boolean>;
  likeReview: (reviewId: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  
  // Achievement & Verification Gamification States
  profileAchievements: AchievementProgress[];
  newlyUnlockedAchievements: Achievement[];
  dismissAchievementUnlock: () => void;
  submitComment: (reviewId: string, text: string) => Promise<boolean>;
  theme: "classic" | "light";
  setTheme: (theme: "classic" | "light") => void;
}

// Load saved auth state on start if present in local storage
const cachedUser = (() => {
  try {
    const data = localStorage.getItem("25kadr_session");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
})();

const initialFavs = (() => {
  try {
    const d = localStorage.getItem("fav_directors");
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
})();

const initialSubs = (() => {
  try {
    const d = localStorage.getItem("sub_directors");
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
})();

export const useStore = create<AppState>((set, get) => ({
  currentPage: "home",
  activeSlug: "",
  activeUsername: "",
  
  movies: [],
  currentMovie: null,
  currentMovieReviews: [],
  profileUser: null,
  profileReviews: [],
  profileFollowingProfiles: [],
  profileFollowerProfiles: [],
  followingReviews: [],
  popularReviews: [],
  profileAchievements: [],
  userReviews: [],
  newlyUnlockedAchievements: [],
  
  directorsList: [],
  currentDirectorData: null,
  loadingDirector: false,
  favoriteDirectors: initialFavs,
  subscribedDirectors: initialSubs,
  
  loadingMovies: false,
  loadingMovieDetail: false,
  loadingProfile: false,
  loadingFollowingReviews: false,
  loadingPopularReviews: false,
  generatingMovie: false,
  correctingMovieData: false,
  correctingDirectorData: false,
  moderationRequests: [],
  loadingModeration: false,
  errorMsg: null,
  
  searchQuery: "",
  filterType: "all",
  filterGenre: "",
  searchResultCount: 0,
  selectedFormats: [],
  selectedGenres: [],
  extraYear: "",
  extraCountry: "",
  extraDirector: "",

  user: cachedUser,
  authError: null,

  setPage: (page, slug = "", username = "") => {
    set({ currentPage: page, activeSlug: slug, activeUsername: username, errorMsg: null });
    
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const currentMovieParam = url.searchParams.get("movie");
        const currentUserParam = url.searchParams.get("user");
        
        let changed = false;
        if (page === "title" && slug) {
          if (currentMovieParam !== slug) {
            url.searchParams.set("movie", slug);
            url.searchParams.delete("user");
            changed = true;
          }
        } else if (page === "profile" && username) {
          if (currentUserParam !== username) {
            url.searchParams.set("user", username);
            url.searchParams.delete("movie");
            changed = true;
          }
        } else if (page === "director" && slug) {
          if (url.searchParams.get("director") !== slug) {
            url.searchParams.set("director", slug);
            url.searchParams.delete("movie");
            url.searchParams.delete("user");
            changed = true;
          }
        } else if (page === "home" || page === "tops" || page === "search" || page === "recommendations") {
          if (currentMovieParam || currentUserParam || url.searchParams.get("director")) {
            url.searchParams.delete("movie");
            url.searchParams.delete("user");
            url.searchParams.delete("director");
            changed = true;
          }
        }

        if (changed) {
          window.history.pushState({ page, slug, username }, "", url.toString());
        }
      }
    } catch (e) {
      console.warn("Could not sync address bar state: ", e);
    }

    if (page === "title" && slug) {
      get().fetchMovieBySlug(slug);
    } else if (page === "profile" && username) {
      get().fetchUserProfile(username);
    } else if (page === "director" && slug) {
      get().fetchDirectorById(slug);
    } else if (page === "home") {
      get().fetchMovies();
      get().fetchDirectors();
    }
  },

  setSearchFilters: (query, type = "all", genre = "") => {
    set({ searchQuery: query, filterType: type, filterGenre: genre });
    get().fetchMovies();
  },

  setSelectedFormats: (formats) => {
    set({ selectedFormats: formats });
    get().fetchMovies();
  },

  setSelectedGenres: (genres) => {
    set({ selectedGenres: genres });
    get().fetchMovies();
  },

  setExtraYear: (year) => {
    set({ extraYear: year });
    get().fetchMovies();
  },

  setExtraCountry: (country) => {
    set({ extraCountry: country });
    get().fetchMovies();
  },

  setExtraDirector: (director) => {
    set({ extraDirector: director });
    get().fetchMovies();
  },

  resetAllFilters: () => {
    set({
      selectedFormats: [],
      selectedGenres: [],
      extraYear: "",
      extraCountry: "",
      extraDirector: "",
      filterType: "all",
      filterGenre: ""
    });
    get().fetchMovies();
  },

  clearError: () => set({ errorMsg: null, authError: null }),

  fetchMovies: async () => {
    set({ loadingMovies: true, errorMsg: null });
    try {
      const {
        searchQuery,
        filterType,
        filterGenre,
        selectedFormats,
        selectedGenres,
        extraYear,
        extraCountry,
        extraDirector
      } = get();
      
      let url = `/api/movies?`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (filterType && filterType !== "all") url += `type=${filterType}&`;
      if (filterGenre) url += `genre=${encodeURIComponent(filterGenre)}&`;
      if (selectedFormats && selectedFormats.length > 0) {
        url += `formats=${encodeURIComponent(JSON.stringify(selectedFormats))}&`;
      }
      if (selectedGenres && selectedGenres.length > 0) {
        url += `genres=${encodeURIComponent(JSON.stringify(selectedGenres))}&`;
      }
      if (extraYear && extraYear.trim()) {
        url += `year=${encodeURIComponent(extraYear.trim())}&`;
      }
      if (extraCountry && extraCountry.trim()) {
        url += `country=${encodeURIComponent(extraCountry.trim())}&`;
      }
      if (extraDirector && extraDirector.trim()) {
        url += `director=${encodeURIComponent(extraDirector.trim())}&`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        set({ movies: data, searchResultCount: data.length });
      } else {
        set({ errorMsg: data.error || "Не удалось загрузить произведения" });
      }
    } catch (err) {
      set({ errorMsg: "Ошибка подключения к серверу" });
    } finally {
      set({ loadingMovies: false });
    }
  },

  fetchMovieBySlug: async (slug) => {
    set({ loadingMovieDetail: true, errorMsg: null, currentMovie: null, currentMovieReviews: [] });
    try {
      const res = await fetch(`/api/movies/${slug}`);
      const data = await res.json();
      if (res.ok) {
        set({ currentMovie: data.movie, currentMovieReviews: data.reviews });
      } else {
        set({ errorMsg: data.error || "Произведение не найдено" });
      }
    } catch (err) {
      set({ errorMsg: "Ошибка загрузки деталей произведения" });
    } finally {
      set({ loadingMovieDetail: false });
    }
  },

  fetchDirectors: async () => {
    try {
      const res = await fetch("/api/directors");
      const data = await res.json();
      if (res.ok) {
        set({ directorsList: data });
      }
    } catch (err) {
      console.error("Failed to fetch directors list:", err);
    }
  },

  fetchDirectorById: async (slug) => {
    set({ loadingDirector: true, errorMsg: null, currentDirectorData: null });
    try {
      const res = await fetch(`/api/directors/${slug}`);
      const data = await res.json();
      if (res.ok) {
        set({ currentDirectorData: data });
      } else {
        set({ errorMsg: data.error || "Режиссёр не найден" });
      }
    } catch (err) {
      set({ errorMsg: "Ошибка при получении данных режиссёра" });
    } finally {
      set({ loadingDirector: false });
    }
  },

  toggleFavoriteDirector: (id) => {
    const { favoriteDirectors } = get();
    let updated;
    if (favoriteDirectors.includes(id)) {
      updated = favoriteDirectors.filter(item => item !== id);
    } else {
      updated = [...favoriteDirectors, id];
    }
    set({ favoriteDirectors: updated });
    localStorage.setItem("fav_directors", JSON.stringify(updated));
  },

  toggleSubscribeDirector: (id) => {
    const { subscribedDirectors } = get();
    let updated;
    if (subscribedDirectors.includes(id)) {
      updated = subscribedDirectors.filter(item => item !== id);
    } else {
      updated = [...subscribedDirectors, id];
    }
    set({ subscribedDirectors: updated });
    localStorage.setItem("sub_directors", JSON.stringify(updated));
  },

  generateNewMovie: async (title, type) => {
    set({ generatingMovie: true, errorMsg: null });
    try {
      const res = await fetch(`/api/gemini/generate-movie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: title, type })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refetch main list to include new movie
        await get().fetchMovies();
        // Redirect to detail page
        get().setPage("title", data.movie.slug);
        return true;
      } else {
        set({ errorMsg: data.error || "Не удалось сгенерировать карточку" });
        return false;
      }
    } catch (err) {
      set({ errorMsg: "Ошибка связи с ИИ-модулем генерации" });
      return false;
    } finally {
      set({ generatingMovie: false });
    }
  },

  correctMovieData: async (slug, description) => {
    set({ correctingMovieData: true, errorMsg: null });
    try {
      const user = get().user;
      const userEmail = user ? `${user.username}@example.com` : "anonymous@example.com";
      const username = user ? user.displayName : "Анонимный критик";

      const res = await fetch(`/api/gemini/correct-movie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, description, userEmail, username })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refetch detailed movie to render with corrected details in place
        await get().fetchMovieBySlug(slug);
        // Also refetch general movie list to update anywhere in search/home
        await get().fetchMovies();
        return true;
      } else {
        set({ errorMsg: data.error || "Не удалось скорректировать карточку" });
        return false;
      }
    } catch (err) {
      set({ errorMsg: "Ошибка связи с ИИ-модулем корректировки" });
      return false;
    } finally {
      set({ correctingMovieData: false });
    }
  },

  refreshMovieRatings: async (slug) => {
    try {
      const res = await fetch(`/api/movies/${slug}/refresh-ratings`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.movie) {
          const currentMovie = get().currentMovie;
          if (currentMovie && currentMovie.slug === slug) {
            set({ currentMovie: data.movie });
          }
          const movies = get().movies.map(m => m.slug === slug ? data.movie : m);
          set({ movies: movies });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to refresh movie ratings:", err);
      return false;
    }
  },

  correctDirectorBio: async (directorId, description) => {
    set({ correctingDirectorData: true, errorMsg: null });
    try {
      const user = get().user;
      const userEmail = user ? `${user.username}@example.com` : "anonymous@example.com";
      const username = user ? user.displayName : "Анонимный критик";

      const res = await fetch(`/api/gemini/correct-director`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directorId, description, userEmail, username })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refetch moderation requests so they immediately appear in dashboard
        await get().fetchModerationRequests();
        // Refetch detailed director if currently active
        const activeSlug = get().activeSlug;
        if (activeSlug === directorId) {
          await get().fetchDirectorById(directorId);
        }
        return true;
      } else {
        set({ errorMsg: data.error || "Не удалось отправить предложение на модерацию" });
        return false;
      }
    } catch (err) {
      set({ errorMsg: "Ошибка связи с ИИ-модулем корректировки" });
      return false;
    } finally {
      set({ correctingDirectorData: false });
    }
  },

  fetchModerationRequests: async () => {
    set({ loadingModeration: true, errorMsg: null });
    try {
      const res = await fetch(`/api/moderation/requests`);
      const data = await res.json();
      if (res.ok && data.success) {
        set({ moderationRequests: data.requests });
      } else {
        set({ errorMsg: data.error || "Не удалось загрузить обращения" });
      }
    } catch (err) {
      set({ errorMsg: "Ошибка связи с сервером при получении обращений" });
    } finally {
      set({ loadingModeration: false });
    }
  },

  reviewModerationRequest: async (requestId, action) => {
    set({ loadingModeration: true, errorMsg: null });
    try {
      const res = await fetch(`/api/moderation/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh requests list
        await get().fetchModerationRequests();
        // Also refresh movies list in case we approved a change
        await get().fetchMovies();
        // Also refresh directors if appropriate
        const activeSlug = get().activeSlug;
        const currentPage = get().currentPage;
        if (currentPage === "director" && activeSlug) {
          await get().fetchDirectorById(activeSlug);
        }
        return true;
      } else {
        set({ errorMsg: data.error || "Не удалось обработать запрос модерации" });
        return false;
      }
    } catch (err) {
      set({ errorMsg: "Ошибка связи с сервером при модерации" });
      return false;
    } finally {
      set({ loadingModeration: false });
    }
  },

  fetchUserProfile: async (username) => {
    set({ 
      loadingProfile: true, 
      errorMsg: null, 
      profileUser: null, 
      profileReviews: [],
      profileFollowingProfiles: [],
      profileFollowerProfiles: []
    });
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      if (res.ok) {
        set({ 
          profileUser: data.profile, 
          profileReviews: data.reviews,
          profileFollowingProfiles: data.followingProfiles || [],
          profileFollowerProfiles: data.followerProfiles || [],
          profileAchievements: data.achievementsProgress || []
        });
      } else {
        set({ errorMsg: data.error || "Профиль не найден" });
      }
    } catch (err) {
      set({ errorMsg: "Ошибка загрузки профиля" });
    } finally {
      set({ loadingProfile: false });
    }
  },

  fetchUserReviews: async () => {
    const { user } = get();
    if (!user) {
      set({ userReviews: [] });
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.username}`);
      const data = await res.json();
      if (res.ok && data.reviews) {
        set({ userReviews: data.reviews });
      }
    } catch (err) {
      console.error("Failed to fetch user reviews:", err);
    }
  },

  register: async (payload) => {
    set({ authError: null });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ user: data.user });
        localStorage.setItem("25kadr_session", JSON.stringify(data.user));
        get().fetchUserReviews();
        return true;
      } else {
        set({ authError: data.error || "Ошибка регистрации" });
        return false;
      }
    } catch (err) {
      set({ authError: "Ошибка подключения к серверу регистрации" });
      return false;
    }
  },

  login: async (payload) => {
    set({ authError: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ user: data.user });
        localStorage.setItem("25kadr_session", JSON.stringify(data.user));
        get().fetchUserReviews();
        return true;
      } else {
        set({ authError: data.error || "Ошибка входа" });
        return false;
      }
    } catch (err) {
      set({ authError: "Ошибка подключения к серверу авторизации" });
      return false;
    }
  },

  logout: () => {
    set({ user: null, userReviews: [] });
    localStorage.removeItem("25kadr_session");
  },

  updateBio: async (bio, displayName, favoriteMovieSlug, favoriteMovieTitle, profileCoverUrl) => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/bio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, displayName, favoriteMovieSlug, favoriteMovieTitle, profileCoverUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { 
          ...user, 
          bio, 
          displayName,
          favoriteMovieSlug: favoriteMovieSlug !== undefined ? favoriteMovieSlug : user.favoriteMovieSlug,
          favoriteMovieTitle: favoriteMovieTitle !== undefined ? favoriteMovieTitle : user.favoriteMovieTitle,
          profileCoverUrl: profileCoverUrl !== undefined ? profileCoverUrl : user.profileCoverUrl
        };
        set({ user: updatedUser });
        localStorage.setItem("25kadr_session", JSON.stringify(updatedUser));
        // If viewing own page, update profile too
        if (get().profileUser?.id === user.id) {
          get().fetchUserProfile(user.username);
        }
        return { success: true };
      }
    } catch (err) {
      console.error(err);
    }
    return { success: false };
  },

  updateShowcase: async (showcase) => {
    const { user } = get();
    if (!user) return false;
    try {
      const res = await fetch(`/api/users/${user.id}/showcase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showcase })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { ...user, showcase: data.profile.showcase };
        set({ user: updatedUser });
        localStorage.setItem("25kadr_session", JSON.stringify(updatedUser));
        if (get().profileUser?.id === user.id) {
          set({ profileUser: data.profile });
        }
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  },

  toggleWatchlist: async (movieSlug) => {
    const { user } = get();
    if (!user) {
      set({ errorMsg: "Пожалуйста, войдите в аккаунт, чтобы добавить в список ожидания" });
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieSlug })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { ...user, watchlist: data.watchlist };
        set({ user: updatedUser });
        localStorage.setItem("25kadr_session", JSON.stringify(updatedUser));
        
        // If detail page displays the icon, reload current movie to reflect counter optionally
        if (get().currentMovie && get().currentMovie?.slug === movieSlug) {
          // Just update local watch states
        }
        // If on user profile watchlist tab, let's load again
        if (get().profileUser?.id === user.id) {
          get().fetchUserProfile(user.username);
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  submitReview: async (text, ratings) => {
    const { user, currentMovie } = get();
    if (!user || !currentMovie) {
      set({ errorMsg: "Необходимо войти в систему и открыть произведение" });
      return false;
    }

    try {
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleSlug: currentMovie.slug,
          userId: user.id,
          ratings,
          text
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.newAchievements && data.newAchievements.length > 0) {
          set({ newlyUnlockedAchievements: data.newAchievements });
        }
        // Refetch movie details & reviews to recalculate aggregations
        get().fetchMovieBySlug(currentMovie.slug);
        get().fetchUserReviews();
        return true;
      } else {
        set({ errorMsg: data.error || "Не удалось отправить рецензию" });
        return false;
      }
    } catch (err) {
      set({ errorMsg: "Ошибка отправки рецензии на сервер" });
      return false;
    }
  },

  likeReview: async (reviewId) => {
    const { user } = get();
    if (!user) {
      alert("Войдите в систему, чтобы оценить рецензию");
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.newAchievements && data.newAchievements.length > 0) {
          set({ newlyUnlockedAchievements: data.newAchievements });
        }
        // Update likes array in current movie reviews
        const movieReviews = get().currentMovieReviews.map(r => {
          if (r.id === reviewId) {
            const likes = [...r.likes];
            const uIdx = likes.indexOf(user.id);
            if (uIdx === -1) {
              likes.push(user.id);
            } else {
              likes.splice(uIdx, 1);
            }
            return { ...r, likes };
          }
          return r;
        });

        // Also in profile reviews cache if present
        const profileReviews = get().profileReviews.map(r => {
          if (r.id === reviewId) {
            const likes = [...r.likes];
            const uIdx = likes.indexOf(user.id);
            if (uIdx === -1) {
              likes.push(user.id);
            } else {
              likes.splice(uIdx, 1);
            }
            return { ...r, likes };
          }
          return r;
        });

        set({ currentMovieReviews: movieReviews, profileReviews });
      }
    } catch (err) {
      console.error(err);
    }
  },

  deleteReview: async (reviewId) => {
    const { user, currentMovie } = get();
    if (!user) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        if (currentMovie) {
          get().fetchMovieBySlug(currentMovie.slug);
        } else if (get().profileUser) {
          get().fetchUserProfile(get().profileUser!.username);
        }
        get().fetchUserReviews();
      }
    } catch (err) {
      console.error(err);
    }
  },

  toggleFollowUser: async (targetUserId) => {
    const { user, profileUser } = get();
    if (!user) {
      set({ errorMsg: "Пожалуйста, войдите в аккаунт, чтобы подписываться на пользователей." });
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update user follow arrays in state and localStorage
        const updatedUser = { ...user, following: data.following };
        set({ user: updatedUser });
        localStorage.setItem("25kadr_session", JSON.stringify(updatedUser));
        
        // If we are currently looking at a profile page, refetch that profile's details
        // to update follower counts and follower lists
        if (profileUser) {
          get().fetchUserProfile(profileUser.username);
        }
      } else {
        set({ errorMsg: data.error || "Не удалось совершить подписку" });
      }
    } catch (err) {
      console.error(err);
      set({ errorMsg: "Ошибка связи с сервером при подписке" });
    }
  },

  fetchFollowingReviews: async () => {
    const { user } = get();
    if (!user) return;
    
    set({ loadingFollowingReviews: true });
    try {
      const res = await fetch(`/api/reviews/following?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        set({ followingReviews: data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loadingFollowingReviews: false });
    }
  },

  fetchPopularReviews: async () => {
    set({ loadingPopularReviews: true });
    try {
      const res = await fetch("/api/reviews?popular=true");
      const data = await res.json();
      if (res.ok) {
        set({ popularReviews: data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loadingPopularReviews: false });
    }
  },

  dismissAchievementUnlock: () => {
    set({ newlyUnlockedAchievements: [] });
  },

  submitComment: async (reviewId: string, text: string) => {
    const { user } = get();
    if (!user) {
      set({ errorMsg: "Пожалуйста, войдите в систему, чтобы комментировать" });
      return false;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, text })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.newAchievements && data.newAchievements.length > 0) {
          set({ newlyUnlockedAchievements: data.newAchievements });
        }
        // Update currentMovieReviews and profileReviews
        const movieReviews = get().currentMovieReviews.map(r => {
          if (r.id === reviewId) {
            return { ...r, comments: data.comments };
          }
          return r;
        });

        const profileReviews = get().profileReviews.map(r => {
          if (r.id === reviewId) {
            return { ...r, comments: data.comments };
          }
          return r;
        });

        set({ currentMovieReviews: movieReviews, profileReviews });
        return true;
      } else {
        set({ errorMsg: data.error || "Не удалось отправить комментарий" });
        return false;
      }
    } catch (e) {
      set({ errorMsg: "Ошибка связи с сервером комментариев" });
      return false;
    }
  },

  theme: ((typeof window !== "undefined" ? localStorage.getItem("25kadr_theme") as any : "classic") === "light" ? "light" : "classic"),
  setTheme: (theme: "classic" | "light") => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("25kadr_theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }
}));
