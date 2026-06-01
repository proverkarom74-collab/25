import { useState, useRef, useEffect } from "react";
import { 
  Award, Eye, Film, Medal, Sparkles, Trophy, Crown, 
  Compass, Heart, Tv, Gamepad2, MessageSquare, Calendar, 
  TrendingUp, UserCheck, Volume2, Globe, History, Lock, Unlock, Search, Filter, Info,
  Flame, Moon, Coffee, Layers, Star
} from "lucide-react";
import { Achievement, AchievementProgress } from "../types";
import { ACHIEVEMENTS } from "../lib/achievementsData";
import { CandyConfetti } from "./CandyConfetti";

// Helper to render dynamic Lucide icons based on string names
const AchievementIcon = ({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) => {
  const map: Record<string, any> = {
    Award, Eye, Film, Medal, Sparkles, Trophy, Crown, 
    Compass, Heart, Tv, Gamepad2, MessageSquare, Calendar, 
    TrendingUp, UserCheck, Volume2, Globe, History, Search,
    Flame, Moon, Coffee, Layers, Star
  };

  const IconComponent = map[name] || Award;
  return <IconComponent size={size} className={className} />;
};

interface AchievementsTabProps {
  progressList: AchievementProgress[];
}

export function AchievementsTab({ progressList = [] }: AchievementsTabProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "inprogress">("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | "common" | "rare" | "epic" | "legendary">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement | null>(null);

  // Close autocomplete suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter autocomplete suggestions
  const suggestions = searchQuery.trim()
    ? ACHIEVEMENTS.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        item.title.toLowerCase() !== searchQuery.toLowerCase()
      ).slice(0, 5)
    : [];

  // Merge achievements metadata with user progress
  const mergedAchievements = ACHIEVEMENTS.map(ach => {
    const prog = progressList.find(p => p.achievementId === ach.id) || {
      achievementId: ach.id,
      current: 0,
      target: 1,
      percent: 0,
      unlocked: false
    };

    return {
      ...ach,
      progress: prog
    };
  });

  // Calculate statistics
  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = progressList.filter(p => p.unlocked).length;
  const unlockedPercent = Math.round((unlockedCount / totalCount) * 100) || 0;

  // Filter based on selected buttons
  const filtered = mergedAchievements.filter(item => {
    // Search query filter
    const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!titleMatch && !descMatch) return false;

    // Status completion filter
    if (filter === "unlocked" && !item.progress.unlocked) return false;
    if (filter === "inprogress" && item.progress.unlocked) return false;

    // Rarity filter match
    if (rarityFilter !== "all" && item.rarity !== rarityFilter) return false;

    // Category filter match
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;

    return true;
  });

  // Custom styling mappings for rarities
  const rarityConfig = {
    common: {
      label: "Обычное Achievement",
      border: "border-slate-800 bg-[#161a24] hover:border-slate-700",
      glow: "shadow-none",
      tag: "bg-slate-800 text-slate-300",
      iconColor: "text-slate-400"
    },
    rare: {
      label: "Редкое Achievement",
      border: "border-blue-900/60 bg-gradient-to-br from-[#0c1221] to-[#121c33] hover:border-blue-800",
      glow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]",
      tag: "bg-blue-950 text-blue-300 border border-blue-900/50",
      iconColor: "text-blue-400"
    },
    epic: {
      label: "Эпическое Achievement",
      border: "border-purple-950 bg-gradient-to-br from-[#120a21] to-[#1e1038] hover:border-purple-800",
      glow: "shadow-[0_0_20px_-3px_rgba(168,85,247,0.2)]",
      tag: "bg-purple-950 text-purple-200 border border-purple-900/50",
      iconColor: "text-purple-400"
    },
    legendary: {
      label: "Легендарное Achievement",
      border: "border-amber-950/80 bg-gradient-to-br from-[#1c1208] to-[#2c1d0d] hover:border-amber-800",
      glow: "shadow-[0_0_25px_-3px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/20",
      tag: "bg-amber-950/80 text-amber-200 border border-amber-900/50 animate-pulse-subtle",
      iconColor: "text-amber-500"
    }
  };

  const rarityTranslations: Record<string, string> = {
    common: "Обычное",
    rare: "Редкое",
    epic: "Эпическое",
    legendary: "Легендарное"
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-graphite border border-graphite-light p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Award className="text-garnet w-6 h-6" />
            <span>Система Наград Кинокритика</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl font-mono leading-relaxed">
            Разблокируйте бейджи за активность, глубину анализа, скорость рецензирования и признание сообщества. Поднимите свой авторитет среди киноманов!
          </p>
        </div>

        {/* Circular Progress Display */}
        <div className="flex items-center gap-4 bg-graphite-dark/50 border border-graphite-light/30 px-6 py-4 rounded-xl w-full md:w-auto">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-graphite-light"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-garnet"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - unlockedPercent / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-white">{unlockedPercent}%</span>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Всего разблокировано</p>
            <p className="text-2xl font-black text-white font-mono">
              {unlockedCount} / <span className="text-gray-500">{totalCount}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-graphite/40 border border-graphite-light/20 p-4 rounded-xl">
        {/* State filters */}
        <div className="flex bg-graphite-dark/50 p-1.5 rounded-lg border border-graphite-light/30 w-full sm:w-auto overflow-x-auto gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              filter === "all"
                ? "bg-garnet text-white"
                : "text-gray-400 hover:text-white hover:bg-graphite"
            }`}
          >
            Все ({totalCount})
          </button>
          <button
            onClick={() => setFilter("unlocked")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              filter === "unlocked"
                ? "bg-garnet text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Полученные ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter("inprogress")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              filter === "inprogress"
                ? "bg-garnet text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            В процессе ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Search */}
        <div ref={autocompleteRef} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Найти достижение..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full bg-graphite-dark border border-graphite-light/60 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-gray-200 outline-none focus:border-garnet/60 transition"
          />

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#161a26]/95 backdrop-blur-md border border-graphite-light rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden divide-y divide-graphite-light/35 max-h-60 overflow-y-auto">
              {suggestions.map(item => {
                const prog = progressList.find(p => p.achievementId === item.id);
                const isUnlocked = prog?.unlocked || false;
                const rarityBadgeColors = {
                  common: "text-slate-400 bg-slate-900/60 border-slate-800",
                  rare: "text-blue-400 bg-blue-950/20 border-blue-900/40",
                  epic: "text-purple-400 bg-purple-950/20 border-purple-900/40",
                  legendary: "text-amber-500 bg-amber-955/20 border-amber-900/50"
                }[item.rarity] || "text-gray-400";
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchQuery(item.title);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-graphite transition flex items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[9px] text-gray-400 truncate mt-0.5">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${rarityBadgeColors}`}>
                        {item.rarity}
                      </span>
                      {isUnlocked && <span className="text-[10px]" title="Получено">🏆</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rarity filter row */}
      <div className="flex flex-wrap gap-2 items-center bg-graphite/40 border border-graphite-light/20 p-3.5 rounded-xl">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 mr-2 flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-garnet-light" />
          <span>Редкость:</span>
        </span>
        
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setRarityFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              rarityFilter === "all"
                ? "bg-white text-black border-white"
                : "border-graphite-light text-gray-400 hover:text-white hover:bg-graphite"
            }`}
          >
            Все
          </button>

          <button
            onClick={() => setRarityFilter("common")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              rarityFilter === "common"
                ? "bg-slate-700 text-white border-slate-700 shadow-[0_0_8px_rgba(100,116,139,0.25)]"
                : "border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Обычные (common)
          </button>

          <button
            onClick={() => setRarityFilter("rare")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              rarityFilter === "rare"
                ? "bg-blue-900 border-blue-900 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                : "border-blue-950 text-blue-400 hover:text-blue-300"
            }`}
          >
            Редкие (rare)
          </button>

          <button
            onClick={() => setRarityFilter("epic")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              rarityFilter === "epic"
                ? "bg-purple-900 border-purple-900 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "border-purple-950 text-purple-400 hover:text-purple-355"
            }`}
          >
            Эпические (epic)
          </button>

          <button
            onClick={() => setRarityFilter("legendary")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              rarityFilter === "legendary"
                ? "bg-amber-600 border-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.45)] animate-pulse-subtle font-extrabold"
                : "border-amber-950 text-amber-500 hover:text-amber-450"
            }`}
          >
            Легендарные (legendary)
          </button>
        </div>
      </div>

      {/* Category Filter row */}
      <div className="flex flex-col gap-2.5 bg-graphite/40 border border-graphite-light/20 p-3.5 rounded-xl">
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
          <Layers className="w-3.5 h-3.5 text-garnet-light" />
          <span>Категория достижений:</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {["all", "Прогресс", "Жанры", "Влияние", "Особые", "Сезонные", "Режиссёры", "География", "Стиль", "Сообщество", "Челленджи", "Легендарные"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-garnet border-garnet text-white shadow-[0_0_10px_rgba(128,0,1,0.3)]"
                  : "border-graphite-light/60 text-gray-400 hover:text-white hover:bg-graphite"
              }`}
            >
              {cat === "all" ? "Все категории" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="relative min-h-[150px]">
        {/* Animated candy particles zone */}
        <CandyConfetti trigger={confettiTrigger} />

        {filtered.length === 0 ? (
          <div className="bg-graphite border border-graphite-light/40 py-16 px-4 text-center rounded-xl">
            <Info className="mx-auto text-gray-600 mb-2" size={32} />
            <p className="text-gray-400 text-xs font-mono">Достижения не найдены по запросу или фильтрам.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => {
              const config = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.common;
              const isUnlocked = item.progress.unlocked;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedAchievement(item);
                    if (isUnlocked) {
                      setConfettiTrigger(prev => prev + 1);
                    }
                  }}
                  className={`border rounded-xl p-4 transition duration-300 transform hover:-translate-y-1 cursor-pointer hover:brightness-[1.03] ${config.border} ${config.glow} flex flex-col justify-between relative group ${
                    isUnlocked ? "opacity-100" : "opacity-75 bg-[#141822]"
                  }`}
                >
                  {/* Status indicator on card edge */}
                  {isUnlocked ? (
                    <span className="absolute top-4 right-4 text-emerald-500 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                      <Unlock size={10} />
                      ПОЛУЧЕНО
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 text-gray-500 bg-gray-950/50 border border-gray-900 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                      <Lock size={10} />
                      ЗАКРЫТО
                    </span>
                  )}

                  <div>
                    {/* Rarity and Class */}
                    <span className={`inline-block text-[8px] font-mono uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded mb-3 ${config.tag}`}>
                      {rarityTranslations[item.rarity] || item.rarity}
                    </span>

                    {/* Icon and Title block */}
                    <div className="flex gap-3 items-start mt-1">
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isUnlocked 
                          ? "bg-graphite-dark border border-slate-700/60" 
                          : "bg-graphite-dark/40 border border-slate-800 grayscale text-gray-500"
                      }`}>
                        <AchievementIcon 
                          name={item.icon} 
                          size={22} 
                          className={isUnlocked ? config.iconColor : "text-gray-500"} 
                        />
                      </div>

                      <div className="space-y-1">
                        <h3 className={`text-sm font-bold tracking-tight transition ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-[180px] sm:max-w-none">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar and milestone */}
                  <div className="mt-5 pt-3 border-t border-graphite-light/20">
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                      <span className="text-gray-500">Прогресс исследования</span>
                      <span className={isUnlocked ? "text-emerald-400 font-bold" : "text-gray-400"}>
                        {item.progress.current} / {item.progress.target}
                      </span>
                    </div>

                    <div className="w-full bg-graphite-dark rounded-full h-1.5 overflow-hidden border border-graphite-light/20">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isUnlocked 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                            : "bg-garnet"
                        }`}
                        style={{ width: `${Math.min(item.progress.percent, 100)}%` }}
                      />
                    </div>

                    {isUnlocked && item.progress.unlockedAt && (
                      <p className="text-[8px] text-gray-500 font-mono text-right mt-1.5">
                        Дата получения: {new Date(item.progress.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Popover detailed inspector modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-md bg-[#161a26] border rounded-2xl p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 ${
            (rarityConfig[selectedAchievement.rarity as keyof typeof rarityConfig] || rarityConfig.common).border
          }`}>
            {/* Ambient flare light matching rarity */}
            <div className={`absolute top-0 inset-x-0 h-44 opacity-20 pointer-events-none bg-gradient-to-b ${
              {
                common: "from-slate-500",
                rare: "from-blue-500",
                epic: "from-purple-500",
                legendary: "from-amber-500"
              }[selectedAchievement.rarity as "common" | "rare" | "epic" | "legendary"] || "from-slate-500"
            } to-transparent`} />

            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition font-mono text-xs cursor-pointer z-10"
              title="Закрыть"
            >
              ✕
            </button>

            {/* Rarity Tag */}
            <span className={`inline-block text-[9px] font-mono uppercase tracking-widest font-black px-2 py-1 rounded-md mb-4 ${
              (rarityConfig[selectedAchievement.rarity as keyof typeof rarityConfig] || rarityConfig.common).tag
            }`}>
              {rarityTranslations[selectedAchievement.rarity] || selectedAchievement.rarity} НАГРАДА
            </span>

            {/* Icon Block */}
            <div className="flex flex-col items-center text-center mt-2 mb-6 relative z-10">
              <div className={`p-4 rounded-2xl mb-4 bg-graphite-dark border relative ${
                selectedAchievement.progress.unlocked 
                  ? "border-slate-700/80 shadow-2xl" 
                  : "border-slate-800/60 grayscale text-gray-500"
              }`}>
                <AchievementIcon
                  name={selectedAchievement.icon}
                  size={36}
                  className={selectedAchievement.progress.unlocked 
                    ? (rarityConfig[selectedAchievement.rarity as keyof typeof rarityConfig] || rarityConfig.common).iconColor 
                    : "text-gray-500"
                  }
                />
                {selectedAchievement.progress.unlocked && (
                  <Sparkles className="absolute -top-1.5 -right-1.5 w-5 h-5 text-amber-400 animate-pulse" />
                )}
              </div>

              <h3 className="text-base font-extrabold text-white px-4 leading-tight">
                {selectedAchievement.title}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-mono leading-relaxed max-w-sm">
                {selectedAchievement.description}
              </p>
            </div>

            {/* Progress Container */}
            <div className="bg-[#11131c] border border-graphite-light/40 rounded-xl p-4 space-y-3.5 relative z-10">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400">Текущий прогресс</span>
                <span className={selectedAchievement.progress.unlocked ? "text-emerald-400 font-extrabold" : "text-gray-300 font-bold"}>
                  {selectedAchievement.progress.current} / {selectedAchievement.progress.target}
                </span>
              </div>

              <div className="w-full bg-graphite-dark rounded-full h-2 overflow-hidden border border-graphite-light/20 relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    selectedAchievement.progress.unlocked
                      ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
                      : "bg-garnet"
                  }`}
                  style={{ width: `${Math.min(selectedAchievement.progress.percent, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>Статус исследования</span>
                <span className={selectedAchievement.progress.unlocked ? "text-emerald-400 font-extrabold" : "text-gray-400"}>
                  {selectedAchievement.progress.unlocked ? "ОТКРЫТО" : "В ПРОЦЕССЕ"}
                </span>
              </div>
            </div>

            {selectedAchievement.progress.unlocked && selectedAchievement.progress.unlockedAt && (
              <div className="mt-4 text-center relative z-10">
                <p className="text-[10px] text-gray-500 font-mono flex items-center justify-center gap-1.5">
                  <Unlock size={12} className="text-emerald-500" />
                  <span>Дата разблокировки: {new Date(selectedAchievement.progress.unlockedAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" })}</span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3 relative z-10">
              {selectedAchievement.progress.unlocked && (
                <button
                  onClick={() => setConfettiTrigger(prev => prev + 1)}
                  className="flex-1 bg-graphite-dark hover:bg-[#1a1f30] text-amber-400 border border-amber-900/40 font-bold py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1.5 hover:border-amber-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Взрыв конфетти! 🍬</span>
                </button>
              )}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
