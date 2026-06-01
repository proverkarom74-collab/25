import React, { useState } from "react";
import { useStore } from "../store";
import { ExternalTitleRatings } from "../types";
import { RefreshCw, Check, AlertCircle, ExternalLink } from "lucide-react";
import { getRatingColor, getMetacriticColor, getRottenTomatoesColor } from "../lib/ratingUtils";

interface ExternalRatingsProps {
  slug: string;
  externalRatings?: ExternalTitleRatings;
  title: string;
  kinopoiskId?: string;
  imdbId?: string;
}

export function formatVotes(votes: number | undefined): string {
  if (!votes) return "0";
  if (votes >= 1000000) {
    return (votes / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (votes >= 1000) {
    return (votes / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return votes.toString();
}

export default function ExternalRatings({ slug, externalRatings, title, kinopoiskId, imdbId }: ExternalRatingsProps) {
  const { user, refreshMovieRatings } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [cooldown, setCooldown] = useState(false);

  const kpUrl = kinopoiskId
    ? `https://www.kinopoisk.ru/film/${kinopoiskId}/`
    : `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(title)}`;

  const imdbUrl = imdbId
    ? `https://www.imdb.com/title/${imdbId}/`
    : `https://www.imdb.com/find?q=${encodeURIComponent(title)}`;

  const metacriticUrl = `https://www.metacritic.com/search/${encodeURIComponent(title)}/`;

  const rottenTomatoesUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`;

  const handleRefresh = async () => {
    if (isRefreshing || cooldown) return;
    setIsRefreshing(true);
    setStatus("idle");
    try {
      const success = await refreshMovieRatings(slug);
      if (success) {
        setStatus("success");
        setCooldown(true);
        setTimeout(() => setCooldown(false), 8000); // 8 seconds cooldown
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => {
        setStatus((prev) => (prev === "success" ? "idle" : prev));
      }, 3000);
    }
  };

  const getKPColorClasses = (val: number | undefined): React.CSSProperties => {
    if (val === undefined) return { color: "#71717a", borderColor: "#27272a", backgroundColor: "rgba(24, 24, 27, 0.4)" };
    const hex = getRatingColor(val);
    return {
      color: hex,
      borderColor: `${hex}25`,
      backgroundColor: `${hex}0f`
    };
  };

  const currentMetaColor = (val: number | undefined): React.CSSProperties => {
    if (val === undefined) return { color: "#71717a", borderColor: "#27272a" };
    const hex = getMetacriticColor(val);
    return {
      backgroundColor: hex,
      color: "#09090b",
      fontWeight: 'bold'
    };
  };

  const currentRtTextColor = (val: number | undefined): string => {
    return getRottenTomatoesColor(val);
  };

  const kp = externalRatings?.kinopoisk;
  const imdb = externalRatings?.imdb;
  const metacritic = externalRatings?.metacritic;
  const rotten = externalRatings?.rottenTomatoes;

  // Let admins/moderation or logged-in critics update ratings:
  const canRefresh = !!user;


  return (
    <div id="external-ratings-panel" className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
        <h3 className="font-sans font-medium text-lg text-zinc-100 flex items-center gap-2">
          <span>📊 Внешние рейтинги</span>
        </h3>
        
        {canRefresh && (
          <button
            id="refresh-ratings-btn"
            onClick={handleRefresh}
            disabled={isRefreshing || cooldown}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              cooldown
                ? "bg-zinc-900/10 text-zinc-600 border border-zinc-900 cursor-not-allowed"
                : "bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-400 border border-zinc-800 active:scale-95"
            }`}
            title="Обновить оценки с сервисов"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-500" : ""}`} />
            <span>
              {isRefreshing
                ? "Обновление..."
                : cooldown
                ? "Обновлено недавно"
                : "Обновить рейтинги"}
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.1fr_1.3fr] gap-4">
        {/* Кинопоиск */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border" style={getKPColorClasses(kp?.rating)}>
          <div className="flex items-center gap-3">
            <div className="bg-[#FF6600] text-neutral-950 font-black rounded px-1.5 py-0.5 text-[10px] tracking-tight select-none font-sans flex-shrink-0 uppercase">
              КП
            </div>
            <div className="flex flex-col">
              <a
                href={kpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-[#FF6600] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors group"
                title="Открыть на Кинопоиске"
              >
                <span>Кинопоиск</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-650 group-hover:text-[#FF6600] transition-colors" />
              </a>
              <span className="text-xs text-zinc-400 font-mono">
                {kp?.votes ? `${formatVotes(kp.votes)} голосов` : "нет голосов"}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold font-mono">
            {kp?.rating ? kp.rating.toFixed(1) : "—"}
          </div>
        </div>

        {/* IMDb */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border" style={getKPColorClasses(imdb?.rating)}>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 text-neutral-950 font-black rounded px-1.5 py-0.5 text-[10px] tracking-tight select-none font-sans flex-shrink-0">
              IMDb
            </div>
            <div className="flex flex-col">
              <a
                href={imdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-yellow-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors group"
                title="Открыть на IMDb"
              >
                <span>IMDb</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-650 group-hover:text-yellow-500 transition-colors" />
              </a>
              <span className="text-xs text-zinc-400 font-mono">
                {imdb?.votes ? `${formatVotes(imdb.votes)} голосов` : "нет голосов"}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold font-mono">
            {imdb?.rating ? imdb.rating.toFixed(1) : "—"}
          </div>
        </div>

        {/* Metacritic */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/40 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-neutral-800 text-zinc-300 font-bold rounded px-1.5 py-0.5 text-[9px] select-none font-sans tracking-wide flex-shrink-0">
              META
            </div>
            <div className="flex flex-col min-w-0">
              <a
                href={metacriticUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors group truncate"
                title="Открыть на Metacritic"
              >
                <span className="truncate">Metascore</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-650 group-hover:text-white transition-colors flex-shrink-0" />
              </a>
              <span className="text-xs text-zinc-400 font-sans">Критики</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded flex items-center justify-center font-black text-xs flex-shrink-0" style={currentMetaColor(metacritic?.rating)}>
            {metacritic?.rating !== undefined ? metacritic.rating : "—"}
          </div>
        </div>

        {/* Rotten Tomatoes */}
        <div className="flex flex-col justify-center p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/40">
          <div className="flex items-center justify-center mb-1.5">
            <a
              href={rottenTomatoesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-emerald-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors group"
              title="Открыть на Rotten Tomatoes"
            >
              <span>Rotten Tomatoes</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-650 group-hover:text-emerald-400 transition-colors" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col justify-center text-center py-1 bg-zinc-950/60 rounded border border-zinc-900 min-w-0">
              <span className="text-[9px] text-zinc-500 uppercase font-semibold mb-0.5">Томатометр</span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs select-none">🍅</span>
                <span className="text-xs font-mono font-bold" style={{ color: currentRtTextColor(rotten?.criticsRating) }}>
                  {rotten?.criticsRating !== undefined ? `${rotten.criticsRating}%` : "—"}
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center text-center py-1 bg-zinc-950/60 rounded border border-zinc-900 min-w-0">
              <span className="text-[9px] text-zinc-500 uppercase font-semibold mb-0.5">Попкорнометр</span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs select-none">🍿</span>
                <span className="text-xs font-mono font-bold" style={{ color: currentRtTextColor(rotten?.audienceRating) }}>
                  {rotten?.audienceRating !== undefined ? `${rotten.audienceRating}%` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {status === "success" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
          <Check className="w-3.5 h-3.5 animate-pulse" />
          <span>Оценки успешно обновлены по актуальным базам данных!</span>
        </div>
      )}
      {status === "error" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/5 px-3 py-1.5 rounded-lg border border-rose-500/10">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Произошла ошибка при получении рейтингов. Пожалуйста, попробуйте позже.</span>
        </div>
      )}
    </div>
  );
}
