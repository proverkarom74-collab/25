import { useState, useEffect } from "react";
import { MovieTitle } from "../types";
import { useStore } from "../store";
import { Star, Play, ChevronLeft, ChevronRight, Sparkles, Award, Eye, Check } from "lucide-react";
import { RatingBadge } from "./RatingBadge";


interface MovieSliderProps {
  movies: MovieTitle[];
}

export function MovieSlider({ movies }: MovieSliderProps) {
  const { setPage, user, toggleWatchlist, userReviews } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.min(movies.length, 3));
    }, 8000);
    return () => clearInterval(interval);
  }, [movies]);

  if (movies.length === 0) return null;

  // We will display top 3 movies in the slider
  const sliderMovies = movies.slice(0, 3);
  const activeMovie = sliderMovies[activeIndex];

  const isInWatchlist = activeMovie && user ? user.watchlist.includes(activeMovie.slug) : false;
  const isWatched = activeMovie && user && userReviews ? userReviews.some(r => r.titleSlug === activeMovie.slug) : false;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % sliderMovies.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + sliderMovies.length) % sliderMovies.length);
  };

  if (!activeMovie) return null;

  return (
    <div className="relative w-full aspect-[2.3/1] min-h-[320px] md:min-h-[420px] rounded-2xl overflow-hidden border border-graphite-light shadow-2xl group">
      {/* Backdrop background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-[#121212]/40 z-10" />
        <img
          src={activeMovie.backdropUrl}
          alt={activeMovie.title}
          className="w-full h-full object-cover object-center scale-100 group-hover:scale-102 transition-transform duration-10000 ease-out"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="bg-garnet/20 border border-garnet/50 rounded-full px-3 py-1 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-garnet-light uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Выбор редакции "25 Кадра"
          </div>
          <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-400 border border-amber-400/30 uppercase tracking-wider font-mono">
            <Award className="w-3.5 h-3.5" />
            Топ {activeIndex + 1}
          </div>
          {isWatched && (
            <div className="bg-emerald-500/20 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono animate-fade-in select-none">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Просмотрено
            </div>
          )}
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase">
          {activeMovie.title}
        </h2>

        <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1.5 flex items-center gap-2">
          <span>{activeMovie.originalTitle || activeMovie.title}</span>
          <span>•</span>
          <span>{activeMovie.year}</span>
          <span>•</span>
          <RatingBadge rating={activeMovie.ratingAverage} size="medium" forceScale10={true} showLabel={true} />
        </p>

        <p className="text-xs sm:text-sm text-gray-300 mt-4 leading-relaxed line-clamp-3 font-medium max-w-xl">
          {activeMovie.overview}
        </p>

        {/* Action button */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setPage("title", activeMovie.slug)}
            className="bg-garnet hover:bg-garnet-light text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg shadow-garnet/35 transition flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            Подробнее и рецензии
          </button>
          
          {user && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(activeMovie.slug);
              }}
              className={`font-semibold text-xs sm:text-sm py-3 px-5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 border select-none ${
                isInWatchlist
                  ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-black/40 border-white/10 text-gray-300 hover:text-white hover:bg-black/60"
              }`}
            >
              {isInWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
              {isInWatchlist ? "В списке ожидания" : "Добавить в список ожидания"}
            </button>
          )}
          
          <div className="flex items-center gap-1 sm:ml-2">
            {sliderMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                  activeIndex === idx ? "w-6 bg-garnet" : "w-2 bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Slide Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-garnet text-white border border-white/10 opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer hidden sm:block"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-garnet text-white border border-white/10 opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer hidden sm:block"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
