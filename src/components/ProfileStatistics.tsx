import React, { useMemo } from "react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line 
} from "recharts";
import { MovieTitle, UserReview } from "../types";
import { BarChart3, PieChartIcon, Calendar, Trophy, Clapperboard, Award, Sparkles } from "lucide-react";
import { RatingBadge } from "./RatingBadge";


interface ProfileStatisticsProps {
  profileReviews: UserReview[];
  movies: MovieTitle[];
  watchlistMovies?: MovieTitle[];
}

export function ProfileStatistics({ 
  profileReviews = [], 
  movies = [], 
  watchlistMovies = [] 
}: ProfileStatisticsProps) {
  // Compute analytics data safely
  const analytics = useMemo(() => {
    if (profileReviews.length === 0 && watchlistMovies.length === 0) return null;

    // 1. Rating distribution (1-3, 4-5, 6-7, 8-10)
    let d1_3 = 0, d4_5 = 0, d6_7 = 0, d8_10 = 0;
    profileReviews.forEach(r => {
      const score = r.averageRating;
      if (score < 4.0) d1_3++;
      else if (score < 6.0) d4_5++;
      else if (score < 8.0) d6_7++;
      else d8_10++;
    });

    const ratingDistribution = [
      { name: "1-3 (Слабо)", value: d1_3, color: "#ef4444" },
      { name: "4-5 (Средне)", value: d4_5, color: "#f97316" },
      { name: "6-7 (Хорошо)", value: d6_7, color: "#3b82f6" },
      { name: "8-10 (Шедевр)", value: d8_10, color: "#10b981" }
    ].filter(d => d.value > 0);

    // 2. Reviews by year
    const yearCounts: Record<number, number> = {};
    profileReviews.forEach(r => {
      try {
        const yr = new Date(r.createdAt).getFullYear();
        if (!isNaN(yr)) {
          yearCounts[yr] = (yearCounts[yr] || 0) + 1;
        }
      } catch (e) {
        // fallback
        yearCounts[2026] = (yearCounts[2026] || 0) + 1;
      }
    });
    const reviewsByYear = Object.entries(yearCounts)
      .map(([yr, count]) => ({ year: yr, "Рецензии": count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // 3. Favorite Genres (Top 8)
    const genreCounts: Record<string, number> = {};
    const genreRatingsSum: Record<string, number> = {};
    profileReviews.forEach(r => {
      const match = movies.find(m => m.slug === r.titleSlug);
      if (match) {
        match.genres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
          genreRatingsSum[g] = (genreRatingsSum[g] || 0) + r.averageRating;
        });
      }
    });

    const favoriteGenresColors = [
      "#e11d48", "#be123c", "#4f46e5", "#06b6d4", 
      "#10b981", "#fbbf24", "#d946ef", "#a855f7"
    ];

    const favoriteGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((g, idx) => ({
        ...g,
        color: favoriteGenresColors[idx % favoriteGenresColors.length]
      }));

    // 4. Monthly Activity 
    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const monthlyCounts = Array(12).fill(0);
    profileReviews.forEach(r => {
      try {
        const monthIdx = new Date(r.createdAt).getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          monthlyCounts[monthIdx]++;
        }
      } catch (e) {
        monthlyCounts[4]++; // fallback
      }
    });
    const activityData = monthNames.map((name, idx) => ({
      month: name,
      "Активность": monthlyCounts[idx]
    }));

    // 5. Top 10 highest-rated films by user
    const topRatedFilms = [...profileReviews]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)
      .map(r => ({
        name: r.titleName.length > 20 ? r.titleName.slice(0, 20) + "..." : r.titleName,
        "Оценка": parseFloat(r.averageRating.toFixed(1))
      }));

    // 6. Top 5 Directors / Top 5 Actors
    const directorCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};
    profileReviews.forEach(r => {
      const match = movies.find(m => m.slug === r.titleSlug);
      if (match) {
        if (match.director) {
          directorCounts[match.director] = (directorCounts[match.director] || 0) + 1;
        }
        if (match.cast && Array.isArray(match.cast)) {
          match.cast.forEach(actor => {
            actorCounts[actor] = (actorCounts[actor] || 0) + 1;
          });
        }
      }
    });

    const topDirectors = Object.entries(directorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topActors = Object.entries(actorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Average rating by genre
    const averageRatingByGenre = Object.entries(genreCounts)
      .map(([genre, count]) => {
        const sum = genreRatingsSum[genre] || 0;
        return {
          genre,
          "Средний балл": parseFloat((sum / count).toFixed(1))
        };
      })
      .sort((a, b) => b["Средний балл"] - a["Средний балл"])
      .slice(0, 8);

    // 8. Watchlist Genre composition
    const watchlistGenreCounts: Record<string, number> = {};
    if (Array.isArray(watchlistMovies)) {
      watchlistMovies.forEach(m => {
        if (m.genres && Array.isArray(m.genres)) {
          m.genres.forEach(g => {
            watchlistGenreCounts[g] = (watchlistGenreCounts[g] || 0) + 1;
          });
        }
      });
    }

    const watchlistGenresColors = [
      "#10b981", "#3b82f6", "#e11d48", "#be123c", "#4f46e5", "#06b6d4", "#fbbf24", "#d946ef", "#a855f7"
    ];

    const watchlistGenres = Object.entries(watchlistGenreCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((g, idx) => ({
        ...g,
        color: watchlistGenresColors[idx % watchlistGenresColors.length]
      }));

    return {
      ratingDistribution,
      reviewsByYear,
      favoriteGenres,
      activityData,
      topRatedFilms,
      topDirectors,
      topActors,
      averageRatingByGenre,
      watchlistGenres
    };
  }, [profileReviews, movies, watchlistMovies]);

  if (!analytics) {
    return (
      <div className="bg-graphite border border-graphite-light p-12 rounded-xl text-center space-y-4">
        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto" />
        <h3 className="text-sm font-bold text-gray-300 font-mono uppercase tracking-wide">Недостаточно данных</h3>
        <p className="text-xs text-gray-400 font-mono max-w-sm mx-auto leading-relaxed">
          Чтобы построить подробные интерактивные графики вашего киновкуса, оставьте хотя бы одну оценку к любимому фильму.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Overview stats block widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-graphite border border-graphite-light/60 p-4.5 rounded-xl flex items-center gap-4">
          <div className="bg-garnet/10 border border-garnet/30 p-2.5 rounded-lg">
            <Award className="w-5 h-5 text-garnet" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Всего разборов</p>
            <p className="text-xl font-black text-white font-mono mt-0.5">{profileReviews.length}</p>
          </div>
        </div>

        <div className="bg-graphite border border-graphite-light/60 p-4.5 rounded-xl flex items-center gap-4">
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Средний балл критика</p>
            {profileReviews.length > 0 ? (
              <RatingBadge 
                rating={profileReviews.reduce((sum, r) => sum + r.averageRating, 0) / profileReviews.length} 
                size="medium" 
                forceScale10={true} 
              />
            ) : (
              <span className="text-xl font-black text-white font-mono">—</span>
            )}
          </div>
        </div>

        <div className="bg-graphite border border-graphite-light/60 p-4.5 rounded-xl flex items-center gap-4">
          <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-lg">
            <Clapperboard className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Любимый жанр</p>
            <p className="text-xs font-black text-white mt-1.5 truncate max-w-[130px]" title={analytics.favoriteGenres[0]?.name}>
              {analytics.favoriteGenres[0]?.name || "Не определен"}
            </p>
          </div>
        </div>

        <div className="bg-graphite border border-graphite-light/60 p-4.5 rounded-xl flex items-center gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Активный год</p>
            <p className="text-xl font-black text-white font-mono mt-0.5">
              {analytics.reviewsByYear[analytics.reviewsByYear.length - 1]?.year || "2026"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Rating Distribution */}
        <div className="bg-[#101015] border border-graphite-light/80 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <PieChartIcon className="w-4 h-4 text-garnet" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Распределение оценок</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {analytics.ratingDistribution.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">Нет оценок для отображения</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.ratingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#141416", borderColor: "#222" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Reviews by Year */}
        <div className="bg-[#101015] border border-graphite-light/80 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Рецензии по годам публикации</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.reviewsByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="year" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#141416", borderColor: "#222", color: "#fff" }} />
                <Bar dataKey="Рецензии" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Favorite Genres */}
        <div className="bg-[#101015] border border-graphite-light/80 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <PieChartIcon className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Любимые жанры (Топ-8)</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {analytics.favoriteGenres.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">Жанры не установлены</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.favoriteGenres}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name }) => name}
                    dataKey="value"
                  >
                    {analytics.favoriteGenres.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#141416", borderColor: "#222", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3b. Watchlist Genre Composition */}
        <div className="bg-[#101015] border border-graphite-light/80 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Жанры списка ожидания</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {analytics.watchlistGenres.length === 0 ? (
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-400 font-mono font-semibold">Список ожидания пуст</p>
                <p className="text-[10px] text-gray-500 font-mono">Добавьте фильмы на вкладке «Буду смотреть»</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.watchlistGenres}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={35}
                    paddingAngle={2}
                    label={({ name }) => name}
                    dataKey="value"
                  >
                    {analytics.watchlistGenres.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#141416", borderColor: "#222", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Activity chart */}
        <div className="bg-[#101015] border border-graphite-light/80 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <Calendar className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Активность по месяцам (сезонность)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="month" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#141416", borderColor: "#222", color: "#fff" }} />
                <Line type="monotone" dataKey="Активность" stroke="#a855f7" strokeWidth={3} dot={{ stroke: "#a855f7", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Top 10 highest-rated films */}
        <div className="bg-[#101015] border border-graphite-light/80 rounded-xl p-5 md:p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Топ-10 фильмов по оценке критика</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topRatedFilms} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} stroke="#666" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#666" width={110} fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#141416", borderColor: "#222", color: "#fff" }} />
                <Bar dataKey="Оценка" fill="#fbbf24" radius={[0, 4, 4, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Average rating by genre */}
        <div className="bg-[#101015] border border-[#1e1e24] rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <Award className="w-4 h-4 text-garnet" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Средний балл по жанрам</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.averageRatingByGenre}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="genre" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: "#141416", borderColor: "#222", color: "#fff" }} />
                <Bar dataKey="Средний балл" fill="#be123c" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Top Directors & Actors lists */}
        <div className="bg-[#101015] border border-[#1e1e24] rounded-xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-graphite-light/40 pb-3">
            <Clapperboard className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Частые авторы и лица в рецензиях</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">Топ-5 Режиссеров</h4>
              {analytics.topDirectors.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono">Нет данных</p>
              ) : (
                <div className="space-y-1.5">
                  {analytics.topDirectors.map((d, index) => (
                    <div key={index} className="flex justify-between items-center text-xs bg-graphite p-2 rounded-lg border border-graphite-light/50 font-mono">
                      <span className="text-gray-200 truncate pr-2">{d.name}</span>
                      <span className="text-garnet font-black">x{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">Топ-5 Актеров</h4>
              {analytics.topActors.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono">Нет данных</p>
              ) : (
                <div className="space-y-1.5">
                  {analytics.topActors.map((a, index) => (
                    <div key={index} className="flex justify-between items-center text-xs bg-graphite p-2 rounded-lg border border-graphite-light/50 font-mono">
                      <span className="text-gray-200 truncate pr-2">{a.name}</span>
                      <span className="text-blue-400 font-black">x{a.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
