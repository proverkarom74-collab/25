import React, { useState } from "react";
import { useStore } from "../store";
import { 
  Sparkles, Loader2, Play, CircleDot, Clapperboard, Clock, Award, 
  HelpCircle, RefreshCw, Eye, EyeOff, Search, Compass, ListFilter 
} from "lucide-react";
import { MovieTitle } from "../types";

const MOODS = [
  { id: "light", label: "Хочется лёгкого и весёлого", icon: "🍿" },
  { id: "sad", label: "Грустно / меланхолично", icon: "🌧️" },
  { id: "action", label: "Нужен мощный экшен", icon: "💥" },
  { id: "brain", label: "Мозголомка / сложный сюжет", icon: "🧩" },
  { id: "atmosphere", label: "Атмосферное и красивое кино", icon: "✨" },
  { id: "horror", label: "Ужасы / напряжение", icon: "👻" },
  { id: "motivation", label: "Вдохновение / мотивация", icon: "⛰️" },
  { id: "relax", label: "Расслабиться и отдохнуть", icon: "🌴" },
  { id: "nostalgia", label: "Ностальгия", icon: "📼" },
  { id: "unusual", label: "Что-то новое и необычное", icon: "🪐" }
];

const DURATIONS = [
  { id: "any", label: "Любая длительность" },
  { id: "short", label: "Короткометражка / До 90 мин" },
  { id: "medium", label: "Среднеметражные фильмы (1.5-2 ч)" },
  { id: "long", label: "Эпическое кино (Более 2 ч)" }
];

interface RecommendedItem {
  title: string;
  originalTitle: string;
  slug: string;
  type: string;
  genres: string[];
  year: number;
  duration: string;
  country: string;
  director: string;
  cast: string[];
  overview: string;
  explanation: string;
  isLocal: boolean;
  posterUrl?: string;
  backdropUrl?: string;
}

export function Recommendations() {
  const { user, movies, setPage } = useStore();

  const [selectedMood, setSelectedMood] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("quick_mood_select");
      if (stored) {
        return stored;
      }
    }
    return "";
  });
  const [selectedDuration, setSelectedDuration] = useState<string>("any");
  const [preferredGenre, setPreferredGenre] = useState<string>("");
  const [exclusions, setExclusions] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedItem[] | null>(null);
  
  // Tracking movies the user marked as "Already watched" during this feed session
  const [alreadyWatchedIds, setAlreadyWatchedIds] = useState<string[]>([]);
  const [generatingMovieSlug, setGeneratingMovieSlug] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedMood) {
      localStorage.removeItem("quick_mood_select");
      getRecommendations();
    }
  }, []);

  const getRecommendations = async () => {
    if (!selectedMood) {
      setError("Пожалуйста, сначала выберите настроение.");
      return;
    }

    setLoading(true);
    setError(null);
    setAlreadyWatchedIds([]); // reset temporary watch flags

    try {
      const res = await fetch("/api/gemini/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          duration: selectedDuration,
          preferredGenre,
          exclusions,
          userId: user?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || "Не удалось загрузить рекомендации.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Ошибка соединения с системой ИИ-рекомендаций. Пожалуйста, проверьте API-ключи.");
    } finally {
      setLoading(false);
    }
  };

  // Mark recommendation as already watched: hide it and persist watcher flags
  const handleAlreadyWatched = async (index: number, item: RecommendedItem) => {
    // Add to session watched exclusions list
    setAlreadyWatchedIds(prev => [...prev, item.title + item.year]);

    // If logged in, we can add this movie directly to their watchlist backend database as reviewed or watched,
    // or add it in a secure background request, but local hiding is instantaneous and beautiful.
    if (user && item.slug) {
      try {
        await fetch(`/api/users/${user.id}/watchlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieSlug: item.slug })
        });
      } catch (e) {
        console.error("Error saving already watched item to database watchlist: ", e);
      }
    }
  };

  // Navigates or generates-then-navigates when clicking a film card
  const handleOpenRecommendation = async (item: RecommendedItem) => {
    if (item.slug) {
      // Check if it already exists in our database of movies
      const exist = movies.some(m => m.slug === item.slug);
      if (exist) {
        setPage("title", item.slug);
        return;
      }
    }

    // Dynamic creator fallback! If the recommended movie isn't pre-seeded, our Gemini endpoint will generate details for it and append to the catalog seamlessly!
    setGeneratingMovieSlug(item.title);
    try {
      const queryStr = item.originalTitle && item.originalTitle !== item.title 
        ? `${item.title} (${item.originalTitle}) ${item.year}` 
        : `${item.title} ${item.year}`;
        
      const res = await fetch("/api/gemini/generate-movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryStr, type: item.type, year: item.year })
      });

      const data = await res.json();
      if (res.ok && data.success && data.movie?.slug) {
        setPage("title", data.movie.slug);
      } else {
        // Fallback manually redirect if generation server took too long
        alert(`Перенаправляем! Карточка для фильма ${item.title} сейчас синхронизируется в базе.`);
        setPage("home");
      }
    } catch (e) {
      console.error(e);
      setPage("home");
    } finally {
      setGeneratingMovieSlug(null);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Intro hero banner */}
      <div className="bg-graphite border border-graphite-light rounded-xl p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-3 flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 bg-garnet/10 border border-garnet/30 text-garnet-light text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full font-bold">
            <Sparkles className="w-3.5 h-3.5 text-garnet animate-spin" />
            <span>Инструмент персонального выбора ИИ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
            Что посмотреть сегодня?
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed max-w-2xl font-sans">
            Передайте ваши сиюминутные эмоции нашему куратору. Мы сопоставим ваше душевное состояние, тайминг и жанровые фильтры, чтобы найти редкие сокровища кинематографа.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 items-center text-4xl">
          🎬🍿📽️
        </div>
        {/* Glow backdrop decorator */}
        <div className="absolute top-2 right-2 w-48 h-48 bg-garnet/5 rounded-full blur-3xl -z-10" />
      </div>

      {error && (
        <div className="bg-garnet/10 border border-garnet/30 p-4 rounded-lg text-xs text-garnet-light font-sans max-w-3xl">
          ⚠️ {error}
        </div>
      )}

      {/* Main layout divide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Preferences selector block (Left Panel) */}
        <div className="bg-[#101015] border border-graphite-light/70 p-5 sm:p-6 rounded-xl h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <ListFilter className="w-4 h-4 text-garnet" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest font-mono text-white">Калибровка вкуса</h3>
          </div>

          {/* 1. Selecting the mood */}
          <div className="space-y-3">
            <label className="text-[10px] font-extrabold uppercase font-mono text-gray-400 tracking-wider flex items-center justify-between">
              <span>Выберите настроение:</span>
              {selectedMood && <span className="text-garnet">✓ выбрано</span>}
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-1 gap-2">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMood(m.label);
                    setError(null);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-sans text-left transition flex items-center gap-2.5 cursor-pointer select-none ${
                    selectedMood === m.label
                      ? "bg-garnet border-garnet text-white font-bold"
                      : "bg-graphite-dark/40 border-graphite-light/70 text-gray-300 hover:border-garnet/60 hover:text-white"
                  }`}
                >
                  <span className="text-base leading-none">{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Optional Duration Slider/Buttons */}
          <div className="space-y-2.5 pt-2">
            <label className="text-[10px] font-extrabold uppercase font-mono text-gray-400 tracking-wider">Максимальная длительность:</label>
            <div className="space-y-2">
              {DURATIONS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDuration(d.id)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono text-left transition flex justify-between items-center cursor-pointer ${
                    selectedDuration === d.id
                      ? "bg-purple-800/10 border-purple-600 text-white font-extrabold"
                      : "bg-graphite-dark/30 border-graphite-light/40 text-gray-400 hover:border-purple-600/50"
                  }`}
                >
                  <span>{d.label}</span>
                  <input 
                    type="radio" 
                    checked={selectedDuration === d.id}
                    onChange={() => setSelectedDuration(d.id)}
                    className="accent-purple-600 w-3 h-3 pointer-events-none" 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 3. Favorite genre query tags */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase font-mono text-gray-400 tracking-wider">Предпочитаемый жанр (опционально):</label>
            <div className="relative">
              <Compass className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Напр. Фантастика, Комедия..."
                value={preferredGenre}
                onChange={(e) => setPreferredGenre(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-graphite-light/65 rounded-lg text-xs py-2 px-8.5 focus:outline-none focus:border-garnet text-gray-200"
              />
            </div>
          </div>

          {/* 4. Genre exclusions */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase font-mono text-gray-400 tracking-wider">Исключить жанры/темы (опционально):</label>
            <div className="relative">
              <EyeOff className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Напр. Ужасы, Кровавый фильм..."
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-graphite-light/65 rounded-lg text-xs py-2 px-8.5 focus:outline-none focus:border-garnet text-gray-200"
              />
            </div>
          </div>

          {/* Request Button */}
          <button
            onClick={getRecommendations}
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-xl font-mono uppercase tracking-widest font-black text-xs transition-all shadow-md transform flex items-center justify-center gap-2 ${
              loading 
                ? "bg-graphite text-gray-500 border border-graphite-light cursor-not-allowed" 
                : "bg-garnet hover:bg-garnet-light text-white cursor-pointer hover:scale-101"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>ИИ выбирает...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Найти фильмы!</span>
              </>
            )}
          </button>
        </div>

        {/* Results Showcase Area (Right Panel) */}
        <div className="lg:col-span-2 space-y-6">
          
          {loading && (
            <div className="bg-graphite border border-graphite-light py-24 text-center rounded-xl space-y-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-garnet animate-spin mx-auto" />
              <div className="space-y-1 block max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-gray-200 font-mono">Консультируемся с ИИ-киноассистентом...</h4>
                <p className="text-[10px] text-gray-500 font-mono leading-relaxed px-4">
                  Сверяем каталог картины с базой ценителей, проверяем хронометраж и ищем идеальный психологический резонанс.
                </p>
              </div>
            </div>
          )}

          {generatingMovieSlug && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-graphite p-6 rounded-xl border border-graphite-light max-w-sm w-full text-center space-y-4">
                <Loader2 className="w-10 h-10 text-garnet animate-spin mx-auto" />
                <h4 className="text-xs font-bold text-white">Генерируем энциклопедию фильма...</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                  Загружаем подробную рецензию, операторские стили, актерский состав и Unsplash-афиши для: "{generatingMovieSlug}"
                </p>
              </div>
            </div>
          )}

          {!recommendations && !loading && (
            <div className="bg-graphite/40 border border-graphite-light/50 py-16 text-center rounded-xl space-y-4 flex flex-col items-center">
              <Clapperboard className="w-12 h-12 text-gray-600 animate-pulse" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-gray-400 font-mono">Рекомендательный фид пуст</h4>
                <p className="text-[11px] text-gray-500 font-sans leading-relaxed px-6">
                  Выберите слева настроение и запустите ИИ-генератор, чтобы наполнить ленту самыми сочными кинорейтингами.
                </p>
              </div>
            </div>
          )}

          {recommendations && !loading && (
            <div className="space-y-6">
              
              <div className="flex border-b border-graphite-light pb-3 justify-between items-center bg-graphite-dark p-3.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span className="text-xs font-mono font-bold text-white">Рекомендации под настроение:</span>
                </div>
                
                <button
                  onClick={getRecommendations}
                  className="bg-graphite-dark text-gray-300 hover:text-white border border-graphite-light hover:border-gray-500 rounded px-2.5 py-1 text-[10px] font-mono hover:bg-black/40 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Обновить рекомендации</span>
                </button>
              </div>

              {/* Lists of film cards returned by Gemini */}
              <div className="space-y-6">
                {recommendations.map((item, idx) => {
                  const isWatched = alreadyWatchedIds.includes(item.title + item.year);
                  if (isWatched) {
                    return (
                      <div 
                        key={idx} 
                        className="bg-graphite/30 border border-graphite-light/20 p-4 rounded-xl text-xs text-gray-500 font-mono flex items-center gap-3 animate-fade-in"
                      >
                        <EyeOff className="w-4 h-4 text-gray-600" />
                        <span>Вы скрыли фильм <strong>«{item.title}»</strong> из списка (помечен просмотренным).</span>
                      </div>
                    );
                  }

                  // Find local matched item if any
                  const localMatch = movies.find(m => m.slug === item.slug);
                  
                  return (
                    <div 
                      key={idx}
                      className="bg-graphite border border-graphite-light/80 rounded-xl overflow-hidden shadow-xl hover:border-garnet/35 transition-all duration-300 flex flex-col md:flex-row group animate-entry hover:shadow-2xl"
                    >
                      {/* Left: Film Poster backdrop */}
                      <div className="w-full md:w-36 h-48 md:h-auto shrink-0 relative bg-black">
                        <img 
                          src={item.posterUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black md:from-transparent md:bg-gradient-to-r md:to-graphite/10 to-transparent pointer-events-none" />
                        {localMatch && (
                          <div className="absolute top-2 left-2 bg-garnet text-white font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shadow">
                            В каталоге
                          </div>
                        )}
                      </div>

                      {/* Right: details body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 justify-between">
                            <h4 className="text-base font-extrabold text-white leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-mono text-gray-400 bg-graphite-dark px-2 py-0.5 rounded border border-graphite-light">
                              {item.year}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 font-mono">
                            {item.originalTitle || item.title} • {item.country} • {item.duration}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {item.genres.map((g, gi) => (
                              <span key={gi} className="text-[9px] text-gray-400 bg-graphite-dark px-1.5 py-0.5 rounded border border-graphite-light font-mono">
                                {g}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs text-gray-400 font-sans leading-relaxed pt-2 line-clamp-3">
                            {item.overview}
                          </p>

                          {/* Customized mood explanation block */}
                          <div className="bg-[#1b1512] border-l-2 border-garnet p-3 rounded-r-lg mt-3">
                            <p className="text-[11px] italic text-rose-300 leading-relaxed font-sans">
                              ✨ {item.explanation}
                            </p>
                          </div>
                        </div>

                        {/* Recommendation controls actions footer */}
                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-graphite-light/40">
                          <button
                            onClick={() => handleAlreadyWatched(idx, item)}
                            className="bg-transparent hover:text-gray-200 text-gray-500 text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition cursor-pointer select-none border border-graphite-light/50 hover:border-gray-500 py-1 px-2.5 rounded-lg"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Я уже видел</span>
                          </button>

                          <button
                            onClick={() => handleOpenRecommendation(item)}
                            className="bg-gradient-to-r from-garnet to-purple-900 border-0 hover:from-garnet hover:to-purple-800 text-white font-mono text-[10px] uppercase font-black px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer transform hover:scale-101 shadow-md"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Смотреть карточку</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
