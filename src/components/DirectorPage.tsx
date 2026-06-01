import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { RatingBadge } from "./RatingBadge";
import { 
  Heart, 
  Bell, 
  Star, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Award, 
  Trophy,
  MapPin, 
  Palette, 
  Film, 
  Calendar, 
  ThumbsUp, 
  UserCheck, 
  Clock, 
  Maximize, 
  ArrowUpDown, 
  CheckCircle,
  Eye,
  Flag,
  AlertCircle,
  Sparkles,
  Check
} from "lucide-react";
import { MovieTitle, getEpisodesLabel } from "../types";

export function DirectorPage() {
  const { 
    activeSlug, 
    currentDirectorData, 
    loadingDirector, 
    setPage, 
    user, 
    favoriteDirectors, 
    toggleFavoriteDirector, 
    subscribedDirectors, 
    toggleSubscribeDirector,
    userReviews,
    correctDirectorBio,
    correctingDirectorData,
    errorMsg,
    clearError,
    moderationRequests,
    fetchModerationRequests
  } = useStore();

  const [expandedBio, setExpandedBio] = useState(false);
  const [filterFormat, setFilterFormat] = useState<"all" | "movie" | "anime_tv">("all");
  const [filterOnlyUserReviewed, setFilterOnlyUserReviewed] = useState(false);
  const [sortBy, setSortBy] = useState<"year_desc" | "year_asc" | "rating_desc" | "reviews_desc">("rating_desc");

  // modal states
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagDesc, setFlagDesc] = useState("");
  const [flagSuccessMsg, setFlagSuccessMsg] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Interactive Award Showcase states & logic
  const [selectedAward, setSelectedAward] = useState<string | null>(null);
  const [tributes, setTributes] = useState<{ [award: string]: number }>(() => {
    try {
      const saved = localStorage.getItem("director_awards_tributes_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handlePayTribute = (awardName: string) => {
    const newTributes = {
      ...tributes,
      [awardName]: (tributes[awardName] || 0) + 1
    };
    setTributes(newTributes);
    try {
      localStorage.setItem("director_awards_tributes_v1", JSON.stringify(newTributes));
    } catch (e) {
      console.error(e);
    }
  };

  const getAwardTrivia = (awardName: string): { desc: string; significance: string } => {
    const name = (awardName || "").toLowerCase();
    if (name.includes("оскар")) {
      return {
        desc: "Высшая кинонаграда планеты от Американской академии кинематографических искусств и наук. Знак абсолютного величия и признания критиков.",
        significance: "Престиж уровня А+ • Мировое признание"
      };
    }
    if (name.includes("глобус")) {
      return {
        desc: "Престижная премия Голливудской ассоциации иностранной прессы. Считается важнейшим историческим предиктором оскаровского триумфа.",
        significance: "Репутация • Кинематографический триумф"
      };
    }
    if (name.includes("пальмов") || name.includes("канн")) {
      return {
        desc: "Самая престижная европейская фестивальная награда, вручаемая в Каннах за непревзойденное авторское видение и новаторство.",
        significance: "Культурное наследие • Фестивальный триумф"
      };
    }
    if (name.includes("эмми")) {
      return {
        desc: "Главная мировая телевизионная премия Америки, эквивалент Оскара для многосерийных шедевров телевизионного формата.",
        significance: "Золотой стандарт ТВ • Выдающееся качество"
      };
    }
    if (name.includes("золотой лев") || name.includes("венеци")) {
      return {
        desc: "Исторический золотой европейский трофей Венецианского фестиваля, символизирующий максимальную художественную глубину.",
        significance: "Фестивальный триумф • Максимальный престиж"
      };
    }
    if (name.includes("бафта") || name.includes("bafta")) {
      return {
        desc: "Премия Британской академии кино и телевизионных искусств. Важнейший культурный титул и золотой стандарт Европы.",
        significance: "Британское наследие • Высокий статус"
      };
    }
    if (name.includes("артист ссср") || name.includes("артист рф")) {
      return {
        desc: "Почётнейшее государственное звание, присуждаемое за исключительные заслуги в искусстве и всенародную любовь.",
        significance: "Легендарный статус • Народная любовь"
      };
    }
    if (name.includes("государственная премия")) {
      return {
        desc: "Высшая награда за выдающиеся достижения в области литературы, кинематографа и государственного искусства.",
        significance: "Государственное признание • Исторический вклад"
      };
    }
    if (name.includes("кинотавр")) {
      return {
        desc: "Резонансный главный российский кинофестиваль. Приз за оригинальное раскрытие актуальных тем сложной отечественной реальности.",
        significance: "Культовый статус • Авторская смелость"
      };
    }
    if (name.includes("ника") || name.includes("овен")) {
      return {
        desc: "Профессиональная национальная кинематографическая премия, символ глубокой признательности и любви киносообщества.",
        significance: "Почтение гильдий • Шедевр кино"
      };
    }
    if (name.includes("сатурн")) {
      return {
        desc: "Престижнейшая награда Академии научной фантастики, фэнтези и фильмов ужасов за выдающийся вклад в жанровое кино.",
        significance: "Лучшее в мире • Культовый блокбастер"
      };
    }
    if (name.includes("ассоциации кинокритиков") || name.includes("критик")) {
      return {
        desc: "Выбор профессионального экспертного синдиката ведущих печатных и онлайн-обозревателей прессы.",
        significance: "Интеллектуальное признание • Выбор экспертов"
      };
    }
    if (name.includes("anime award") || name.includes("newtype")) {
      return {
        desc: "Престижнейшая анимационная премия Токио и Японии за выдающийся определяющий вклад в развитие мировой рисованной индустрии.",
        significance: "Шедевр анимации • Триумф индустрии"
      };
    }
    return {
      desc: "Объект гордости в профессиональной карьере режиссёра, запечатлевший уникальное художественное или кассовое достижение.",
      significance: "Профессиональное признание • Знак качества"
    };
  };

  // Fetch moderation requests on mount and activeSlug changes
  useEffect(() => {
    fetchModerationRequests();
  }, [fetchModerationRequests, activeSlug]);

  // Scroll to top on page mount or director change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSlug]);

  if (loadingDirector) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-gray-400 font-mono">
        <div className="w-12 h-12 border-4 border-garnet border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm tracking-widest animate-pulse">ЗАГРУЗКА РЕЖИССЁРА...</p>
      </div>
    );
  }

  if (!currentDirectorData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <Film className="w-16 h-16 text-garnet mb-4 animate-bounce" />
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Режиссёр не найден</h3>
        <p className="text-gray-400 max-w-md text-sm mb-6">
          К сожалению, запрашиваемый режиссёр еще не внесен в нашу базу или произошла ошибка загрузки.
        </p>
        <button 
          onClick={() => setPage("home")}
          className="bg-garnet hover:bg-garnet-light text-white font-bold font-mono text-xs uppercase px-6 py-3 rounded-xl transition shadow-lg shadow-garnet/20"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  const { director, movies, stats, topWorks, popularReviews, similarDirectors } = currentDirectorData;

  const isFavorite = favoriteDirectors.includes(director.id);
  const isSubscribed = subscribedDirectors.includes(director.id);

  // Apply filters to movies list
  let filteredMovies = [...movies];

  if (filterFormat === "movie") {
    filteredMovies = filteredMovies.filter(m => m.type === "movie" || m.type === "short");
  } else if (filterFormat === "anime_tv") {
    filteredMovies = filteredMovies.filter(m => m.type === "anime" || m.type === "tv");
  }

  if (filterOnlyUserReviewed) {
    const reviewedSlugs = new Set(userReviews.map(r => r.titleSlug));
    filteredMovies = filteredMovies.filter(m => reviewedSlugs.has(m.slug));
  }

  // Handle filmography sorting
  filteredMovies.sort((a, b) => {
    if (sortBy === "year_desc") return b.year - a.year;
    if (sortBy === "year_asc") return a.year - b.year;
    if (sortBy === "rating_desc") return b.ratingAverage - a.ratingAverage;
    if (sortBy === "reviews_desc") return b.ratingsCount - a.ratingsCount;
    return 0;
  });

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* 1. HERO SECTION */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-zinc-900/60 to-black border-b border-zinc-900">
        {/* Ambient Blur Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl scale-110 pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: `url(${director.photoUrl})` }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-stretch">
            {/* Artistic Portrait Wrapper */}
            <div className="relative group shrink-0 w-64 sm:w-72 aspect-[3/4] overflow-hidden rounded-2xl border-2 border-garnet/50 shadow-2xl shadow-garnet/10">
              <img 
                src={director.photoUrl} 
                alt={director.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent group-hover:via-black/20"></div>
              
              <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md rounded-xl p-3 border border-white/5 font-mono text-center">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none mb-1">Годы жизни / Возраст</p>
                <p className="text-xs sm:text-sm text-garnet-light font-bold leading-tight">{director.yearsOfLife}</p>
              </div>
            </div>

            {/* Director Titles & Details */}
            <div className="flex-1 flex flex-col justify-between text-center md:text-left py-2">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-garnet/20 border border-garnet-light/30 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-wider text-garnet-light mb-3 select-none">
                  <Palette className="w-3.5 h-3.5" /> Мастер кадра
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-none mb-2">
                  {director.name}
                </h1>
                <p className="text-sm sm:text-lg text-zinc-400 font-medium italic font-mono mb-4">
                  {director.originalName}
                </p>

                {/* Director Quote */}
                <div className="relative pl-4 sm:pl-6 border-l-4 border-garnet max-w-xl my-6 mx-auto md:mx-0 text-left">
                  <p className="text-zinc-300 text-sm sm:text-base italic leading-relaxed font-sans select-none">
                    «{director.quote}»
                  </p>
                </div>
              </div>

              {/* Action Bookmark Buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6 sm:mt-8">
                <button
                  type="button"
                  id="fav-director-btn"
                  onClick={() => toggleFavoriteDirector(director.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 select-none ${
                    isFavorite
                      ? "bg-garnet border-garnet text-white shadow-lg shadow-garnet/30 hover:bg-garnet/80"
                      : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
                  {isFavorite ? "В избранном" : "Добавить в избранное"}
                </button>

                <button
                  type="button"
                  id="sub-director-btn"
                  onClick={() => toggleSubscribeDirector(director.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 select-none ${
                    isSubscribed
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500"
                      : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Bell className={`w-4 h-4 ${isSubscribed ? "animate-swing" : ""}`} />
                  {isSubscribed ? "Уведомления ВКЛ" : "Подписаться на обновления"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Biography, Filmography, and Reviews */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* 2. ОСНОВНАЯ ИНФОРМАЦИЯ & БИОГРАФИЯ */}
            <section id="director-bio-section" className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-garnet" />
                  <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                    Биография и Творчество
                  </h2>
                </div>
                
                <button
                  type="button"
                  id="flag-director-btn"
                  onClick={() => {
                    setFlagDesc("");
                    setFlagSuccessMsg("");
                    if (clearError) clearError();
                    setShowFlagModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-garnet/50 hover:bg-zinc-900/40 text-[10px] sm:text-xs text-zinc-400 hover:text-white font-mono uppercase tracking-wider transition cursor-pointer select-none"
                  title="Сообщить о неточности в биографии"
                >
                  <Flag className="w-3.5 h-3.5 text-garnet" />
                  <span className="hidden sm:inline">Пожаловаться</span>
                </button>
              </div>

              {/* Toast Alerts & Status Alerts */}
              {showSuccessToast && (
                <div id="director-success-toast" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold font-sans">Обращение успешно отправлено!</p>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-sans">
                      Ваши исправления получены и направлены модераторам. ИИ подготовил предложение для утверждения администраторами.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowSuccessToast(false)} 
                    className="text-zinc-500 hover:text-white transition text-xs font-mono select-none cursor-pointer focus:outline-none"
                  >
                    ✕
                  </button>
                </div>
              )}

              {(() => {
                const pendingReport = (moderationRequests || []).find(
                  req => req.directorId === director?.id && req.status === "pending"
                );
                if (pendingReport && !showSuccessToast) {
                  return (
                    <div id="director-pending-alert" className="bg-amber-500/5 border border-amber-500/15 text-amber-400/90 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
                      <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-bold font-sans">Правки находятся на рассмотрении</p>
                        <p className="text-[11px] sm:text-xs text-zinc-450 mt-0.5 font-sans">
                          Уже отправлено предложение по корректировке биографии этого режиссёра. Изменения в энциклопедии вступят в силу после одобрения администратором.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Biography Text with subtle pulse / highlight animation */}
              {(() => {
                const hasPendingReport = (moderationRequests || []).some(
                  req => req.directorId === director?.id && req.status === "pending"
                );
                const isHighlightActive = hasPendingReport || correctingDirectorData || showSuccessToast;

                return (
                  <div className={`relative p-4 rounded-2xl transition duration-500 border ${
                    isHighlightActive 
                      ? "bg-amber-500/5 border-amber-500/30 animate-pulse ring-1 ring-amber-500/10 shadow-lg shadow-amber-500/5" 
                      : "bg-transparent border-transparent"
                  }`}>
                    <div className={`transition-all duration-300 ${
                      expandedBio 
                        ? "p-4 sm:p-5 bg-zinc-900/30 border border-zinc-900/60 rounded-2xl shadow-inner mb-3" 
                        : "p-0 bg-transparent border-transparent mb-0"
                    }`}>
                      <p className={`text-zinc-350 text-sm sm:text-base leading-relaxed ${!expandedBio ? "line-clamp-4" : ""}`}>
                        {director.biography}
                      </p>
                    </div>
                    
                    {/* Visual fade-out cover for truncated text */}
                    {!expandedBio && (
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/0 via-black/1 pointer-events-none"></div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !expandedBio;
                        setExpandedBio(nextVal);
                        if (nextVal) {
                          setTimeout(() => {
                            const section = document.getElementById("director-bio-section");
                            if (section) {
                              section.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }, 50);
                        }
                      }}
                      className="flex items-center gap-1.5 mt-3 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-850/80 border border-zinc-800/80 hover:border-zinc-700/80 text-garnet hover:text-garnet-light uppercase tracking-wider transition-all duration-300 transform-gpu hover:-translate-y-0.5 hover:shadow-lg hover:shadow-garnet/5 cursor-pointer focus:outline-none select-none"
                    >
                      {expandedBio ? (
                        <>Свернуть <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Читать полностью <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                );
              })()}

              {/* Metadata Badges Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900/60">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Страна</span>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{director.country}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Стиль режиссуры</span>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Palette className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{director.style}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Ключевые темы</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {director.keyThemes.map((theme: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Awards decoration */}
              <div className="bg-garnet/5 border border-garnet/20 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-garnet-light uppercase tracking-widest font-mono mb-3">
                  <Award className="w-4 h-4" /> Главные Регалии Режиссёра
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-zinc-300">
                  {director.awards.map((award: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-garnet fill-garnet shrink-0" />
                      <span>{award}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 4. ФИЛЬМОГРАФИЯ (GRID WITH ADVANCED FILTERS) */}
            <section id="director-filmography-section" className="space-y-6">
              <div className="lex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5 text-garnet" />
                  <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                    Фильмография ({filteredMovies.length})
                  </h2>
                </div>
                
                {/* Format Filtering Segment */}
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900 text-xs font-mono self-start sm:self-auto">
                  <button
                    onClick={() => setFilterFormat("all")}
                    className={`px-3 py-1.5 rounded-lg transition ${filterFormat === "all" ? "bg-garnet text-white font-bold" : "text-zinc-400 hover:text-white"}`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setFilterFormat("movie")}
                    className={`px-3 py-1.5 rounded-lg transition ${filterFormat === "movie" ? "bg-garnet text-white font-bold" : "text-zinc-400 hover:text-white"}`}
                  >
                    Фильмы
                  </button>
                  <button
                    onClick={() => setFilterFormat("anime_tv")}
                    className={`px-3 py-1.5 rounded-lg transition ${filterFormat === "anime_tv" ? "bg-garnet text-white font-bold" : "text-zinc-400 hover:text-white"}`}
                  >
                    Аниме / ТВ
                  </button>
                </div>
              </div>

              {/* Sorting & Filter Settings Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-950">
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  {/* Sorting Selector */}
                  <div className="flex items-center gap-2 text-zinc-400 font-mono">
                    <ArrowUpDown className="w-3.5 h-3.5 text-garnet" />
                    <span>Сортировка:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-zinc-900 text-white font-bold border border-zinc-850 px-2 py-1 rounded-lg focus:outline-none focus:border-garnet cursor-pointer"
                    >
                      <option value="rating_desc">По рейтингу</option>
                      <option value="year_desc">Сначала новые</option>
                      <option value="year_asc">Сначала старые</option>
                      <option value="reviews_desc">По рецензиям</option>
                    </select>
                  </div>
                </div>

                {/* Only user reviews filter segment */}
                {user && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-mono text-zinc-450 hover:text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={filterOnlyUserReviewed}
                      onChange={(e) => setFilterOnlyUserReviewed(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-900 text-garnet focus:ring-garnet cursor-pointer h-4 w-4"
                    />
                    <span>Только с нашей рецензией</span>
                  </label>
                )}
              </div>

              {/* Movie Cards Grid */}
              {filteredMovies.length === 0 ? (
                <div className="bg-zinc-950/20 border-2 border-dashed border-zinc-900 rounded-3xl p-12 text-center text-gray-500 font-mono text-sm">
                  <Film className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
                  <span>Нет произведений, подходящих под выбранные фильтры.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                  {filteredMovies.map((movie) => {
                    const isUserReviewed = userReviews.some(rev => rev.titleSlug === movie.slug);

                    return (
                      <div
                        key={movie.id}
                        onClick={() => setPage("title", movie.slug)}
                        className="group flex flex-col justify-between bg-zinc-950/50 border border-zinc-900 rounded-2xl p-3 hover:bg-zinc-900/40 transition transform duration-300 hover:-translate-y-1 cursor-pointer select-none relative overflow-hidden"
                      >
                        {/* Status Check badge */}
                        {isUserReviewed && (
                          <div className="absolute top-2 left-2 z-20 bg-emerald-700/85 backdrop-blur shadow border border-emerald-500/50 rounded-lg p-1.5 flex items-center justify-center animate-fade-in" title="Вы написали рецензию!">
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Poster Aspect Cover */}
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-zinc-900/50 bg-zinc-900 relative">
                            <img 
                              src={movie.posterUrl} 
                              alt={movie.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transform duration-500" 
                              loading="lazy"
                            />
                            {/* Inner Rating overlay */}
                            <div className="absolute top-2 right-2 z-10 backdrop-blur-md rounded-lg overflow-hidden">
                              <RatingBadge rating={movie.ratingAverage} size="small" forceScale10={true} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/0 opacity-0 group-hover:opacity-60 transition duration-300 flex items-end p-3">
                              <span className="text-white text-xs font-mono font-bold flex items-center gap-1">
                                <Maximize className="w-3.5 h-3.5" /> Подробнее
                              </span>
                            </div>
                          </div>

                          {/* Titles metadata */}
                          <div>
                            <span className="text-[10px] font-mono text-garnet-light uppercase tracking-wider font-semibold block mb-0.5">
                              {movie.type === "movie" ? "Полный метр" : movie.type === "tv" ? "Сериал" : movie.type === "anime" ? "Аниме" : "Короткий метр"} • {movie.year}
                            </span>
                            <h4 className="text-sm font-black text-white group-hover:text-garnet-light transition line-clamp-2 leading-snug">
                              {movie.title}
                            </h4>
                          </div>
                        </div>

                        {/* Interactive counts footer */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 mt-3 border-t border-zinc-900/50">
                          <span className="flex items-center gap-1">
                            <Film className="w-3.5 h-3.5" /> {movie.duration.split(" ")[0]} мин
                          </span>
                          <span className="flex items-center gap-1 group-hover:text-zinc-300 transition">
                            <MessageSquare className="w-3.5 h-3.5 text-garnet" /> {movie.ratingsCount} голосов
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 6. ПОПУЛЯРНЫЕ РЕЦЕНЗИИ О ФИЛЬМАХ ЭТОГО РЕЖИССЁРА */}
            <section id="director-popular-reviews-section" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                <MessageSquare className="w-5 h-5 text-garnet" />
                <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                  Популярные Рецензии на его работы
                </h2>
              </div>

              {popularReviews.length === 0 ? (
                <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-10 text-center text-gray-500 font-mono text-sm leading-relaxed">
                  Будьте первым! Рецензии на работы этого режиссёра пока отсутствуют на платформе. Напишите своё рецензентское эссе уже сегодня через карточку любого фильма.
                </div>
              ) : (
                <div className="space-y-4">
                  {popularReviews.map((rev) => (
                    <div 
                      key={rev.id} 
                      className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 hover:border-zinc-800 transition"
                    >
                      {/* Review author head */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={rev.userAvatar} 
                            alt={rev.userDisplayName} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-full border border-garnet/50 shrink-0" 
                          />
                          <div>
                            <p 
                              onClick={() => setPage("profile", "", rev.username)}
                              className="text-sm font-bold text-white hover:text-garnet-light cursor-pointer transition leading-snug"
                            >
                              {rev.userDisplayName}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">@{rev.username}</p>
                          </div>
                        </div>

                        {/* Title link and score */}
                        <div className="flex items-center gap-2">
                          <div 
                            onClick={() => setPage("title", rev.titleSlug)}
                            className="bg-zinc-900 border border-zinc-800 hover:border-garnet hover:bg-black font-mono text-xs px-2.5 py-1 rounded-xl text-zinc-300 hover:text-garnet-light cursor-pointer select-none transition flex items-center gap-1.5"
                          >
                            <Film className="w-3.5 h-3.5 shrink-0" />
                            <span>{rev.titleName} ({rev.titleYear})</span>
                          </div>

                          <RatingBadge rating={rev.averageRating} size="small" />
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="text-zinc-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap select-all font-sans">
                        {rev.text}
                      </p>

                      {/* Likes count & date layout */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-3 border-t border-zinc-900/50">
                        <span>{new Date(rev.createdAt).toLocaleDateString("ru-RU")}</span>
                        <div className="flex items-center gap-1 text-garnet font-bold bg-garnet/5 px-3 py-1 rounded-full border border-garnet/10">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Понравилось: {(rev.likes || []).length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: Statistics, Top-10 & Similar Directors */}
          <div className="space-y-8">
            
            {/* 3. СТАТИСТИКА «КАДР ЗА ТВОРЧЕСТВО» */}
            <section id="director-stats-section" className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Compass className="w-5 h-5 text-garnet animate-spin-slow" />
                <h3 className="text-base font-bold uppercase tracking-wider text-white font-mono">
                  Статистика на сайте
                </h3>
              </div>

              {/* Bento grid metric outputs */}
              <div className="space-y-4">
                
                {/* Avg rating metric */}
                <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900 text-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Средняя оценка фильмов</span>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">из 100</span>
                  </div>
                  <div className="flex justify-center items-center gap-1 mt-2">
                    {[1,2,3,4,5].map((s) => {
                      const filled = stats.averageRating >= s * 20;
                      return <Star key={s} className={`w-3.5 h-3.5 ${filled ? "text-garnet fill-garnet" : "text-zinc-800"}`} />;
                    })}
                  </div>
                </div>

                {/* Counter Reviews */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-900/20 border border-zinc-900/60 rounded-xl font-mono text-xs">
                  <span className="text-zinc-400">Всего рецензий:</span>
                  <span className="text-white font-bold">{stats.totalReviews} рецензент-постов</span>
                </div>

                {/* Highlight Films cards */}
                {stats.highestRated && (
                  <div 
                    onClick={() => setPage("title", stats.highestRated!.slug)}
                    className="p-3.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition duration-300 cursor-pointer flex flex-col justify-between select-none"
                  >
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold mb-1 block">★ Самый высокооценённый</span>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-black text-white line-clamp-1">{stats.highestRated.title}</span>
                      <RatingBadge rating={stats.highestRated.ratingAverage} size="small" forceScale10={true} />
                    </div>
                  </div>
                )}

                {stats.lowestRated && (
                  <div 
                    onClick={() => setPage("title", stats.lowestRated!.slug)}
                    className="p-3.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition duration-300 cursor-pointer flex flex-col justify-between select-none"
                  >
                    <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold mb-1 block">⚠ Самый недооценённый</span>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-black text-white line-clamp-1">{stats.lowestRated.title}</span>
                      <RatingBadge rating={stats.lowestRated.ratingAverage} size="small" forceScale10={true} />
                    </div>
                  </div>
                )}

                {stats.mostDiscussed && (
                  <div 
                    onClick={() => setPage("title", stats.mostDiscussed!.slug)}
                    className="p-3.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl transition duration-300 cursor-pointer flex flex-col justify-between select-none"
                  >
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold mb-1 block">💬 Самый обсуждаемый</span>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-black text-white line-clamp-1">{stats.mostDiscussed.title}</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">{stats.mostDiscussed.ratingsCount} отз.</span>
                    </div>
                  </div>
                )}

                {/* Award Showcase Interactive Component */}
                {director.awards && director.awards.length > 0 && (
                  <div className="pt-5 border-t border-zinc-900/80 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Trophy className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                        Витрина выдающихся наград
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {director.awards.slice(0, 3).map((award, idx) => {
                        const trivia = getAwardTrivia(award);
                        const isSelected = selectedAward === award;
                        const tributeCount = tributes[award] || 0;

                        return (
                          <div 
                            key={idx}
                            id={`award-${idx}`}
                            onClick={() => setSelectedAward(isSelected ? null : award)}
                            className={`group/award relative p-3.5 rounded-2xl border cursor-pointer transition duration-300 select-none flex flex-col justify-between ${
                              isSelected 
                                ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5" 
                                : "bg-zinc-900/30 hover:bg-zinc-900/50 border-zinc-900 hover:border-zinc-800"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                                  isSelected ? "bg-amber-500/20 text-amber-400" : "bg-zinc-900/60 text-zinc-400 group-hover/award:text-amber-400"
                                }`}>
                                  <Trophy className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-white leading-tight pr-2">
                                  {award}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 self-start mt-1">
                                {tributeCount > 0 && (
                                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/10">
                                    👏 {tributeCount}
                                  </span>
                                )}
                                <Sparkles className={`w-3.5 h-3.5 transition-colors ${
                                  isSelected ? "text-amber-400 animate-spin-slow" : "text-zinc-600 group-hover/award:text-zinc-400"
                                }`} />
                              </div>
                            </div>

                            {isSelected && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-2.5 border-t border-zinc-900/80 space-y-2.5 text-left"
                                onClick={(e) => e.stopPropagation()} // Prevent card closing on inner clicks
                              >
                                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                                  {trivia.desc}
                                </p>
                                <div className="flex items-center justify-between gap-2 pt-1 font-mono text-[9px]">
                                  <span className="text-amber-400 font-bold uppercase tracking-wider">
                                    {trivia.significance}
                                  </span>
                                  <button
                                    onClick={() => handlePayTribute(award)}
                                    className="bg-amber-500 hover:bg-amber-400 text-black font-black text-[9px] px-2.5 py-1 rounded transition-all uppercase tracking-wider flex items-center gap-1 active:scale-95 shadow-sm shadow-amber-500/20"
                                  >
                                    <span>Почтить</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </section>

            {/* 5. ЛУЧШИЕ РАБОТЫ (ПО ВЕРСИИ САЙТА) */}
            <section id="director-best-works-section" className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Award className="w-5 h-5 text-garnet" />
                <h3 className="text-base font-bold uppercase tracking-wider text-white font-mono">
                  Лучшие работы режиссёра
                </h3>
              </div>

              {topWorks.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono text-center">Фильмы отсутствуют</p>
              ) : (
                <div className="space-y-3">
                  {topWorks.map((m: MovieTitle, idx: number) => (
                    <div
                      key={m.id}
                      onClick={() => setPage("title", m.slug)}
                      className="group flex items-center justify-between gap-3 p-2 hover:bg-zinc-900/40 rounded-xl cursor-pointer select-none transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Rating rank badge */}
                        <span className="text-xs font-mono font-bold text-garnet-light/75 w-5 text-center">
                          #{idx + 1}
                        </span>
                        
                        <img 
                          src={m.posterUrl} 
                          alt={m.title} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 object-cover rounded-lg border border-zinc-900 shrink-0" 
                        />
                        
                        <div className="overflow-hidden">
                          <p className="text-xs sm:text-sm font-black text-white group-hover:text-garnet-light transition truncate">
                            {m.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">{m.year} • {m.country.split(",")[0]}</p>
                        </div>
                      </div>

                      <RatingBadge rating={m.ratingAverage} size="small" forceScale10={true} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 7. ПОХОЖИЕ РЕЖИССЁРЫ */}
            <section id="director-similar-section" className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Star className="w-5 h-5 text-garnet animate-pulse" />
                <h3 className="text-base font-bold uppercase tracking-wider text-white font-mono">
                  Похожие режиссёры
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed select-none">
                Если вам близко творчество {director.name}, обязательно обратите внимание на следующих авторов:
              </p>

              <div className="space-y-3 pt-1">
                {similarDirectors.map((otherDir) => (
                  <div
                    key={otherDir.id}
                    onClick={() => setPage("director", otherDir.id)}
                    className="group flex items-center gap-3 p-2.5 bg-zinc-900/20 border border-zinc-900 hover:border-garnet/30 hover:bg-zinc-900/40 rounded-2xl transition duration-300 cursor-pointer select-none"
                  >
                    <img 
                      src={otherDir.photoUrl} 
                      alt={otherDir.name} 
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 object-cover rounded-full border border-garnet/30 group-hover:scale-105 transform duration-300 shrink-0" 
                    />
                    
                    <div className="overflow-hidden flex-1">
                      <h4 className="text-xs font-black text-white group-hover:text-garnet-light transition truncate leading-snug">
                        {otherDir.name}
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-mono truncate uppercase tracking-widest">{otherDir.country}</p>
                    </div>

                    <div className="bg-garnet/10 p-1.5 rounded-lg border border-garnet/15 text-[10px] text-garnet-light font-bold font-mono">
                      Смотреть
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

        </div>
      </div>

      {/* Director Core Data Correction Modal */}
      {showFlagModal && director && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-950/95 border border-zinc-900 rounded-2xl max-w-md w-full p-6 relative overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-garnet animate-pulse" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  Исправление биографии
                </h3>
              </div>
              <button 
                onClick={() => setShowFlagModal(false)}
                className="text-gray-400 hover:text-white text-sm font-mono cursor-pointer transition select-none focus:outline-none"
                disabled={correctingDirectorData}
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Заметили фактическую ошибку или историческую неточность в биографии режиссёра <strong className="text-white">«{director.name}»</strong>? 
                Опишите верные сведения в свободном формате, и ИИ проанализирует предложение и подготовит черновик изменений.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-2">
                  Описание проблемы или верные исторические данные
                </label>
                <textarea
                  value={flagDesc}
                  onChange={(e) => setFlagDesc(e.target.value)}
                  placeholder="Пример: Год рождения указан неверно — Кристофер Нолан родился в 1970 году, а не 1971. Также добавьте, что его дебютным фильмом был 'Преследование' (Following)."
                  className="w-full bg-zinc-900 text-gray-200 text-xs rounded-xl border border-zinc-850 focus:border-garnet/60 focus:outline-none p-3 h-28 resize-none leading-relaxed transition"
                  disabled={correctingDirectorData || !!flagSuccessMsg}
                />
              </div>

              {flagSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fade-in font-sans">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold block text-emerald-400">Предложение на модерации!</strong>
                    <span>ИИ проанализировал ваши правки и направил их на утверждение модераторам энциклопедии.</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fade-in font-sans">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold block">Ошибка корректировки</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-mono transition cursor-pointer"
                disabled={correctingDirectorData}
              >
                Отмена
              </button>
              
              {!flagSuccessMsg && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!flagDesc.trim()) return;
                    const ok = await correctDirectorBio(director.id, flagDesc);
                    if (ok) {
                      setFlagSuccessMsg("Обновлено!");
                      setFlagDesc("");
                      setShowSuccessToast(true);
                      
                      // Swifter modal close so users can admire the live toast & bio highlight animation in the section itself
                      setTimeout(() => {
                        setShowFlagModal(false);
                        setFlagSuccessMsg("");
                      }, 1200);

                      // Auto dismiss success toast after 8.5 seconds
                      setTimeout(() => {
                        setShowSuccessToast(false);
                      }, 8500);
                    }
                  }}
                  disabled={correctingDirectorData || !flagDesc.trim()}
                  className="px-4 py-2 bg-garnet hover:bg-garnet/80 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {correctingDirectorData ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-zinc-100 animate-pulse" />
                  )}
                  <span>{correctingDirectorData ? "Обработка..." : "Отправить"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
