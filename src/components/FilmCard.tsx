import React from "react";
import { MovieTitle, formatMovieDuration } from "../types";
import { useStore } from "../store";
import { Star, Eye, Calendar, Clock } from "lucide-react";
import { RatingBadge } from "./RatingBadge";
import { getRatingColor } from "../lib/ratingUtils";

interface FilmCardProps {
  movie: MovieTitle;
  key?: any;
}

export function FilmCard({ movie }: FilmCardProps) {
  const { setPage, user, toggleWatchlist, guestWatchlist } = useStore();

  const isWatched = user ? user.watchlist.includes(movie.slug) : (guestWatchlist || []).includes(movie.slug);

  const handleCardClick = () => {
    setPage("title", movie.slug);
  };

  return (
    <div 
      className="group bg-graphite rounded-xl overflow-hidden border border-graphite-light hover:border-garnet/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full card-glow cursor-pointer relative"
    >
      {/* Poster image container */}
      <div 
        onClick={handleCardClick}
        className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-t from-black/80 to-transparent"
      >
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Rating overlay badge */}
        <div className="absolute top-3 left-3 flex gap-1.5 items-center">
          <RatingBadge rating={movie.ratingAverage} size="small" forceScale10={true} />
          
          <div className="bg-black/60 backdrop-blur-md text-[10px] uppercase font-mono tracking-wider font-extrabold px-2 py-1 rounded-md border border-white/10 text-gray-300">
            {movie.type === "movie" ? "Полный метр" : movie.type === "tv" ? "Сериал" : movie.type === "anime" ? "Аниме" : "Короткометражка"}
          </div>
        </div>


        {/* Watchlist toggle top right hover button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWatchlist(movie.slug);
          }}
          className={`absolute top-3 right-3 p-2 rounded-md backdrop-blur-md border transition cursor-pointer z-10 ${
            isWatched 
              ? "bg-garnet border-garnet text-white" 
              : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
          }`}
          title={isWatched ? "В списке ожидания" : "В закладки"}
        >
          <Eye className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Backdrop visual hover trigger */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <span className="bg-garnet hover:bg-garnet-light text-white font-bold text-xs py-2 px-4 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Оценить произведение
          </span>
        </div>
      </div>

      {/* Content wrapper */}
      <div onClick={handleCardClick} className="p-4 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-garnet transition truncate">
          {movie.title}
        </h3>
        
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
          <span className="truncate max-w-[150px] font-mono">
            {movie.originalTitle || movie.title}
          </span>
          <span>•</span>
          <span className="font-mono">{movie.year}</span>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1 mt-3">
          {movie.genres.slice(0, 3).map((g, idx) => (
            <span 
              key={idx}
              className="text-[10px] text-gray-400 bg-graph-light border border-graphite-light px-2 py-0.5 rounded font-mono"
            >
              {g}
            </span>
          ))}
        </div>

        {/* External ratings row (minimalistic version) */}
        {movie.externalRatings && (movie.externalRatings.kinopoisk || movie.externalRatings.imdb) ? (
          <div className="flex items-center gap-2 mt-3 mb-1.5 h-5 select-none text-[10px]">
            {movie.externalRatings.kinopoisk && (
              <div 
                className="flex items-center gap-1.5 border px-1.5 py-0.5 rounded font-mono font-bold" 
                title="Рейтинг Кинопоиск"
                style={{
                  color: getRatingColor(movie.externalRatings.kinopoisk.rating),
                  borderColor: `${getRatingColor(movie.externalRatings.kinopoisk.rating)}35`,
                  backgroundColor: `${getRatingColor(movie.externalRatings.kinopoisk.rating)}12`
                }}
              >
                <span className="text-[9px] opacity-65 select-none uppercase font-extrabold">КП</span>
                <span>{movie.externalRatings.kinopoisk.rating.toFixed(1)}</span>
              </div>
            )}
            {movie.externalRatings.imdb && (
              <div 
                className="flex items-center gap-1.5 border px-1.5 py-0.5 rounded font-mono font-bold" 
                title="Рейтинг IMDb"
                style={{
                  color: getRatingColor(movie.externalRatings.imdb.rating),
                  borderColor: `${getRatingColor(movie.externalRatings.imdb.rating)}35`,
                  backgroundColor: `${getRatingColor(movie.externalRatings.imdb.rating)}12`
                }}
              >
                <span className="text-[9px] opacity-65 select-none uppercase font-extrabold">IMDb</span>
                <span>{movie.externalRatings.imdb.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 mb-1.5 h-5" />
        )}

        {/* Bottom ratings count */}
        <div className="mt-auto pt-4 border-t border-graphite-light flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1" title="Хронометраж">
            <Clock className="w-3 h-3" />
            {formatMovieDuration(movie)}
          </span>
          <span className="font-mono">
            {movie.ratingsCount} оценок
          </span>
        </div>
      </div>
    </div>
  );
}
