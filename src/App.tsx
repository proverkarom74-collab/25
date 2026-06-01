import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { formatMovieDuration, formatMovieReleaseDate, AchievementProgress } from "./types";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { FilmCard } from "./components/FilmCard";
import { MovieSlider } from "./components/MovieSlider";
import { ReviewCard } from "./components/ReviewCard";
import { ReviewForm } from "./components/ReviewForm";
import { AchievementsTab } from "./components/AchievementsTab";
import { Recommendations } from "./components/Recommendations";
import { ProfileStatistics } from "./components/ProfileStatistics";
import { TasteAnalysis } from "./components/TasteAnalysis";
import ExternalRatings from "./components/ExternalRatings";
import { RatingBadge } from "./components/RatingBadge";
import { getRatingColor } from "./lib/ratingUtils";
import { ModerationView } from "./components/ModerationView";
import { ACHIEVEMENTS } from "./lib/achievementsData";
import { DirectorPage } from "./components/DirectorPage";
import { 
  Star, Film, Tv, Award, Compass, Play, ArrowLeft, Eye, Edit2, 
  Check, User, Calendar, Clock, AlertCircle, Info, Sparkles, Heart, Trash2, Share2, Trophy,
  Filter, ChevronDown, ChevronUp, X, Globe, SlidersHorizontal, ShieldAlert, CheckCircle, XCircle, ArrowRight
} from "lucide-react";

export default function App() {
  const {
    currentPage,
    activeSlug,
    activeUsername,
    movies,
    currentMovie,
    currentMovieReviews,
    profileUser,
    profileReviews,
    profileFollowingProfiles,
    profileFollowerProfiles,
    followingReviews,
    popularReviews,
    loadingMovies,
    loadingMovieDetail,
    loadingProfile,
    loadingFollowingReviews,
    loadingPopularReviews,
    generatingMovie,
    errorMsg,
    searchQuery,
    filterType,
    filterGenre,
    searchResultCount,
    setPage,
    setSearchFilters,
    fetchMovies,
    toggleWatchlist,
    user,
    updateBio,
    toggleFollowUser,
    fetchFollowingReviews,
    fetchPopularReviews,
    profileAchievements,
    newlyUnlockedAchievements,
    dismissAchievementUnlock,
    updateShowcase,
    theme,
    setTheme,
    selectedFormats,
    selectedGenres,
    extraYear,
    extraCountry,
    extraDirector,
    setSelectedFormats,
    setSelectedGenres,
    setExtraYear,
    setExtraCountry,
    setExtraDirector,
    resetAllFilters,
    fetchUserReviews,
    userReviews,
    correctingMovieData,
    correctMovieData,
    moderationRequests,
    loadingModeration,
    fetchModerationRequests,
    reviewModerationRequest
  } = useStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchModerationRequests();
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<string>("reviews");
  const [searchTab, setSearchTab] = useState<"movies" | "reviewers">("movies");
  const [reviewSort, setReviewSort] = useState<"newest" | "oldest" | "highest_rating">("newest");
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);

  // Search Filters and Advanced options
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Sync format and genre filters with Header actions
  useEffect(() => {
    if (filterType && filterType !== "all") {
      let formatLabel = "";
      if (filterType === "movie") formatLabel = "Фильмы";
      else if (filterType === "tv") formatLabel = "Сериалы";
      else if (filterType === "anime") formatLabel = "Аниме";
      else if (filterType === "short") formatLabel = "Короткометражки";
      
      if (formatLabel && !selectedFormats.includes(formatLabel)) {
        setSelectedFormats([formatLabel]);
      }
    } else if (filterType === "all") {
      // Avoid clearing if user customized it on the search page, but clear if it was a quick reset
      if (selectedFormats.length === 1 && ["Фильмы", "Сериалы", "Аниме", "Короткометражки"].includes(selectedFormats[0])) {
        setSelectedFormats([]);
      }
    }
  }, [filterType, selectedFormats, setSelectedFormats]);

  useEffect(() => {
    if (filterGenre) {
      if (!selectedGenres.includes(filterGenre)) {
        setSelectedGenres([filterGenre]);
      }
    } else {
      if (selectedGenres.length === 1) {
        setSelectedGenres([]);
      }
    }
  }, [filterGenre, selectedGenres, setSelectedGenres]);

  useEffect(() => {
    if (currentPage !== "search") return;
    
    let active = true;
    const loadReviewers = async () => {
      setLoadingReviewers(true);
      try {
        const res = await fetch(`/api/users-search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (active) {
          setReviewers(data);
        }
      } catch (err) {
        console.error("Failed to query reviewers", err);
      } finally {
        if (active) {
          setLoadingReviewers(false);
        }
      }
    };

    loadReviewers();
    return () => {
      active = false;
    };
  }, [searchQuery, currentPage]);
  const [homeFeedTab, setHomeFeedTab] = useState<"popular" | "following">("popular");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileBio, setProfileBio] = useState("");
  const [profileName, setProfileName] = useState("");
  const [tempFavSlug, setTempFavSlug] = useState("");
  const [tempFavTitle, setTempFavTitle] = useState("");
  const [tempFavCover, setTempFavCover] = useState("");
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [tempShowcase, setTempShowcase] = useState<string[]>([]);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionDesc, setCorrectionDesc] = useState("");
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState("");

  // Motivation toasts state
  interface MotivationToast {
    id: string;
    title: string;
    message: string;
    percent: number;
  }
  const [toasts, setToasts] = useState<MotivationToast[]>([]);

  const addToast = (title: string, message: string, percent: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, percent }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000); // 6 seconds display duration
  };

  // Keep track of previous achievements progress to detect 50% and 80% crossings
  const prevAchievementsRef = useRef<AchievementProgress[]>([]);

  useEffect(() => {
    if (!profileAchievements || profileAchievements.length === 0) {
      return;
    }

    // Only alert if we are viewing our own profile (or the logged-in user is active)
    const isMe = user && profileUser && profileUser.id === user.id;
    if (!isMe) {
      // Just sync and return
      prevAchievementsRef.current = profileAchievements;
      return;
    }

    const prevList = prevAchievementsRef.current;
    if (prevList && prevList.length > 0) {
      profileAchievements.forEach(newProgress => {
        const prevProgress = prevList.find(p => p.achievementId === newProgress.achievementId);
        if (prevProgress) {
          const ach = ACHIEVEMENTS.find(a => a.id === newProgress.achievementId);
          if (!ach) return;

          // An achievement is complex if its target is >= 5, or rare/epic/legendary
          const isComplex = newProgress.target >= 5 || ach.rarity !== "common";
          if (isComplex && !newProgress.unlocked) {
            const prevPercent = prevProgress.percent;
            const newPercent = newProgress.percent;

            // Check if progress crossed 50% milestone
            if (prevPercent < 50 && newPercent >= 50 && newPercent < 100) {
              addToast(
                `Прогресс: ${ach.title}`, 
                `Достижение заполнено наполовину! Настоящий кинокритик не останавливается на полпути.`,
                newPercent
              );
            }
            // Check if progress crossed 80% milestone
            else if (prevPercent < 80 && newPercent >= 80 && newPercent < 100) {
              addToast(
                `Рядом с целью: ${ach.title}`, 
                `Осталось совсем чуть-чуть! Всего несколько шагов отделяют вас от этого почетного звания.`,
                newPercent
              );
            }
          }
        }
      });
    }

    // Update the ref for the next change
    prevAchievementsRef.current = profileAchievements;
  }, [profileAchievements, user, profileUser]);

  // Search local generation helper state
  const [aiGenerateQuery, setAiGenerateQuery] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Listen for browser navigation / initial page load deep linking
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const movieSlug = params.get("movie");
      const username = params.get("user");
      const directorId = params.get("director");
      
      const currentStoreState = useStore.getState();
      if (movieSlug) {
        if (currentStoreState.currentPage !== "title" || currentStoreState.activeSlug !== movieSlug) {
          setPage("title", movieSlug);
        }
      } else if (username) {
        if (currentStoreState.currentPage !== "profile" || currentStoreState.activeUsername !== username) {
          setPage("profile", "", username);
        }
      } else if (directorId) {
        if (currentStoreState.currentPage !== "director" || currentStoreState.activeSlug !== directorId) {
          setPage("director", directorId);
        }
      } else {
        if (currentStoreState.currentPage !== "home" && currentStoreState.currentPage !== "tops" && currentStoreState.currentPage !== "search") {
          setPage("home");
        }
      }
    };

    // Run once on load
    handlePopState();

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setPage]);

  useEffect(() => {
    fetchMovies();
    fetchPopularReviews();
    if (user) {
      fetchFollowingReviews();
      fetchUserReviews();
    }
  }, [fetchMovies, fetchPopularReviews, fetchFollowingReviews, fetchUserReviews, user]);

  // Synchronize bio values
  useEffect(() => {
    if (profileUser && user && profileUser.id === user.id) {
      setProfileBio(user.bio || "");
      setProfileName(user.displayName || "");
      setTempFavSlug(user.favoriteMovieSlug || "");
      setTempFavTitle(user.favoriteMovieTitle || "");
      setTempFavCover(user.profileCoverUrl || "");
    } else if (profileUser) {
      setProfileBio(profileUser.bio || "");
      setProfileName(profileUser.displayName || "");
      setTempFavSlug(profileUser.favoriteMovieSlug || "");
      setTempFavTitle(profileUser.favoriteMovieTitle || "");
      setTempFavCover(profileUser.profileCoverUrl || "");
    }
  }, [profileUser, user]);

  const saveProfileChanges = async () => {
    const res = await updateBio(profileBio, profileName, tempFavSlug, tempFavTitle, tempFavCover);
    if (res && res.success) {
      setEditingProfile(false);
    }
  };

  const calculateGenreCounts = (userReviews: any[]) => {
    const genres: Record<string, number> = {};
    userReviews.forEach(r => {
      // Find matching movie genre list
      const movie = movies.find(m => m.slug === r.titleSlug);
      if (movie) {
        movie.genres.forEach(g => {
          genres[g] = (genres[g] || 0) + 1;
        });
      }
    });

    let maxGenre = "Киногурмания";
    let maxCount = 0;
    Object.entries(genres).forEach(([g, val]) => {
      if (val > maxCount) {
        maxCount = val;
        maxGenre = g;
      }
    });
    return { favorite: maxGenre, count: maxCount };
  };

  const getCategoryProgressColor = (score: number) => {
    if (score >= 8.5) return "bg-emerald-500";
    if (score >= 7.0) return "bg-amber-500";
    return "bg-garnet";
  };

  // --- RENDERING VIEWS ---

  const renderHome = () => {
    const listNew = [...movies].sort((a, b) => b.year - a.year);
    const listTopWeek = [...movies].sort((a, b) => b.ratingAverage - a.ratingAverage);
    const listTopMonth = [...movies].sort((a, b) => b.ratingsCount - a.ratingsCount);

    return (
      <div className="space-y-12 animate-fade-in relative pb-16">
        {/* Animated Hero Carousel Slider */}
        <MovieSlider movies={movies} />

        {/* Interactive Mood Quick-Picker Widget on Homepage */}
        <div className="bg-gradient-to-r from-graphite to-[#201515] border border-graphite-light rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1 text-center md:text-left z-10">
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Что посмотреть сегодня?</span>
            </h3>
            <p className="text-xs text-gray-400 font-sans max-w-md">
              Выберите ваше настроение, и наш ИИ-куратор моментально подберет идеальное кино!
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center z-10">
            {[
              { label: "Веселье", mood: "Хочется лёгкого и весёлого", emoji: "🍿" },
              { label: "Меланхолия", mood: "Грустно / меланхолично", emoji: "🌧️" },
              { label: "Драйв", mood: "Нужен мощный экшен", emoji: "💥" },
              { label: "Головоломка", mood: "Мозголомка / сложный сюжет", emoji: "🧩" },
              { label: "Эстетика", mood: "Атмосферное и красивое кино", emoji: "✨" },
            ].map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  localStorage.setItem("quick_mood_select", m.mood);
                  setPage("recommendations");
                }}
                className="bg-graphite-dark hover:bg-rose-500 hover:text-white border border-graphite-light/50 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer text-gray-300 transform hover:scale-103"
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
            
            <button
              onClick={() => setPage("recommendations")}
              className="bg-transparent hover:bg-white/5 text-rose-500 underline text-xs font-mono font-bold uppercase py-2 px-3 shrink-0 cursor-pointer"
            >
              Все настройки →
            </button>
          </div>
          
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* New Releases Slider */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-graphite-light pb-3">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-garnet" />
              <h2 className="text-lg font-extrabold uppercase tracking-widest text-white">
                Новые в базе
              </h2>
            </div>
            <button 
              onClick={() => {
                setSearchFilters("", "all", ""); 
                setPage("tops");
              }}
              className="text-xs text-gray-400 hover:text-garnet font-medium transition cursor-pointer"
            >
              Смотреть все
            </button>
          </div>

          {loadingMovies ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="bg-graphite rounded-xl aspect-[2/3] animate-pulse border border-graphite-light" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {listNew.slice(0, 6).map((movie) => (
                <FilmCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Dual Section: Top Weekly vs Top Popular */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main left block: Top Rated Film Cards */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-graphite-light pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-extrabold uppercase tracking-widest text-white">
                  Наивысший рейтинг (Топ-4)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {listTopWeek.slice(0, 4).map((movie) => (
                <div 
                  key={movie.id} 
                  onClick={() => setPage("title", movie.slug)}
                  className="bg-graphite border border-graphite-light hover:border-garnet/40 rounded-xl p-4 flex gap-4 transition duration-300 cursor-pointer group"
                >
                  <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className="w-20 h-28 object-cover rounded shadow-lg group-hover:scale-102 transition" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h4 className="font-bold text-white group-hover:text-garnet transition truncate">
                        {movie.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {movie.originalTitle || movie.title} • {movie.year}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genres.slice(0, 2).map((g, idx) => (
                          <span key={idx} className="text-[9px] text-gray-400 bg-graphite-dark px-1.5 py-0.5 rounded font-mono border border-graphite-light">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <RatingBadge rating={movie.ratingAverage} size="small" forceScale10={true} />
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                        {movie.ratingsCount} голосов
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right sidebar block: Cinema analytics columns */}
          <section className="space-y-6">
            <div className="border-b border-graphite-light pb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-garnet" />
              <h2 className="text-lg font-extrabold uppercase tracking-widest text-white">
                Популярное
              </h2>
            </div>

            <div className="bg-graphite border border-graphite-light rounded-xl p-4 space-y-4">
              {listTopMonth.slice(0, 5).map((movie, idx) => (
                <div 
                  key={movie.id} 
                  onClick={() => setPage("title", movie.slug)}
                  className="flex items-center gap-3 group cursor-pointer border-b border-graphite-light/50 last:border-0 pb-3 last:pb-0"
                >
                  <span className="text-lg font-black font-mono text-gray-600 group-hover:text-garnet w-5 text-center">
                    {idx + 1}
                  </span>
                  <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className="w-10 h-14 object-cover rounded shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-white truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5 font-mono">
                      <span>{movie.year}</span>
                      <span>•</span>
                      <RatingBadge rating={movie.ratingAverage} size="small" forceScale10={true} className="py-0 px-1 text-[10px]" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Reviews Feed Section */}
        <section className="space-y-6 pt-4">
          <div className="flex border-b border-graphite-light pb-2 gap-4">
            <button
              onClick={() => setHomeFeedTab("popular")}
              className={`pb-2.5 text-sm font-mono uppercase tracking-wider font-extrabold px-3 border-b-2 cursor-pointer transition ${
                homeFeedTab === "popular"
                  ? "border-garnet text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Популярные рецензии
            </button>
            
            <button
              onClick={() => setHomeFeedTab("following")}
              className={`pb-2.5 text-sm font-mono uppercase tracking-wider font-extrabold px-3 border-b-2 cursor-pointer transition ${
                homeFeedTab === "following"
                  ? "border-garnet text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Лента активности друзей {user && `(${followingReviews.length})`}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {homeFeedTab === "popular" ? (
              loadingPopularReviews ? (
                <div className="py-12 text-center text-xs text-gray-500 font-mono">
                  Загрузка популярных рецензий...
                </div>
              ) : popularReviews.length === 0 ? (
                <div className="bg-graphite border border-graphite-light p-10 rounded-xl text-center text-xs text-gray-400 font-mono">
                  Пока нет рецензий на платформе.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularReviews.slice(0, 8).map((review) => (
                    <ReviewCard key={review.id} review={review} showMovieLink={true} />
                  ))}
                </div>
              )
            ) : (
              // Friends / Following Feed
              !user ? (
                <div className="bg-graphite border border-graphite-light p-10 rounded-xl text-center text-xs text-gray-400 leading-relaxed font-sans max-w-lg mx-auto space-y-3">
                  <p>Войдите или зарегистрируйтесь, чтобы просматривать персональную ленту активности ваших друзей.</p>
                </div>
              ) : loadingFollowingReviews ? (
                <div className="py-12 text-center text-xs text-gray-500 font-mono">
                  Синхронизация ленты друзей...
                </div>
              ) : followingReviews.length === 0 ? (
                <div className="bg-graphite border border-graphite-light p-8 rounded-xl text-center text-xs text-gray-400 leading-relaxed font-sans max-w-xl mx-auto space-y-4">
                  <p className="font-semibold text-white">Вы еще ни на кого не подписаны или ваши авторы еще не оставили рецензий!</p>
                  <p className="text-gray-400 text-xs text-center">Рекомендуем подписаться на интересных кинокритиков сообщества:</p>
                  
                  {/* Quick recommendation list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                    {[
                      { id: "critic1", name: "Александр Елисеев", username: "kinoman_99", bio: "Нолан, Быков, Тарковский." },
                      { id: "critic2", name: "Мария Смирнова", username: "balabanov_fan", bio: "Балабанов, эстетика реализма." },
                      { id: "critic3", name: "Константин Ким", username: "otaku_review", bio: "Отаку со стажем, разбор аниме." }
                    ].filter(c => c.id !== user.id).map(c => {
                      const followingList = user.following || [];
                      const isSubbed = followingList.includes(c.id);
                      return (
                        <div key={c.id} className="bg-graphite-dark border border-graphite-light p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p 
                              onClick={() => setPage("profile", "", c.username)}
                              className="font-bold text-white hover:text-garnet transition cursor-pointer"
                            >
                              {c.name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">@{c.username}</p>
                            <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">{c.bio}</p>
                          </div>
                          <button
                            onClick={() => toggleFollowUser(c.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition font-mono border cursor-pointer ${
                              isSubbed 
                                ? "bg-garnet border-garnet text-white"
                                : "bg-graphite hover:bg-garnet/15 border-graphite-light text-gray-300"
                            }`}
                          >
                            {isSubbed ? "✓ Подписка" : "Читать"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followingReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} showMovieLink={true} />
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderTitle = () => {
    if (loadingMovieDetail) {
      return (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-garnet border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 font-mono">Загрузка карточки кинопроизведения...</p>
        </div>
      );
    }

    if (!currentMovie) {
      return (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-garnet mx-auto" />
          <h3 className="text-lg font-bold text-white">Произведение не найдено</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Похоже, этой карточки пока нет на платформе. Воспользуйтесь ИИ-поиском в верхнем меню, чтобы мгновенно сгенерировать её!
          </p>
          <button 
            onClick={() => setPage("home")} 
            className="bg-graphite border border-graphite-light hover:border-gray-500 text-xs px-4 py-2 rounded-lg text-white"
          >
            На главную
          </button>
        </div>
      );
    }

    const ratingsTranslation: Record<string, string> = {
      story: "Сюжет и сценарий",
      acting: "Актёрская игра",
      visuals: "Визуал и съёмка",
      sound: "Музыка и звук",
      genreMatch: "Соответствие жанру"
    };

    const isWatched = user ? user.watchlist.includes(currentMovie.slug) : false;

    // Find previous and next movies in the same franchise
    const franchiseName = currentMovie.franchise;
    let franchiseMovies: typeof movies = [];
    let prevMovie: any = null;
    let nextMovie: any = null;
    if (franchiseName) {
      franchiseMovies = movies
        .filter(m => m.franchise === franchiseName)
        .sort((a, b) => a.year - b.year || a.releaseDate.localeCompare(b.releaseDate));
      
      const currentIndex = franchiseMovies.findIndex(m => m.slug === currentMovie.slug);
      if (currentIndex > 0) {
        prevMovie = franchiseMovies[currentIndex - 1];
      }
      if (currentIndex !== -1 && currentIndex < franchiseMovies.length - 1) {
        nextMovie = franchiseMovies[currentIndex + 1];
      }
    }

    const handleShare = async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?movie=${currentMovie.slug}`;
      const shareData = {
        title: `${currentMovie.title} — 25-й Кадр`,
        text: `Рецензии и оценки на фильм "${currentMovie.title}" (${currentMovie.year}) на платформе 25-й Кадр.`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            return;
          }
          console.warn("Native share failed, falling back to clipboard:", err);
        }
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy link: ", err);
      }
    };

    return (
      <div className="space-y-10 animate-fade-in pb-20 relative">
        {/* Big Backdrop Banner */}
        <div className="relative aspect-[2.8/1] min-h-[220px] md:min-h-[360px] rounded-2xl overflow-hidden border border-graphite-light shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent z-10" />
          <img
            src={currentMovie.backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => setPage("home")}
            className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md hover:bg-garnet border border-white/10 text-xs text-white px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Core details section split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left, details card */}
          <div className="space-y-6">
            <div className="bg-graphite border border-graphite-light rounded-xl p-6 relative">
              <img
                src={currentMovie.posterUrl}
                alt={currentMovie.title}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border border-graphite-light hover:border-garnet/30 transition duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Title specs */}
              <div className="mt-5 space-y-4">
                <div>
                  <h1 className="text-xl font-extrabold text-white leading-tight">
                    {currentMovie.title}
                  </h1>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    {currentMovie.originalTitle || currentMovie.title} • {currentMovie.year}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentMovie.genres.map((g, idx) => (
                    <span 
                      key={idx} 
                      className="text-[10px] bg-graphite-dark border border-graphite-light text-gray-300 px-2 py-0.5 rounded font-mono"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Grid details */}
                <div className="border-t border-graphite-light pt-4 space-y-2 text-[11px] sm:text-xs">
                  <div className="flex justify-between py-1 border-b border-graphite-light/20">
                    <span className="text-gray-500 font-medium font-mono uppercase tracking-widest text-[10px]">Режиссер</span>
                    <span 
                      onClick={() => {
                        const match = useStore.getState().directorsList.find(d => d.name.toLowerCase() === currentMovie.director.toLowerCase());
                        if (match) {
                          setPage("director", match.id);
                        } else {
                          const fallbackId = currentMovie.director.toLowerCase().replace(/[^a-zа-я0-9]+/g, "-");
                          setPage("director", fallbackId);
                        }
                      }}
                      className="text-garnet-light hover:text-white hover:underline font-bold text-right cursor-pointer transition select-none"
                    >
                      {currentMovie.director}
                    </span>
                  </div>
                  {currentMovie.composer && (
                    <div className="flex justify-between py-1 border-b border-graphite-light/20">
                      <span className="text-gray-500 font-medium font-mono uppercase tracking-widest text-[10px]">Композитор</span>
                      <span className="text-gray-200 text-right font-medium">{currentMovie.composer}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-graphite-light/20">
                    <span className="text-gray-500 font-medium font-mono uppercase tracking-widest text-[10px]">Страна</span>
                    <span className="text-gray-200 text-right">{currentMovie.country}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-graphite-light/20">
                    <span className="text-gray-500 font-medium font-mono uppercase tracking-widest text-[10px]">Хронометраж</span>
                    <span className="text-gray-200 font-mono text-right">{formatMovieDuration(currentMovie)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-graphite-light/20">
                    <span className="text-gray-500 font-medium font-mono uppercase tracking-widest text-[10px]">Дата выхода</span>
                    <span className="text-gray-300 font-mono text-right">{formatMovieReleaseDate(currentMovie)}</span>
                  </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => toggleWatchlist(currentMovie.slug)}
                    className={`flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-xl border font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer transition ${
                      isWatched
                        ? "bg-garnet border-garnet text-white hover:bg-garnet/80"
                        : "bg-graphite-dark hover:bg-garnet/10 border-graphite-light hover:border-garnet/60 text-gray-200"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{isWatched ? "В списке" : "В список"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className={`flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-xl border font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer transition relative overflow-hidden ${
                      copySuccess
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-graphite-dark hover:bg-garnet/10 border-graphite-light hover:border-garnet/60 text-gray-200"
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white animate-bounce" />
                        <span>Готово!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-garnet" />
                        <span>Поделиться</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCorrectionDesc("");
                    setCorrectionSuccessMsg("");
                    setShowCorrectionModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-dashed border-graphite-light hover:border-garnet/40 hover:bg-garnet/5 hover:text-white text-gray-400 text-[10px] sm:text-xs font-mono transition font-medium mt-3"
                >
                  <AlertCircle className="w-4 h-4 text-garnet-light" />
                  <span>Сообщить о неточности / Исправить ИИ</span>
                </button>
              </div>
            </div>

            {currentMovie.franchise && (
              <div className="bg-graphite border border-graphite-light rounded-xl p-5 space-y-3.5 Card-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-garnet/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                <div className="flex items-center justify-between border-b border-graphite-light pb-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Film className="w-3.5 h-3.5 text-garnet" /> Серия фильмов
                  </h4>
                  <span className="text-[10px] bg-garnet/10 text-garnet-light font-bold px-2 py-0.5 rounded-full font-mono">
                    {currentMovie.franchise}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {prevMovie ? (
                    <button
                      onClick={() => setPage("title", prevMovie.slug)}
                      className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-black/40 hover:bg-garnet/10 border border-graphite-light hover:border-garnet/30 text-left transition cursor-pointer group"
                    >
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider block group-hover:text-garnet-light transition">
                        ← Предыдущий
                      </span>
                      <span className="text-gray-200 font-semibold leading-tight line-clamp-2 text-[11px] group-hover:text-white transition">
                        {prevMovie.title}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {prevMovie.year} год
                      </span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-black/10 border border-graphite-light/20 text-left opacity-35 select-none">
                      <span className="text-[9px] font-mono font-bold text-gray-600 uppercase tracking-wider block">
                        ← Предыдущий
                      </span>
                      <span className="text-gray-500 mt-1 block text-[11px] font-medium italic">
                        Начало серии
                      </span>
                    </div>
                  )}

                  {nextMovie ? (
                    <button
                      onClick={() => setPage("title", nextMovie.slug)}
                      className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-black/40 hover:bg-garnet/10 border border-graphite-light hover:border-garnet/30 text-left transition cursor-pointer group"
                    >
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider text-right block group-hover:text-garnet-light transition">
                        Следующий →
                      </span>
                      <span className="text-gray-200 font-semibold leading-tight line-clamp-2 text-[11px] text-right group-hover:text-white transition block">
                        {nextMovie.title}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono text-right block">
                        {nextMovie.year} год
                      </span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-black/10 border border-graphite-light/20 text-right opacity-35 select-none">
                      <span className="text-[9px] font-mono font-bold text-gray-600 uppercase tracking-wider block font-medium">
                        Следующий →
                      </span>
                      <span className="text-gray-500 mt-1 block text-[11px] font-medium italic">
                        Финал серии
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cast block */}
            <div className="bg-graphite border border-graphite-light rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-graphite-light pb-2">
                В главных ролях
              </h4>
              <ul className="space-y-2 text-xs">
                {currentMovie.cast.map((actor, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-0.5 text-gray-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-garnet" />
                    <span>{actor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right main columns details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview & Ratings Metrics cards */}
            <div className="bg-graphite border border-graphite-light rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-graphite-light pb-2 mb-3">
                  Синопсис
                </h3>
                <p className="text-sm text-gray-200 leading-relaxed font-sans">{currentMovie.overview}</p>
              </div>

              {/* Dynamic Overall Grades Breakdown */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-graphite-light pb-2 mb-4">
                  Энциклопедический разбор фильма по категориям
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total rating highlighted badge style */}
                  <div className="bg-graphite-dark border border-graphite-light rounded-xl p-6 flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-3.5">
                      Общий средний балл
                    </p>
                    <RatingBadge rating={currentMovie.ratingAverage} size="large" showLabel={true} />
                    <p className="text-[10px] text-gray-505 mt-3.5 font-mono uppercase tracking-wide">
                      Основано на {currentMovie.ratingsCount} оценках экспертов
                    </p>
                  </div>

                  {/* Individual breakdown rows with visual progress bars */}
                  <div className="space-y-3">
                    {Object.entries(currentMovie.ratingsAverageBreakdown).map(([category, value]) => {
                      const categoryColor = getRatingColor(value);
                      return (
                        <div key={category} className="space-y-1 block">
                          <div className="flex justify-between items-baseline text-xs font-mono">
                            <span className="text-gray-400 text-[11px] font-sans font-medium">
                              {ratingsTranslation[category] || category}
                            </span>
                            <span className="font-bold text-sm tracking-tight" style={{ color: categoryColor }}>
                              {value}
                            </span>
                          </div>
                          <div className="w-full bg-graphite-dark rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(value / 10) * 100}%`,
                                backgroundColor: categoryColor
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* External Ratings Block */}
            {currentMovie && (
              <ExternalRatings slug={currentMovie.slug} externalRatings={currentMovie.externalRatings} title={currentMovie.title} kinopoiskId={currentMovie.kinopoiskId} imdbId={currentMovie.imdbId} />
            )}

            {/* Form writing reviews tab */}
            <ReviewForm />

            {/* List user reviews */}
            <div className="space-y-4">
              {(() => {
                const sortedReviews = [...currentMovieReviews].sort((a, b) => {
                  if (reviewSort === "newest") {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }
                  if (reviewSort === "oldest") {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  }
                  if (reviewSort === "highest_rating") {
                    return b.averageRating - a.averageRating;
                  }
                  return 0;
                });

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-graphite-light pb-3">
                      <h3 className="text-md font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                        <span>Лента пользовательских рецензий</span>
                        <span className="text-xs text-gray-400 font-normal font-mono lowercase">({currentMovieReviews.length})</span>
                      </h3>

                      {/* Sorting selector */}
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-garnet" />
                        <span>Сортировка:</span>
                        <select
                          value={reviewSort}
                          onChange={(e) => setReviewSort(e.target.value as any)}
                          className="bg-graphite-dark text-white font-bold border border-graphite-light px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-garnet cursor-pointer"
                        >
                          <option value="newest">Самые новые</option>
                          <option value="oldest">Самые старые</option>
                          <option value="highest_rating">Самые рейтинговые</option>
                        </select>
                      </div>
                    </div>

                    {sortedReviews.length === 0 ? (
                      <div className="bg-graphite border border-graphite-light p-8 rounded-xl text-center text-xs text-gray-400 leading-relaxed font-mono">
                        Будьте первым! Никто еще не выписал рецензию на это произведение. Заполните форму выше, чтобы начать обсуждение.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedReviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Franchise Series Slider */}
        {franchiseName && franchiseMovies.length > 1 && (() => {
          const avgRating = (franchiseMovies.reduce((sum, f) => sum + f.ratingAverage, 0) / franchiseMovies.length).toFixed(1);
          return (
            <div className="bg-graphite border border-graphite-light rounded-xl p-6 mt-8 space-y-4">
              <div className="flex items-center justify-between border-b border-graphite-light pb-3 border-opacity-65">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-white leading-none">
                    Все произведения франшизы: <span className="text-garnet">"{franchiseName}"</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase">
                    КК {franchiseMovies.length} наименований в коллекции серии
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 font-mono hidden md:inline-block">Средний рейтинг серии:</span>
                  <RatingBadge rating={parseFloat(avgRating)} size="small" forceScale10={true} showLabel={true} />
                  <span className="text-[10px] text-garnet font-mono uppercase bg-garnet/10 border border-garnet/20 px-2 py-1 rounded hidden sm:inline-block">
                    Связанная вселенная
                  </span>
                </div>
              </div>

              {/* Horizontal Scrollable Slider Row */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-garnet scrollbar-track-graphite-dark">
                {franchiseMovies.map((m) => {
                  const isCurrent = m.slug === currentMovie.slug;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => {
                        if (!isCurrent) {
                          setPage("title", m.slug);
                        }
                      }}
                      className={`w-36 xs:w-40 shrink-0 group rounded-xl bg-graphite-dark border p-2 transition duration-300 relative ${
                        isCurrent 
                          ? "border-garnet shadow-lg shadow-garnet/10 cursor-default" 
                          : "border-graphite-light hover:border-garnet/50 cursor-pointer hover:-translate-y-1"
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute top-3 right-3 z-10 text-[8px] font-mono uppercase font-black px-1.5 py-0.5 bg-garnet rounded border border-garnet-light text-white shadow-md">
                          Сейчас
                        </span>
                      )}
                      
                      <div className="aspect-[2/3] w-full rounded-lg overflow-hidden relative border border-graphite-light/20">
                        <img 
                          src={m.posterUrl} 
                          alt={m.title} 
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 z-10 rounded overflow-hidden">
                          <RatingBadge rating={m.ratingAverage} size="small" forceScale10={true} />
                        </div>
                      </div>

                      <div className="mt-2 space-y-0.5">
                        <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition">
                          {m.title}
                        </h4>
                        <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                          <span>{m.year} г.</span>
                          <span className="capitalize">{m.type === 'tv' ? 'Сериал' : m.type === 'anime' ? 'Аниме' : 'Фильм'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderProfile = () => {
    if (loadingProfile) {
      return (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-garnet border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 font-mono">Синхронизация профиля кинокритика...</p>
        </div>
      );
    }

    if (!profileUser) {
      return (
        <div className="py-16 text-center max-w-sm mx-auto space-y-4 animate-fade-in">
          <AlertCircle className="w-12 h-12 text-garnet mx-auto" />
          <h3 className="text-lg font-bold text-white">Профиль не найден</h3>
          <p className="text-xs text-gray-500 font-mono">
            Пользователь с никнеймом @{activeUsername} не зарегистрирован на платформе.
          </p>
          <button 
            onClick={() => setPage("home")} 
            className="bg-graphite border border-graphite-light hover:border-gray-500 text-xs px-4 py-2 rounded-lg text-white"
          >
            На главную
          </button>
        </div>
      );
    }

    const { favorite, count } = calculateGenreCounts(profileReviews);
    const isEditingMyOwn = user && user.id === profileUser.id;

    // Filter watchlist films based on profile userwatchlist slugs
    const watchlistMovies = movies.filter(m => (profileUser.watchlist || []).includes(m.slug));

    return (
      <div className="space-y-8 animate-fade-in pb-16 relative">
        {/* Profile Card Header Banner with Cinematic Cover customization option */}
        <div 
          className="border border-graphite-light rounded-xl p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden transition-all duration-500"
          style={{
            backgroundImage: profileUser.profileCoverUrl ? `url(${profileUser.profileCoverUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {profileUser.profileCoverUrl ? (
            /* Darkness vignette film gradient mask overlay */
            <div className="absolute inset-0 bg-gradient-to-t from-[#101015] via-[#101015]/80 to-[#101015]/90 z-0 pointer-events-none" />
          ) : (
            <>
              <div className="absolute inset-0 bg-graphite z-0 pointer-events-none" />
              {/* Saturated backdrop glow representing profile aura */}
              <div className="w-48 h-48 bg-garnet/10 rounded-full blur-3xl absolute -top-10 -right-10 z-0 pointer-events-none" />
            </>
          )}
          
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left z-10 relative">
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-garnet/40 shadow-xl"
              referrerPolicy="no-referrer"
            />
            
            <div className="space-y-2 max-w-xl">
              <div>
                {editingProfile ? (
                  <div className="space-y-2 block">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-graphite-dark border border-graphite-light text-sm text-white px-2 py-1 rounded max-w-[200px] focus:outline-none focus:border-garnet font-bold"
                    />
                    <p className="text-[11px] text-gray-400 font-mono">@{profileUser.username}</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-none">
                      {profileUser.displayName}
                    </h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">@{profileUser.username}</p>
                  </>
                )}

                {/* Highly-polished custom favorite film banner label wrapper */}
                {profileUser.favoriteMovieTitle && !editingProfile && (
                  <div className="inline-flex items-center gap-1.5 bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-full py-0.5 px-3 text-[10px] text-[#fbbf24] font-mono mt-2 select-none">
                    <Film className="w-3 h-3 text-[#fbbf24]" />
                    <span>Кинематографический вкус: #{profileUser.favoriteMovieTitle}</span>
                  </div>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-3 block">
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full bg-graphite-dark border border-graphite-light text-xs text-gray-200 p-2 rounded-lg max-w-md focus:outline-none focus:border-garnet font-sans leading-relaxed block"
                    rows={2}
                  />

                  {/* Selecting favorite film background dropdown */}
                  <div className="space-y-1 block">
                    <label className="text-[10px] font-mono uppercase text-gray-400 block font-bold tracking-wider">Изменить любимый фильм (обложку):</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "none") {
                          setTempFavSlug("");
                          setTempFavTitle("");
                          setTempFavCover("");
                        } else {
                          const selectedMove = movies.find(m => m.slug === val);
                          if (selectedMove) {
                            setTempFavSlug(selectedMove.slug);
                            setTempFavTitle(selectedMove.title);
                            setTempFavCover(selectedMove.backdropUrl);
                          }
                        }
                      }}
                      value={tempFavSlug || "none"}
                      className="bg-graphite-dark border border-graphite-light text-xs text-white px-2.5 py-1.5 rounded-lg w-full max-w-sm focus:outline-none focus:border-garnet font-mono cursor-pointer"
                    >
                      <option value="none">--- Без обложки ---</option>
                      {movies.map(m => (
                        <option key={m.id} value={m.slug}>{m.title} ({m.year})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {profileUser.bio || "Кинокритик на платформе 25-й Кадр."}
                </p>
              )}

              {/* Showcase badges inside profile header */}
              {profileUser.showcase && profileUser.showcase.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profileUser.showcase.map(id => {
                    const ach = ACHIEVEMENTS.find(a => a.id === id);
                    if (!ach) return null;
                    const rarityColors = {
                      common: "border-slate-800 text-slate-350 bg-slate-900/40",
                      rare: "border-blue-900/50 text-blue-300 bg-blue-950/20",
                      epic: "border-purple-900/50 text-purple-300 bg-purple-950/20",
                      legendary: "border-amber-500/40 text-amber-300 bg-amber-950/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    }[ach.rarity] || "border-slate-800 text-slate-300";
                    return (
                      <span 
                        key={id} 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-mono leading-none ${rarityColors}`}
                        title={`${ach.title}: ${ach.description}`}
                      >
                        <Trophy className="w-2.5 h-2.5 shrink-0" />
                        <span className="font-extrabold">{ach.title}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              <p className="text-[10px] text-gray-500 font-mono">
                В сообществе с {new Date(profileUser.createdAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between items-center md:items-end gap-4 z-10 shrink-0">
            {/* Action edit bio button */}
            {isEditingMyOwn ? (
              <button
                onClick={() => editingProfile ? saveProfileChanges() : setEditingProfile(true)}
                className="bg-graphite-dark/60 hover:bg-garnet hover:text-white border border-graphite-light px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer text-gray-200"
              >
                {editingProfile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Сохранить</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Редактировать</span>
                  </>
                )}
              </button>
            ) : (
              user && (
                <button
                  onClick={() => toggleFollowUser(profileUser.id)}
                  className={`border px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                    (user.following || []).includes(profileUser.id)
                      ? "bg-garnet border-garnet text-white hover:bg-garnet/80"
                      : "bg-graphite border-graphite-light hover:border-garnet/60 text-gray-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{(user.following || []).includes(profileUser.id) ? "Подписки ✓" : "Читать +"}</span>
                </button>
              )
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="bg-graphite-dark border border-graphite-light/50 px-3.5 py-1.5 rounded-lg min-w-[70px]">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Рецензии</p>
                <p className="text-lg font-black font-mono text-white mt-0.5">{profileReviews.length}</p>
              </div>
              <div className="bg-graphite-dark border border-graphite-light/50 px-3.5 py-1.5 rounded-lg min-w-[70px]">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Закладки</p>
                <p className="text-lg font-black font-mono text-white mt-0.5">{(profileUser.watchlist || []).length}</p>
              </div>
              <div className="bg-graphite-dark border border-graphite-light/50 px-3.5 py-1.5 rounded-lg min-w-[80px]">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Рекорд</p>
                <p className="text-xs font-bold text-garnet-light mt-1.5 max-w-[75px] truncate" title={favorite}>
                  {favorite}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Critical Taste Analysis Dashboard widget */}
        <TasteAnalysis userId={profileUser.id} />

        {/* Витрина Достижений Section */}
        <div className="bg-[#11131c] border border-graphite-light rounded-xl p-5 md:p-6 space-y-4 animate-fade-in mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Витрина достижений</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">Избранные или редкие трофеи, которыми гордится кинокритик (макс. 3)</p>
            </div>
            {isEditingMyOwn && (
              <button 
                onClick={() => {
                  setTempShowcase(profileUser.showcase || []);
                  setShowShowcaseModal(true);
                }}
                className="bg-graphite-dark hover:bg-garnet hover:text-white border border-graphite-light/80 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer transition text-gray-200 shrink-0"
              >
                Настроить витрину
              </button>
            )}
          </div>

          {/* List showcase achievements */}
          {(!profileUser.showcase || profileUser.showcase.length === 0) ? (
            <div className="border border-dashed border-graphite-light/60 p-6 rounded-xl text-center text-xs text-gray-500 font-mono">
              Витрина пуста. {isEditingMyOwn ? "Нажмите настроить, чтобы закрепить до 3 заработанных наград!" : "Пользователь пока не выбрал достижения для витрины."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {profileUser.showcase.map(id => {
                const ach = ACHIEVEMENTS.find(a => a.id === id);
                if (!ach) return null;
                const rarityConfig = {
                  common: { bg: "bg-[#161a24]/60", border: "border-slate-800", text: "text-slate-450", label: "Обычное" },
                  rare: { bg: "bg-blue-950/15", border: "border-blue-900/40", text: "text-blue-400", label: "Редкое" },
                  epic: { bg: "bg-purple-950/15", border: "border-purple-950", text: "text-purple-400", label: "Эпическое" },
                  legendary: { bg: "bg-amber-950/20", border: "border-amber-950/80", text: "text-amber-500", label: "Легендарное" }
                }[ach.rarity] || { bg: "bg-[#161a25]", border: "border-slate-800", text: "text-slate-450", label: "Награда" };
                return (
                  <div key={id} className={`p-4 rounded-xl border flex items-center gap-3 transition-all hover:scale-[1.01] hover:bg-[#161a26]/80 ${rarityConfig.bg} ${rarityConfig.border}`}>
                    <div className="p-2.5 bg-[#161a26] border border-graphite-light/20 rounded-lg">
                      <Award className={`w-5 h-5 shrink-0 ${rarityConfig.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-mono uppercase font-bold tracking-widest text-gray-500">{rarityConfig.label}</p>
                      <h4 className="text-xs font-bold text-white leading-tight truncate">{ach.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Profile Tabs */}
        <div className="mt-8">
          <div className="flex border-b border-graphite-light gap-2">
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 text-xs sm:text-sm font-mono uppercase tracking-wider font-extrabold px-4 border-b-2 cursor-pointer transition ${
                activeTab === "reviews" 
                  ? "border-garnet text-white" 
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Рецензии кинокритика ({profileReviews.length})
            </button>
            <button
              onClick={() => setActiveTab("watchlist")}
              className={`pb-3 text-xs sm:text-sm font-mono uppercase tracking-wider font-extrabold px-4 border-b-2 cursor-pointer transition ${
                activeTab === "watchlist" 
                  ? "border-garnet text-white" 
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Список ожидания ({(profileUser.watchlist || []).length})
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`pb-3 text-xs sm:text-sm font-mono uppercase tracking-wider font-extrabold px-4 border-b-2 cursor-pointer transition ${
                activeTab === "following" 
                  ? "border-garnet text-white" 
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Подписки / Читатели ({(profileUser.following || []).length} / { (profileUser.followers || []).length })
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`pb-3 text-xs sm:text-sm font-mono uppercase tracking-wider font-extrabold px-4 border-b-2 cursor-pointer transition ${
                activeTab === "achievements" 
                  ? "border-garnet text-white" 
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Достижения ({(profileAchievements || []).filter(a => a.unlocked).length} / {ACHIEVEMENTS.length})
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`pb-3 text-xs sm:text-sm font-mono uppercase tracking-wider font-extrabold px-4 border-b-2 cursor-pointer transition ${
                activeTab === "statistics" 
                  ? "border-garnet text-white" 
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Статистика ({profileReviews.length})
            </button>
            {isEditingMyOwn && (
              <button
                onClick={() => {
                  setActiveTab("moderation");
                  fetchModerationRequests();
                }}
                className={`pb-3 text-xs sm:text-sm font-[#fbbf24] uppercase tracking-wider font-mono font-extrabold px-4 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
                  activeTab === "moderation" 
                    ? "border-garnet text-white font-black" 
                    : "border-transparent text-amber-400/90 hover:text-white"
                }`}
              >
                <span>Модерация ИИ</span>
                {moderationRequests.filter(r => r.status === "pending").length > 0 && (
                  <span className="bg-garnet text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {moderationRequests.filter(r => r.status === "pending").length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="mt-6">
            {activeTab === "reviews" ? (
              profileReviews.length === 0 ? (
                <div className="bg-graphite border border-graphite-light p-10 rounded-xl text-center text-xs text-gray-400 font-mono leading-relaxed">
                  Пользователь еще не написал ни одной рецензии на платформе.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  {profileReviews.map((review) => (
                     <ReviewCard key={review.id} review={review} showMovieLink={true} />
                  ))}
                </div>
              )
            ) : activeTab === "watchlist" ? (
              watchlistMovies.length === 0 ? (
                <div className="bg-graphite border border-graphite-light p-10 rounded-xl text-center text-xs text-gray-400 font-mono leading-relaxed">
                  Закладки пусты. Фильмы отсутствуют в списке ожидания.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fade-in">
                  {watchlistMovies.map((movie) => (
                    <FilmCard key={movie.id} movie={movie} />
                  ))}
                </div>
              )
            ) : activeTab === "following" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                {/* Following list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 font-mono uppercase tracking-wider border-b border-graphite-light pb-2">
                    Читает ({(profileUser.following || []).length})
                  </h3>
                  {profileFollowingProfiles.length === 0 ? (
                    <p className="text-xs text-gray-500 font-mono">Никого не читает.</p>
                  ) : (
                    <div className="space-y-3">
                      {profileFollowingProfiles.map(u => {
                        const isSubbed = user ? (user.following || []).includes(u.id) : false;
                        const isMe = user && user.id === u.id;
                        return (
                          <div key={u.id} className="bg-graphite border border-graphite-light p-3.5 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={u.avatarUrl} 
                                alt={u.displayName} 
                                className="w-10 h-10 rounded-full object-cover border border-garnet/20 cursor-pointer"
                                onClick={() => setPage("profile", undefined, u.username)}
                              />
                              <div>
                                <h4 
                                  onClick={() => setPage("profile", undefined, u.username)}
                                  className="text-sm font-bold text-white hover:text-garnet transition cursor-pointer"
                                >
                                  {u.displayName}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-mono">@{u.username}</p>
                              </div>
                            </div>
                            
                            {user && !isMe && (
                              <button
                                onClick={() => toggleFollowUser(u.id)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition font-mono border cursor-pointer ${
                                  isSubbed 
                                    ? "bg-garnet border-garnet text-white"
                                    : "bg-graphite hover:bg-garnet/15 border-graphite-light text-gray-300"
                                }`}
                              >
                                {isSubbed ? "✓ Подписка" : "Читать"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Followers list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 font-mono uppercase tracking-wider border-b border-graphite-light pb-2">
                    Читатели ({(profileUser.followers || []).length})
                  </h3>
                  {profileFollowerProfiles.length === 0 ? (
                    <p className="text-xs text-gray-500 font-mono">Нет читателей.</p>
                  ) : (
                    <div className="space-y-3">
                      {profileFollowerProfiles.map(u => {
                        const isSubbed = user ? (user.following || []).includes(u.id) : false;
                        const isMe = user && user.id === u.id;
                        return (
                          <div key={u.id} className="bg-graphite border border-graphite-light p-3.5 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={u.avatarUrl} 
                                alt={u.displayName} 
                                className="w-10 h-10 rounded-full object-cover border border-garnet/20 cursor-pointer"
                                onClick={() => setPage("profile", undefined, u.username)}
                              />
                              <div>
                                <h4 
                                  onClick={() => setPage("profile", undefined, u.username)}
                                  className="text-sm font-bold text-white hover:text-garnet transition cursor-pointer"
                                >
                                  {u.displayName}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-mono">@{u.username}</p>
                              </div>
                            </div>
                            
                            {user && !isMe && (
                              <button
                                onClick={() => toggleFollowUser(u.id)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition font-mono border cursor-pointer ${
                                  isSubbed 
                                    ? "bg-garnet border-garnet text-white"
                                    : "bg-graphite hover:bg-garnet/15 border-graphite-light text-gray-300"
                                }`}
                              >
                                {isSubbed ? "✓ Подписка" : "Читать"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "achievements" ? (
              <div className="animate-fade-in">
                <AchievementsTab progressList={profileAchievements || []} />
              </div>
            ) : activeTab === "moderation" ? (
              <div className="animate-fade-in">
                <ModerationView 
                  requests={moderationRequests} 
                  loading={loadingModeration} 
                  onReview={reviewModerationRequest}
                  movies={movies}
                />
              </div>
            ) : (
              <div className="animate-fade-in">
                <ProfileStatistics profileReviews={profileReviews} movies={movies} watchlistMovies={watchlistMovies} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTops = () => {
    // Media switcher
    const listOrdered = [...movies].sort((a, b) => b.ratingAverage - a.ratingAverage);

    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="border-b border-graphite-light pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-garnet" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              Высшие рейтинги сообщества 25 Кадра
            </h2>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: "", label: "Все жанры" },
              { id: "Драма", label: "Драмы" },
              { id: "Фантастика", label: "Фантастика" },
              { id: "Криминал", label: "Криминал" },
              { id: "Аниме", label: "Аниме" }
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setSearchFilters("", "all", g.id)}
                className="bg-graphite border border-graphite-light hover:border-garnet px-3 py-1.5 rounded transition cursor-pointer text-gray-200"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Big visual top grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {listOrdered.map((movie, idx) => (
            <div key={movie.id} className="relative group">
              <div className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-garnet text-white font-black text-xs flex items-center justify-center border-2 border-graphite-dark shadow-xl font-mono">
                {idx + 1}
              </div>
              <FilmCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSearch = () => {
    const showDynamicPrompt = searchResultCount === 0 && searchQuery.trim().length > 0;

    const FORMATS_LIST = [
      "Фильмы",
      "Сериалы",
      "Мини-сериалы",
      "Мультфильмы",
      "Аниме",
      "Короткометражки",
      "Документальное кино",
      "ТВ-шоу / Ток-шоу"
    ];

    const GENRES_LIST = [
      "Драма", "Комедия", "Триллер", "Ужасы", "Фантастика", "Фэнтези", "Боевик", 
      "Приключения", "Криминал", "Детектив", "Мелодрама", "Военный", "Исторический", 
      "Биография", "Спорт", "Мюзикл", "Нуар", "Вестерн"
    ];

    const filteredMoviesList = movies.filter(movie => {
      // 1. Format matching (Multi-selection)
      if (selectedFormats.length > 0) {
        const matchSomeFormat = selectedFormats.some(format => {
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
        if (!matchSomeFormat) return false;
      }

      // 2. Genre matching (Multi-selection)
      if (selectedGenres.length > 0) {
        const matchAllGenres = selectedGenres.every(g => 
          movie.genres.map(x => x.toLowerCase()).includes(g.toLowerCase())
        );
        if (!matchAllGenres) return false;
      }

      // 3. Year matching (Advanced)
      if (extraYear.trim()) {
        const yr = extraYear.trim();
        if (!movie.year.toString().includes(yr)) return false;
      }

      // 4. Country matching (Advanced)
      if (extraCountry.trim()) {
        const countryQuery = extraCountry.toLowerCase().trim();
        if (!movie.country || !movie.country.toLowerCase().includes(countryQuery)) return false;
      }

      // 5. Director matching (Advanced)
      if (extraDirector.trim()) {
        const dirQuery = extraDirector.toLowerCase().trim();
        if (!movie.director || !movie.director.toLowerCase().includes(dirQuery)) return false;
      }

      return true;
    });

    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="border-b border-graphite-light pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-widest text-white leading-relaxed">
              {searchQuery ? (
                <>Результаты поиска по запросу: <span className="text-garnet">"{searchQuery}"</span></>
              ) : (
                <>Каталог и Расширенный поиск</>
              )}
            </h2>
            <p className="text-[11px] text-gray-400 font-mono uppercase mt-0.5">
              Найдено {filteredMoviesList.length} произведений из {movies.length} доступных в каталоге
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-graphite-light pb-0.5 gap-6">
          <button
            onClick={() => setSearchTab("movies")}
            className={`pb-3 text-xs font-mono uppercase tracking-widest cursor-pointer transition relative ${
              searchTab === "movies" ? "text-garnet border-b-2 border-garnet font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Произведения ({filteredMoviesList.length})
          </button>
          <button
            onClick={() => setSearchTab("reviewers")}
            className={`pb-3 text-xs font-mono uppercase tracking-widest cursor-pointer transition relative ${
              searchTab === "reviewers" ? "text-garnet border-b-2 border-garnet font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Рецензенты ({reviewers.length})
          </button>
        </div>

        {searchTab === "movies" && (
          <div className="space-y-6">
            {/* Специальный раздел "Облако жанров" */}
            <div className="bg-graphite/45 border border-graphite-light/20 rounded-2xl p-5 space-y-3.5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-garnet/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-light/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-7 bg-garnet rounded-full" />
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#d8d8d8] font-mono flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-garnet" />
                      Облако жанров (Быстрые фильтры)
                    </h3>
                    <p className="text-[10px] text-gray-500 font-sans mt-0.5">Включайте и выключайте жанры в один клик для мгновенной фильтрации базы</p>
                  </div>
                </div>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={() => setSelectedGenres([])}
                    className="text-[10px] text-garnet-light hover:text-white hover:underline transition font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <X className="w-3 h-3" />
                    <span>Сбросить жанры ({selectedGenres.length})</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {GENRES_LIST.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                        } else {
                          setSelectedGenres([...selectedGenres, genre]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-garnet border-garnet text-white shadow-md shadow-garnet/25 transform scale-102"
                          : "bg-graphite-dark border-graphite-light/40 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-graphite"
                      }`}
                    >
                      <span>{genre}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Elegant Filters Toggler and Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-graphite/30 border border-graphite-light/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className="px-4 py-2 bg-graphite border border-graphite-light/60 hover:border-garnet/65 hover:bg-graphite-light text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Filter className={`w-3.5 h-3.5 transition-transform ${showFiltersPanel ? 'text-garnet' : 'text-gray-400'}`} />
                  <span>Параметры фильтрации</span>
                  {(selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector) && (
                    <span className="bg-garnet text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      {selectedFormats.length + selectedGenres.length + (extraYear ? 1 : 0) + (extraCountry ? 1 : 0) + (extraDirector ? 1 : 0)}
                    </span>
                  )}
                  {showFiltersPanel ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                </button>
                <div className="text-xs text-gray-400 font-mono">
                  Совпадений: <span className="text-white font-bold">{filteredMoviesList.length}</span>
                </div>
              </div>

              {/* Active Filters Clear Button */}
              {(selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector) && (
                <button
                  onClick={() => {
                    setSelectedFormats([]);
                    setSelectedGenres([]);
                    setExtraYear("");
                    setExtraCountry("");
                    setExtraDirector("");
                    // Clear search type defaults
                    useStore.getState().setSearchFilters(searchQuery, "all", "");
                  }}
                  className="text-xs text-garnet-light hover:text-garnet hover:underline font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Сбросить все</span>
                </button>
              )}
            </div>

            {/* Expandable Filter settings pane */}
            {showFiltersPanel && (
              <div className="bg-graphite/40 border border-graphite-light/20 p-5 rounded-2xl space-y-6 animate-fade-in relative shadow-xl">
                {/* Split layout: Formats and Genres */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Formats Column (takes 5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#a8a8a8] border-b border-graphite-light/30 pb-1.5 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-garnet" />
                      <span>Форматы ({selectedFormats.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATS_LIST.map((format) => {
                        const isSelected = selectedFormats.includes(format);
                        return (
                          <button
                            key={format}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedFormats(selectedFormats.filter(f => f !== format));
                              } else {
                                setSelectedFormats([...selectedFormats, format]);
                              }
                            }}
                            className={`px-3 py-2.5 rounded-xl border text-xs text-left transition duration-150 cursor-pointer flex items-center justify-between font-medium group ${
                              isSelected
                                ? "bg-garnet border-garnet text-white shadow-md shadow-garnet/10"
                                : "bg-graphite/50 border-graphite-light/30 text-gray-400 hover:text-white hover:border-graphite-light hover:bg-graphite"
                            }`}
                          >
                            <span className="truncate">{format}</span>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition ${
                              isSelected ? "border-white bg-white/20" : "border-gray-500 group-hover:border-gray-300"
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Genres Column (takes 7 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#a8a8a8] border-b border-graphite-light/30 pb-1.5 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                      <span>Жанры ({selectedGenres.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {GENRES_LIST.map((genre) => {
                        const isSelected = selectedGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedGenres(selectedGenres.filter(g => g !== genre));
                              } else {
                                setSelectedGenres([...selectedGenres, genre]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition duration-150 ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-500 text-amber-400 font-semibold shadow-inner"
                                : "bg-graphite/40 border-graphite-light/30 text-gray-400 hover:text-white hover:border-graphite-light hover:bg-[#1a1a1a]"
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Advanced Filters Clickable Header */}
                <div className="border-t border-graphite-light/30 pt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between text-left text-xs text-gray-300 hover:text-white transition py-1.5 focus:outline-none cursor-pointer bg-transparent border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded bg-graphite border border-graphite-light/40 transition-colors ${showAdvanced ? 'border-garnet' : ''}`}>
                        <SlidersHorizontal className="w-3.5 h-3.5 text-garnet-light" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-300">Расширенный поиск</span>
                      {(extraYear || extraCountry || extraDirector) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-garnet animate-ping inline-block" />
                      )}
                    </div>
                    {showAdvanced ? (
                      <span className="text-gray-500 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1">Скрыть <ChevronUp className="w-3.5 h-3.5" /></span>
                    ) : (
                      <span className="text-gray-500 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1">Раскрыть <ChevronDown className="w-3.5 h-3.5" /></span>
                    )}
                  </button>

                  {/* Advanced Filters Expandable Content */}
                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-fade-in pb-2 pt-1 border-t border-graphite-light/10">
                      {/* Year input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Год производства:</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Например, 2014"
                            value={extraYear}
                            onChange={(e) => setExtraYear(e.target.value)}
                            className="w-full bg-graphite-dark/60 border border-graphite-light/40 rounded-lg text-xs py-2 pl-9 pr-8 focus:outline-none focus:border-garnet text-gray-200 font-mono"
                          />
                          {extraYear && (
                            <button onClick={() => setExtraYear("")} className="absolute right-2 top-2 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Country input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Страна производства:</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Например, США, СССР"
                            value={extraCountry}
                            onChange={(e) => setExtraCountry(e.target.value)}
                            className="w-full bg-graphite-dark/60 border border-graphite-light/40 rounded-lg text-xs py-2 pl-9 pr-8 focus:outline-none focus:border-garnet text-gray-200"
                          />
                          {extraCountry && (
                            <button onClick={() => setExtraCountry("")} className="absolute right-2 top-2 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Director input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Режиссёр:</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Например, Нолан"
                            value={extraDirector}
                            onChange={(e) => setExtraDirector(e.target.value)}
                            className="w-full bg-graphite-dark/60 border border-graphite-light/40 rounded-lg text-xs py-2 pl-9 pr-8 focus:outline-none focus:border-garnet text-gray-200"
                          />
                          {extraDirector && (
                            <button onClick={() => setExtraDirector("")} className="absolute right-2 top-2 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Generation prompt for empty database word search matches */}
            {showDynamicPrompt && (
              <div className="bg-[#161a26] border border-garnet/30 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-2xl relative overflow-hidden my-4 animate-fade-in">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-garnet to-garnet-light" />
                <div className="w-12 h-12 rounded-full bg-garnet/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-garnet animate-bounce" />
                </div>
                
                <h3 className="text-md font-bold text-white leading-relaxed">
                  Этого фильма пока нет в нашей энциклопедии!
                </h3>
                
                <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-md mx-auto">
                  Напишите любое произведение в поле ниже — наш инновационный ИИ-киновед мгновенно сопоставит даты, 
                  режиссеров, воссоздаст объективные оценки категорий и внесет фильм в глобальную базу!
                </p>

                <div className="flex gap-2 max-w-md mx-auto mt-2">
                  <input
                    type="text"
                    placeholder="Бойцовский Клуб, Зеленая Миля, Наруто..."
                    value={aiGenerateQuery}
                    onChange={(e) => setAiGenerateQuery(e.target.value)}
                    className="flex-1 bg-graphite-dark border border-graphite-light rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-garnet text-gray-100"
                  />
                  <button
                    type="button"
                    disabled={generatingMovie || !aiGenerateQuery.trim()}
                    onClick={() => useStore.getState().generateNewMovie(aiGenerateQuery, "movie")}
                    className="bg-garnet hover:bg-garnet-light text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:bg-graphite-light"
                  >
                    {generatingMovie ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Сгенерировать</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {filteredMoviesList.length === 0 && !showDynamicPrompt && (
              <div className="py-24 text-center max-w-md mx-auto text-gray-400 space-y-4 font-mono select-none">
                <Info className="w-10 h-10 text-gray-500 mx-auto" />
                <p className="text-xs text-gray-300">
                  Ничего не найдено по настроенным фильтрам. Попробуйте сбросить параметры или дописать новый поисковый запрос.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormats([]);
                      setSelectedGenres([]);
                      setExtraYear("");
                      setExtraCountry("");
                      setExtraDirector("");
                      useStore.getState().setSearchFilters("", "all", "");
                    }}
                    className="px-4 py-2 bg-graphite/80 border border-graphite-light hover:border-garnet-light text-xs text-white rounded-lg transition cursor-pointer font-bold"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            )}

            {filteredMoviesList.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              >
                {filteredMoviesList.map((movie) => (
                  <motion.div
                    key={movie.id}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95, y: 15, x: -10 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        x: 0,
                        transition: {
                          type: "spring",
                          stiffness: 35,
                          damping: 12,
                          duration: 1.2, // Увеличенное время затухания и анимация начала движения кадра!
                        }
                      }
                    }}
                  >
                    <FilmCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {searchTab === "reviewers" && (
          <div className="space-y-4">
            {loadingReviewers ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-4 border-garnet border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 font-mono mt-4">Ищем рецензентов...</p>
              </div>
            ) : reviewers.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto text-gray-400 space-y-3 font-mono">
                <User className="w-10 h-10 text-gray-500 mx-auto" />
                <p className="text-xs">Рецензенты по запросу "{searchQuery}" не найдены.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {reviewers.map((reviewer) => {
                  const isMe = user && user.id === reviewer.id;
                  const isSubbed = user && user.following && user.following.includes(reviewer.id);
                  
                  return (
                    <div 
                      key={reviewer.id} 
                      className="bg-panel border border-graphite-light rounded-xl p-4 flex flex-col justify-between hover:border-garnet/50 transition duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={reviewer.avatarUrl} 
                          alt={reviewer.displayName} 
                          className="w-12 h-12 rounded-full object-cover border border-garnet/35 cursor-pointer hover:opacity-85 transition shrink-0"
                          onClick={() => setPage("profile", "", reviewer.username)}
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 
                            onClick={() => setPage("profile", "", reviewer.username)}
                            className="text-sm font-bold text-white hover:text-garnet transition cursor-pointer truncate leading-tight"
                          >
                            {reviewer.displayName}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono">@{reviewer.username}</p>
                          {reviewer.bio && (
                            <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                              {reviewer.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-graphite-light/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                          <div>
                            <span className="font-bold text-white pr-0.5">
                              {reviewer.followers ? reviewer.followers.length : 0}
                            </span>{" "}
                            подп.
                          </div>
                          <div>
                            <span className="font-bold text-white pr-0.5">
                              {reviewer.following ? reviewer.following.length : 0}
                            </span>{" "}
                            чит.
                          </div>
                        </div>

                        {user && !isMe && (
                          <button
                            onClick={() => toggleFollowUser(reviewer.id)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-mono uppercase font-bold tracking-wider transition border cursor-pointer ${
                              isSubbed 
                                ? "bg-garnet border-garnet text-white border-transparent"
                                : "bg-graphite hover:bg-[#800000]/15 border-graphite-light text-gray-300"
                            }`}
                          >
                            {isSubbed ? "✓ Читаю" : "Читать"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col antialiased">
      {/* Sticky Header block layout */}
      <Header />

      {/* Main viewport with fluid limits */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error notification strip */}
        {errorMsg && (
          <div className="bg-garnet/25 border border-garnet/50 p-4 rounded-xl flex items-center gap-2 text-xs text-white shadow-lg mb-6 animate-fade-in font-sans">
            <AlertCircle className="w-4 h-4 text-garnet shrink-0" />
            <div className="flex-1 font-medium">{errorMsg}</div>
            <button 
              onClick={() => useStore.getState().clearError()} 
              className="text-gray-400 hover:text-white px-2 py-1 font-bold font-mono transition"
            >
              ✕
            </button>
          </div>
        )}

        {currentPage === "home" && renderHome()}
        {currentPage === "title" && renderTitle()}
        {currentPage === "profile" && renderProfile()}
        {currentPage === "tops" && renderTops()}
        {currentPage === "search" && renderSearch()}
        {currentPage === "recommendations" && <Recommendations />}
        {currentPage === "director" && <DirectorPage />}
      </main>

      {/* Humble aesthetic cinema footer, omitting unrequested tracking lines */}
      <footer className="bg-[#0b0b0b] border-t border-graphite-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© 2026 25-й Кадр. Сообщество рецензий в духе профессионалов.</p>
          <div className="flex gap-6 text-[11px]">
            <a href="#" className="hover:text-garnet transition">Фильмы</a>
            <a href="#" className="hover:text-garnet transition">Сериалы</a>
            <a href="#" className="hover:text-garnet transition">Аниме</a>
            <a href="#" className="hover:text-garnet transition">Авторы</a>
          </div>
        </div>
      </footer>

      {/* Achievements unlocked sliding topmost banner stacks */}
      {newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0 && (
        <>
          <style>{`
            @keyframes topSlideDown {
              0% {
                transform: translate(-50%, -40px);
                opacity: 0;
              }
              100% {
                transform: translate(-50%, 0);
                opacity: 1;
              }
            }
          `}</style>
          
          <div 
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3.5 max-w-sm w-full px-4 pointer-events-none"
            style={{
              animation: "topSlideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            {newlyUnlockedAchievements.map((ach) => {
              const borderColors = {
                common: "border-slate-800 bg-[#161a26]/95 shadow-[0_10px_25px_rgba(0,0,0,0.5)]",
                rare: "border-blue-500 bg-[#0c1221]/95 shadow-[0_10px_30px_rgba(59,130,246,0.3)]",
                epic: "border-purple-500 bg-[#120a21]/95 shadow-[0_10px_30px_rgba(168,85,247,0.3)]",
                legendary: "border-amber-500 bg-[#1c1208]/95 shadow-[0_10px_35px_rgba(245,158,11,0.4)] animate-pulse-subtle"
              }[ach.rarity] || "border-slate-705 bg-[#161a26]/95";

              const rarityLabel = {
                common: "Обычное",
                rare: "Редкое",
                epic: "Эпическое",
                legendary: "Легендарное"
              }[ach.rarity] || "Новое";

              return (
                <div 
                  key={ach.id} 
                  className={`pointer-events-auto border-2 ${borderColors} p-4 rounded-xl flex items-start gap-3.5 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:scale-[1.01]`}
                >
                  <div className={`p-2.5 bg-graphite-dark border border-slate-800 rounded-lg text-amber-505 shrink-0 ${
                    ach.rarity === "legendary" ? "text-amber-500" : "text-gray-300"
                  }`}>
                    <Trophy className="w-5 h-5 animate-pulse" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#ef4444] uppercase block leading-none">
                      ★ Получено достижение!
                    </span>
                    <h4 className="text-sm font-black text-white mt-1.5 leading-tight">
                      {ach.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 font-sans leading-relaxed">
                      {ach.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="text-[8px] font-mono uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                        {rarityLabel}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => dismissAchievementUnlock()}
                    className="text-gray-400 hover:text-white text-xs font-mono transition leading-none shrink-0 cursor-pointer p-1"
                    title="Убрать"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Showcase Configurator Modal */}
      {showShowcaseModal && profileUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161a26] border border-graphite-light rounded-2xl max-w-lg w-full p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-graphite-light/65">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  Настройка вашей витрины
                </h3>
              </div>
              <button 
                onClick={() => setShowShowcaseModal(false)}
                className="text-gray-400 hover:text-white text-sm font-mono cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-4 pr-1">
              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                Выберите до 3 ваших заработанных достижений для отображения в витрине и шапке профиля. Выбрано: <strong className="text-amber-500 font-mono text-sm">{tempShowcase.length}/3</strong>.
              </p>

              {/* Show only unlocked achievements from profileUser progress */}
              {(() => {
                const unlockedList = (profileAchievements || []).filter(p => p.unlocked).map(p => {
                  const metadata = ACHIEVEMENTS.find(a => a.id === p.achievementId);
                  return metadata ? { ...metadata, progress: p } : null;
                }).filter(Boolean) as any[];

                if (unlockedList.length === 0) {
                  return (
                    <div className="border border-dashed border-graphite-light p-8 rounded-xl text-center text-xs text-gray-500 font-mono">
                      У вас пока нет разблокированных достижений. Продолжайте обозревать фильмы, копить лайки и подписки, чтобы разблокировать их!
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {unlockedList.map((ach) => {
                      const isSelected = tempShowcase.includes(ach.id);
                      const rarityTags = {
                        common: "bg-slate-900 text-slate-400 border-slate-800",
                        rare: "bg-blue-955/30 text-blue-400 border-blue-900/40",
                        epic: "bg-purple-955/30 text-purple-400 border-purple-900/40",
                        legendary: "bg-amber-955/30 text-amber-500 border-amber-900/40"
                      }[ach.rarity] || "bg-slate-900 text-slate-400";
                      
                      const toggleSelect = () => {
                        if (isSelected) {
                          setTempShowcase(tempShowcase.filter(id => id !== ach.id));
                        } else {
                          if (tempShowcase.length >= 3) {
                            return; // limit 3
                          }
                          setTempShowcase([...tempShowcase, ach.id]);
                        }
                      };

                      return (
                        <div 
                          key={ach.id}
                          onClick={toggleSelect}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-amber-955/25 border-amber-500/50" 
                              : "bg-[#11131c] border-graphite-light/40 hover:border-graphite-light"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-graphite-dark border border-graphite-light/30 rounded-lg">
                              <Award className="w-5 h-5 text-gray-35" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">{ach.description}</p>
                              <span className={`inline-block text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border mt-1.5 ${rarityTags}`}>
                                {ach.rarity}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 pl-1">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected 
                                ? "bg-amber-500 border-amber-500 text-black" 
                                : "border-gray-600 hover:border-gray-450"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="pt-4 border-t border-graphite-light/65 flex gap-3 bg-[#161a26]/90">
              <button
                type="button"
                onClick={() => setShowShowcaseModal(false)}
                className="flex-1 bg-graphite-dark text-gray-300 hover:text-white py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border border-graphite-light/45 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await updateShowcase(tempShowcase);
                  if (ok) {
                    setShowShowcaseModal(false);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-amber-450 to-amber-550 text-black py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition text-center font-extrabold hover:brightness-110"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Core Data Correction Modal */}
      {showCorrectionModal && currentMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161a26]/95 border border-graphite-light rounded-2xl max-w-md w-full p-6 relative overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-graphite-light/65">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-garnet" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  Исправление данных
                </h3>
              </div>
              <button 
                onClick={() => setShowCorrectionModal(false)}
                className="text-gray-400 hover:text-white text-sm font-mono cursor-pointer transition select-none"
                disabled={correctingMovieData}
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Заметили неточность в описании или характеристиках произведения <strong className="text-white">«{currentMovie.title}»</strong>? 
                Подробно опишите верные сведения (например, правильный год, режиссера, хронометраж или страну), а ИИ автоматически приведет энциклопедию в порядок.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-2">
                  Описание проблемы или верные данные
                </label>
                <textarea
                  value={correctionDesc}
                  onChange={(e) => setCorrectionDesc(e.target.value)}
                  placeholder="Пример: Год выпуска должен быть 2014, а не 2015. Режиссером фильма является Кристофер Нолан, а оригинальное название пишется как 'Interstellar'."
                  className="w-full bg-graphite-dark text-gray-200 text-xs rounded-xl border border-graphite-light focus:border-garnet/60 focus:outline-none p-3 h-28 resize-none leading-relaxed transition"
                  disabled={correctingMovieData || !!correctionSuccessMsg}
                />
              </div>

              {correctionSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fade-in">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold block">Предложение на модерации!</strong>
                    <span>ИИ проанализировал ваши правки и направил их на утверждение модераторам энциклопедии.</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold block">Ошибка корректировки</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-graphite-light/65">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 bg-graphite hover:bg-graphite-light text-gray-300 rounded-xl text-xs font-mono transition"
                disabled={correctingMovieData}
              >
                Отмена
              </button>
              
              {!correctionSuccessMsg && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!correctionDesc.trim()) return;
                    const ok = await correctMovieData(currentMovie.slug, correctionDesc);
                    if (ok) {
                      setCorrectionSuccessMsg("Обновлено!");
                      setCorrectionDesc("");
                      setTimeout(() => {
                        setShowCorrectionModal(false);
                        setCorrectionSuccessMsg("");
                      }, 4000);
                    }
                  }}
                  disabled={correctingMovieData || !correctionDesc.trim()}
                  className="px-4 py-2 bg-garnet hover:bg-garnet/80 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {correctingMovieData ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Корректируем...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>Исправить данные</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Area */}
      <div className="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto bg-[#161a26]/95 border-l-4 border-amber-500 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 border border-graphite-light/50 backdrop-blur-md animate-slide-in"
          >
            <div className="p-1.5 bg-amber-950/25 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-mono font-extrabold uppercase tracking-wide text-white flex items-center justify-between">
                <span>{t.title}</span>
                <span className="text-amber-400 text-[11px] font-mono font-black">{t.percent}%</span>
              </h4>
              <p className="text-[11px] text-gray-350 font-sans mt-1 leading-relaxed">{t.message}</p>
              
              {/* Progress bar inside the toast */}
              <div className="w-full bg-[#11131c] h-1.5 rounded-full mt-2 overflow-hidden border border-graphite-light/25">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${t.percent}%` }}
                />
              </div>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-gray-400 hover:text-white text-xs font-mono transition leading-none shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
