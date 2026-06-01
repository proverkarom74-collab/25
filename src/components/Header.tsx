import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { 
  Search, Film, Tv, Award, User, LogIn, LogOut, Sparkles, AlertCircle, 
  Loader2, Filter, Clock, X, ChevronDown, ChevronUp, SlidersHorizontal, Globe, Calendar, Check, Compass,
  Flame, Skull, Heart, Wand2, Eye, Glasses, Smile
} from "lucide-react";
import { AuthModal } from "./AuthModal";

function getGenreIcon(genre: string) {
  const g = (genre || "").toLowerCase();
  if (g.includes("фантастик")) return Sparkles;
  if (g.includes("боевик")) return Flame;
  if (g.includes("триллер")) return Eye;
  if (g.includes("криминал") || g.includes("детектив")) return Glasses;
  if (g.includes("драма")) return Heart;
  if (g.includes("фэнтези")) return Wand2;
  if (g.includes("приключ")) return Compass;
  if (g.includes("комед")) return Smile;
  if (g.includes("аниме")) return Tv;
  return Film; // fallback
}

export function Header() {
  const { 
    user, 
    setPage, 
    searchQuery, 
    setSearchFilters, 
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
    generateNewMovie, 
    generatingMovie, 
    errorMsg, 
    logout,
    movies,
    theme,
    setTheme
  } = useStore();

  const ratedCount = movies ? movies.filter(m => m.ratingsCount > 0).length : 4;
  const displayCount = ratedCount || 4;

  // Find genre with the most reviews/ratings
  const genreRatings: { [genre: string]: number } = {};
  if (movies && movies.length > 0) {
    movies.forEach(movie => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach(genre => {
          genreRatings[genre] = (genreRatings[genre] || 0) + (movie.ratingsCount || 0);
        });
      }
    });
  }

  let topGenre = "";
  let maxRatings = -1;
  Object.entries(genreRatings).forEach(([genre, count]) => {
    if (count > maxRatings) {
      maxRatings = count;
      topGenre = genre;
    }
  });

  const GenreIcon = topGenre ? getGenreIcon(topGenre) : Film;

  const [inputVal, setInputVal] = useState(searchQuery);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [showMobileFiltersDropdown, setShowMobileFiltersDropdown] = useState(false);
  const [showAdvancedInHeader, setShowAdvancedInHeader] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genType, setGenType] = useState<"movie" | "tv" | "anime" | "short">("movie");

  // Search History dropdown state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showMobileHistoryDropdown, setShowMobileHistoryDropdown] = useState(false);
  
  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("last_search_queries");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
        setShowFiltersDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileHistoryDropdown(false);
        setShowMobileFiltersDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    let current: string[] = [];
    try {
      const raw = localStorage.getItem("last_search_queries");
      if (raw) {
        current = JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }
    
    if (!Array.isArray(current)) {
      current = [];
    }
    
    current = current.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    current.unshift(trimmed);
    current = current.slice(0, 5);
    
    try {
      localStorage.setItem("last_search_queries", JSON.stringify(current));
    } catch (e) {
      console.error(e);
    }
    
    setSearchHistory(current);
  };

  const deleteSearchQuery = (queryToDelete: string) => {
    const updated = searchHistory.filter(q => q !== queryToDelete);
    try {
      localStorage.setItem("last_search_queries", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setSearchHistory(updated);
  };

  const clearAllSearchQueries = () => {
    try {
      localStorage.removeItem("last_search_queries");
    } catch (e) {
      console.error(e);
    }
    setSearchHistory([]);
  };

  const handleSelectHistoryItem = (query: string) => {
    setInputVal(query);
    setSearchFilters(query, "all", "");
    setPage("search");
    saveSearchQuery(query);
    setShowHistoryDropdown(false);
    setShowMobileHistoryDropdown(false);
  };

  // Keep search inputs synchronized with global store changes
  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilters(inputVal, "all", "");
    setPage("search");
    saveSearchQuery(inputVal);
    setShowHistoryDropdown(false);
    setShowMobileHistoryDropdown(false);
    setShowFiltersDropdown(false);
    setShowMobileFiltersDropdown(false);
  };

  const handleSuggestAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTitle.trim()) return;
    const ok = await generateNewMovie(genTitle, genType);
    if (ok) {
      setShowGenerator(false);
      setGenTitle("");
    }
  };

  const triggerAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <header className={`sticky top-0 bg-[#121212]/95 border-b border-graphite-light backdrop-blur-md transition-all duration-150 ${(showAuth || showGenerator) ? "z-[9999]" : "z-50"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => {
            setSearchFilters("");
            setPage("home");
          }}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div 
            className="w-10 h-10 rounded-lg bg-garnet flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 group-hover:bg-garnet-light"
            title={topGenre ? `Самый оцениваемый жанр: ${topGenre} (${maxRatings} рецензий/оценок)` : `Оценено на сайте: ${displayCount}`}
          >
            <GenreIcon className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none transition-colors">
              25-й <span className="text-garnet font-black">Кадр</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
              Кино-Рецензии
            </p>
          </div>
        </div>

        {/* Dynamic Search Input Form */}
        <form ref={desktopSearchRef} onSubmit={handleSearchSubmit} className="flex-1 max-w-xl hidden md:flex items-center gap-2 relative">
          <div className="flex items-center bg-graphite border border-graphite-light rounded-full p-1 w-full focus-within:border-garnet focus-within:ring-1 focus-within:ring-garnet transition duration-150 relative">
            
            {/* Input text query */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Искать фильмы, сериалы, режиссеров..."
                value={inputVal}
                onFocus={() => {
                  setShowHistoryDropdown(true);
                  setShowFiltersDropdown(false);
                }}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-transparent py-2 pl-9 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
              />
              <button type="submit" className="absolute left-3 top-2.5 text-gray-500 hover:text-garnet transition cursor-pointer bg-transparent border-0">
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Search History Dropdown */}
              {showHistoryDropdown && searchHistory.length > 0 && (
                <div className="absolute top-11 left-0 right-0 bg-[#161616] border border-graphite-light/80 rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between px-2 pb-1.5 mb-1.5 border-b border-graphite-light/50">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-garnet" /> История поиска
                    </span>
                    <button 
                      type="button" 
                      onClick={clearAllSearchQueries}
                      className="text-[9px] font-mono text-gray-500 hover:text-white uppercase tracking-wider cursor-pointer bg-transparent border-0"
                    >
                      Очистить
                    </button>
                  </div>
                  <div className="space-y-0.5 max-h-52 overflow-y-auto">
                    {searchHistory.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between group rounded-lg hover:bg-white/5 transition"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectHistoryItem(item)}
                          className="flex-1 text-left px-2 py-1.5 text-xs text-gray-300 hover:text-white transition truncate flex items-center gap-2 cursor-pointer bg-transparent border-0"
                        >
                          <Clock className="w-3 h-3 text-gray-500 group-hover:text-gray-300 shrink-0" />
                          <span className="truncate">{item}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSearchQuery(item)}
                          className="p-1 text-gray-600 hover:text-red-500 transition mr-1 rounded cursor-pointer bg-transparent border-0"
                          title="Удалить из истории"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* "Фильтры" button on the right inside search bar container */}
            <button
              type="button"
              onClick={() => {
                setShowFiltersDropdown(!showFiltersDropdown);
                setShowHistoryDropdown(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 mr-1 cursor-pointer select-none border-0 ${
                showFiltersDropdown || (selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector)
                  ? "bg-garnet text-white shadow-md shadow-garnet/20"
                  : "bg-[#1a1a1a] border border-graphite-light text-gray-300 hover:text-white hover:bg-graphite-light"
              }`}
            >
              <Filter className={`w-3.5 h-3.5 ${showFiltersDropdown ? 'animate-pulse text-white' : 'text-gray-400'}`} />
              <span>Фильтры</span>
              {(selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector) && (
                <span className="ml-1 bg-white text-garnet text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[16px] text-center">
                  {selectedFormats.length + selectedGenres.length + (extraYear ? 1 : 0) + (extraCountry ? 1 : 0) + (extraDirector ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Elegant Floating Popover for Multi-select Filters */}
          {showFiltersDropdown && (
            <div className="absolute top-12 left-0 right-0 bg-[#161616] border border-graphite-light/90 rounded-2xl shadow-2xl p-4.5 z-50 animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto w-full">
              {/* Header title & Clear */}
              <div className="flex items-center justify-between border-b border-graphite-light/40 pb-2">
                <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-garnet" /> Параметры фильтрации
                </span>
                {(selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector) && (
                  <button
                    type="button"
                    onClick={() => {
                      resetAllFilters();
                      setPage("search");
                    }}
                    className="text-[10px] font-mono text-garnet-light hover:text-red-500 uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <X className="w-3 h-3" /> Сбросить все
                  </button>
                )}
              </div>

              {/* Formats Title & Grid */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 block pb-0.5">
                  Форматы:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Фильмы",
                    "Сериалы",
                    "Мини-сериалы",
                    "Мультфильмы",
                    "Аниме",
                    "Короткометражки",
                    "Документальное кино",
                    "ТВ-шоу / Ток-шоу"
                  ].map((fmt) => {
                    const isSelected = selectedFormats.includes(fmt);
                    return (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFormats(selectedFormats.filter(f => f !== fmt));
                          } else {
                            setSelectedFormats([...selectedFormats, fmt]);
                          }
                          setPage("search");
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs text-left transition cursor-pointer flex items-center justify-between bg-transparent ${
                          isSelected
                            ? "bg-garnet border-garnet text-white font-medium animate-fade-in"
                            : "border-graphite-light/20 text-gray-400 hover:text-white bg-[#1a1a1a]"
                        }`}
                      >
                        <span className="truncate">{fmt}</span>
                        {isSelected && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genres Wrap */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 block pb-0.5">
                  Жанры:
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Драма", "Комедия", "Триллер", "Ужасы", "Фантастика", "Фэнтези", "Боевик", 
                    "Приключения", "Криминал", "Детектив", "Мелодрама", "Военный", "Исторический", 
                    "Биография", "Спорт", "Мюзикл", "Нуар", "Вестерн"
                  ].map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(selectedGenres.filter(g => g !== genre));
                          } else {
                            setSelectedGenres([...selectedGenres, genre]);
                          }
                          setPage("search");
                        }}
                        className={`px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer bg-transparent ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500 text-amber-400 font-semibold"
                            : "border-graphite-light/20 text-gray-400 hover:text-white bg-[#1a1a1a]/80"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Block */}
              <div className="border-t border-graphite-light/40 pt-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInHeader(!showAdvancedInHeader)}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer bg-transparent border-0 text-gray-400 hover:text-white p-0"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Расширенные параметры:</span>
                  {showAdvancedInHeader ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>

                {showAdvancedInHeader && (
                  <div className="space-y-2.5 mt-2 animate-fade-in">
                    <div>
                      <label className="text-[9px] text-gray-500 font-mono uppercase block mb-1">Год производства:</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Например, 2014"
                          value={extraYear}
                          onChange={(e) => {
                            setExtraYear(e.target.value);
                            setPage("search");
                          }}
                          className="w-full bg-[#1c1c1c] border border-graphite-light/30 rounded-lg text-xs py-1.5 pl-8 pr-7 focus:outline-none focus:border-garnet text-gray-200"
                        />
                        {extraYear && (
                          <button type="button" onClick={() => { setExtraYear(""); setPage("search"); }} className="absolute right-2 top-2 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-500 font-mono uppercase block mb-1">Страна производства:</label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Например, США, СССР"
                          value={extraCountry}
                          onChange={(e) => {
                            setExtraCountry(e.target.value);
                            setPage("search");
                          }}
                          className="w-full bg-[#1c1c1c] border border-graphite-light/30 rounded-lg text-xs py-1.5 pl-8 pr-7 focus:outline-none focus:border-garnet text-gray-200"
                        />
                        {extraCountry && (
                          <button type="button" onClick={() => { setExtraCountry(""); setPage("search"); }} className="absolute right-2 top-2 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-500 font-mono uppercase block mb-1">Режиссёр:</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Например, Кристофер Нолан"
                          value={extraDirector}
                          onChange={(e) => {
                            setExtraDirector(e.target.value);
                            setPage("search");
                          }}
                          className="w-full bg-[#1c1c1c] border border-graphite-light/30 rounded-lg text-xs py-1.5 pl-8 pr-7 focus:outline-none focus:border-garnet text-gray-200"
                        />
                        {extraDirector && (
                          <button type="button" onClick={() => { setExtraDirector(""); setPage("search"); }} className="absolute right-2 top-2 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button inside popover */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#1c1c1c] hover:bg-garnet border border-graphite-light/40 hover:border-garnet text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition select-none flex items-center justify-center gap-1 shadow-md"
                >
                  <span>Закрыть фильтрацию</span>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Action Cues & Auth */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button 
            type="button"
            onClick={() => {
              setPage("recommendations");
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-300 hover:text-rose-500 transition cursor-pointer"
          >
            <Compass className="w-4 h-4 text-rose-500" />
            <span className="hidden xs:inline">Что посмотреть?</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setSearchFilters("");
              setPage("tops");
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-300 hover:text-garnet transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-garnet" />
            <span className="hidden xs:inline">Топы</span>
          </button>

          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 bg-graphite border border-garnet/30 hover:border-garnet/80 text-xs sm:text-sm text-gray-200 px-3 py-1.5 rounded-full transition cursor-pointer hover:bg-garnet/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-garnet animate-pulse" />
            <span className="hidden sm:inline">ИИ Поиск-Создание</span>
            <span className="sm:hidden">ИИ Создать</span>
          </button>

          {/* Theme segmented selector */}
          <div className="flex bg-graphite-dark border border-graphite-light/60 rounded-full p-0.5 shrink-0 select-none">
            {[
              { id: "classic", label: "Классика" },
              { id: "light", label: "Светлая" }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`text-[9.5px] font-mono leading-none tracking-tight px-2.5 py-1.5 rounded-full cursor-pointer transition-all ${
                  theme === t.id 
                    ? "bg-garnet text-white font-extrabold shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-graphite-light hidden xs:block" />

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage("profile", "", user.username)}
                className="flex items-center gap-2 hover:opacity-85 transition border border-graphite-light rounded-full pl-1.5 pr-3 py-1 bg-graphite text-xs sm:text-sm"
              >
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName} 
                  className="w-5 sm:w-6 h-5 sm:h-6 rounded-full object-cover border border-garnet/50"
                  referrerPolicy="no-referrer"
                />
                <span className="text-gray-200 font-medium max-w-[100px] truncate">
                  {user.displayName}
                </span>
              </button>
              <button
                onClick={() => logout()}
                title="Выйти из аккаунта"
                className="p-1.5 rounded-full bg-graphite hover:bg-garnet/20 hover:text-garnet text-gray-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => triggerAuth("login")}
                className="text-xs sm:text-sm text-gray-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded transition font-medium cursor-pointer"
              >
                Войти
              </button>
              <button
                onClick={() => triggerAuth("register")}
                className="bg-garnet hover:bg-garnet-light text-xs sm:text-sm text-white px-3 sm:px-4 py-1.5 rounded font-bold shadow-md transition cursor-pointer"
              >
                Регистрация
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Small Screen Search Input */}
      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 w-full relative">
          <div ref={mobileSearchRef} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Искать фильмы, сериалы..."
                value={inputVal}
                onFocus={() => {
                  setShowMobileHistoryDropdown(true);
                  setShowMobileFiltersDropdown(false);
                }}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-graphite border border-graphite-light rounded-full py-1.5 pl-9 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-garnet transition"
              />
              <button type="submit" className="absolute left-3 top-2.5 text-gray-500 hover:text-garnet transition">
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Mobile Search History Dropdown */}
              {showMobileHistoryDropdown && searchHistory.length > 0 && (
                <div className="absolute top-11 left-0 right-0 bg-[#161616] border border-graphite-light rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between px-2 pb-1.5 mb-1.5 border-b border-graphite-light/50">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-garnet" /> История поиска
                    </span>
                    <button 
                      type="button" 
                      onClick={clearAllSearchQueries}
                      className="text-[9px] font-mono text-gray-500 hover:text-white uppercase tracking-wider cursor-pointer bg-transparent border-0"
                    >
                      Очистить
                    </button>
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {searchHistory.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between group rounded-lg hover:bg-white/5 transition"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectHistoryItem(item)}
                          className="flex-1 text-left px-2 py-1.5 text-xs text-gray-300 hover:text-white transition truncate flex items-center gap-2 cursor-pointer bg-transparent border-0"
                        >
                          <Clock className="w-3 h-3 text-gray-500 group-hover:text-gray-300 shrink-0" />
                          <span className="truncate">{item}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSearchQuery(item)}
                          className="p-1.5 text-gray-600 hover:text-red-500 transition mr-1 rounded cursor-pointer bg-transparent border-0"
                          title="Удалить из истории"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Filters Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowMobileFiltersDropdown(!showMobileFiltersDropdown);
                setShowMobileHistoryDropdown(false);
              }}
              className={`p-2.5 rounded-full border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-transparent ${
                showMobileFiltersDropdown || (selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector)
                  ? "bg-garnet border-garnet text-white"
                  : "bg-graphite border-graphite-light text-gray-300 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {(selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector) && (
                <span className="bg-white text-garnet text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[14px] text-center">
                  {selectedFormats.length + selectedGenres.length + (extraYear ? 1 : 0) + (extraCountry ? 1 : 0) + (extraDirector ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filters Dropdown panel */}
          {showMobileFiltersDropdown && (
            <div className="absolute top-12 left-0 right-0 bg-[#161616] border border-graphite-light/90 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in space-y-4 max-h-[70vh] overflow-y-auto w-full">
              <div className="flex items-center justify-between border-b border-graphite-light/40 pb-2">
                <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-garnet" /> Фильтры
                </span>
                {(selectedFormats.length > 0 || selectedGenres.length > 0 || extraYear || extraCountry || extraDirector) && (
                  <button
                    type="button"
                    onClick={() => {
                      resetAllFilters();
                      setPage("search");
                    }}
                    className="text-[10px] font-mono text-garnet-light hover:text-red-500 uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <X className="w-3 h-3" /> Сбросить все
                  </button>
                )}
              </div>

              {/* Formats Group */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-400 font-mono uppercase font-bold">Форматы:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Фильмы",
                    "Сериалы",
                    "Мини-сериалы",
                    "Мультфильмы",
                    "Аниме",
                    "Короткометражки",
                    "Документальное кино",
                    "ТВ-шоу / Ток-шоу"
                  ].map((fmt) => {
                    const isSelected = selectedFormats.includes(fmt);
                    return (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFormats(selectedFormats.filter(f => f !== fmt));
                          } else {
                            setSelectedFormats([...selectedFormats, fmt]);
                          }
                          setPage("search");
                        }}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] text-left transition cursor-pointer flex items-center justify-between bg-transparent ${
                          isSelected
                            ? "bg-garnet border-garnet text-white font-medium"
                            : "border-graphite-light/20 text-gray-200 bg-[#1f1f1f]"
                        }`}
                      >
                        <span className="truncate">{fmt}</span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genres Group */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-400 font-mono uppercase font-bold">Жанры:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Драма", "Комедия", "Триллер", "Ужасы", "Фантастика", "Фэнтези", "Боевик", 
                    "Приключения", "Криминал", "Детектив", "Мелодрама", "Военный", "Исторический", 
                    "Биография", "Спорт", "Мюзикл", "Нуар", "Вестерн"
                  ].map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(selectedGenres.filter(g => g !== genre));
                          } else {
                            setSelectedGenres([...selectedGenres, genre]);
                          }
                          setPage("search");
                        }}
                        className={`px-2.5 py-1 rounded-md border text-[10px] transition cursor-pointer bg-transparent ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500 text-amber-400 font-semibold"
                            : "border-graphite-light/10 text-gray-300 bg-[#1f1f1f]"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Block */}
              <div className="border-t border-graphite-light/20 pt-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInHeader(!showAdvancedInHeader)}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer bg-transparent border-0 text-gray-400 hover:text-white p-0"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Расширенный поиск:</span>
                  {showAdvancedInHeader ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>

                {showAdvancedInHeader && (
                  <div className="space-y-2.5 mt-2.5 animate-fade-in pb-1">
                    <div>
                      <label className="text-[9px] text-gray-500 font-mono uppercase block mb-1 font-mono">Год:</label>
                      <div className="relative font-sans">
                        <Calendar className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Например, 2014"
                          value={extraYear}
                          onChange={(e) => { setExtraYear(e.target.value); setPage("search"); }}
                          className="w-full bg-[#1c1c1c] border border-graphite-light/30 rounded-lg text-xs py-1.5 pl-8 pr-7 focus:outline-none focus:border-garnet text-gray-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 font-mono uppercase block mb-1 font-mono">Страна:</label>
                      <div className="relative font-sans">
                        <Globe className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Например, США"
                          value={extraCountry}
                          onChange={(e) => { setExtraCountry(e.target.value); setPage("search"); }}
                          className="w-full bg-[#1c1c1c] border border-graphite-light/30 rounded-lg text-xs py-1.5 pl-8 pr-7 focus:outline-none focus:border-garnet text-gray-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 font-mono uppercase block mb-1 font-mono">Режиссёр:</label>
                      <div className="relative font-sans">
                        <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Например, Нолан"
                          value={extraDirector}
                          onChange={(e) => { setExtraDirector(e.target.value); setPage("search"); }}
                          className="w-full bg-[#1c1c1c] border border-graphite-light/30 rounded-lg text-xs py-1.5 pl-8 pr-7 focus:outline-none focus:border-garnet text-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#1c1c1c] hover:bg-[#252525] border border-graphite-light/30 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow-md"
                >
                  <span>Показать результаты</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <AuthModal 
          mode={authMode} 
          setMode={setAuthMode} 
          onClose={() => setShowAuth(false)} 
        />
      )}

      {/* Dynamic AI Generator Panel Drawer */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-graphite border border-graphite-light rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden my-auto">
            {/* Aesthetic design top garnish */}
            <div className="h-1 bg-gradient-to-r from-garnet to-garnet-light w-full" />
            
            <button 
              type="button"
              onClick={() => setShowGenerator(false)}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200 cursor-pointer z-10"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-garnet" />
                <h3 className="text-lg font-bold text-white">ИИ Поиск и Автогенерация</h3>
              </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Введите название любого фильма, сериала, аниме или короткометражки в мире. 
              Наш ИИ-киновед мгновенно расшифрует данные, воссоздаст детальные оценки категорий и добавит произведение в единую базу нашего портала!
            </p>

            <form onSubmit={handleSuggestAndGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Название на русском или языке оригинала
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Бойцовский клуб, Евангелион..."
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="w-full bg-graphite-dark border border-graphite-light text-sm text-gray-200 rounded-lg p-3 placeholder-gray-600 focus:outline-none focus:border-garnet focus:ring-1 focus:ring-garnet"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Тип произведения
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "movie", label: "Полный метр", icon: Film },
                    { value: "tv", label: "Телесериал", icon: Tv },
                    { value: "anime", label: "Аниме", icon: Sparkles },
                    { value: "short", label: "Короткий метр", icon: Film }
                  ].map((t) => {
                    const SelectedIcon = t.icon;
                    return (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => setGenType(t.value as any)}
                        className={`flex items-center gap-1.5 justify-center py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                          genType === t.value 
                            ? "border-garnet bg-garnet text-white font-bold" 
                            : "border-graphite-light hover:border-gray-500 text-gray-300"
                        }`}
                      >
                        <SelectedIcon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="bg-garnet/20 border border-garnet/50 p-3 rounded-lg flex items-start gap-2 text-xs text-gray-200">
                  <AlertCircle className="w-4 h-4 text-garnet shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={generatingMovie || !genTitle.trim()}
                className="w-full bg-garnet hover:bg-garnet-light disabled:bg-graphite-light text-white font-bold text-sm py-3 rounded-lg shadow-lg shadow-garnet/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {generatingMovie ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Синхронизация киновселенной...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Найти и Добавить Карточку</span>
                  </>
                )}
              </button>
            </form>
          </div>
          </div>
        </div>
      )}
    </header>
  );
}
