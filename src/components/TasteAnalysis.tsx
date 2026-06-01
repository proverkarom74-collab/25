import React, { useState } from "react";
import { Sparkles, Loader2, Quote, BookOpen, Ban, Compass, Award, ShieldAlert } from "lucide-react";

interface TasteReport {
  preferences: string;
  dislikes: string;
  strengths: string;
  recommendations: string;
  comparison: string;
  fallback?: boolean;
}

interface TasteAnalysisProps {
  userId: string;
}

export function TasteAnalysis({ userId }: TasteAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TasteReport | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/${userId}/taste-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReport(data.analysis);
      } else {
        setError(data.error || "Не удалось завершить анализ вкуса.");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка соединения с ИИ-сервером. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-graphite border border-graphite-light/60 p-6 md:p-8 rounded-xl space-y-6 relative overflow-hidden">
      {/* Saturated visual ornament backing card */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-garnet/5 rounded-full blur-2xl -z-10" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-graphite-light pb-4">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>ИИ-анализатор кинокритика</span>
          </h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Взвесим все ваши оценки, рецензии и синефильные замечания, чтобы воссоздать портрет вашего художественного Я.
          </p>
        </div>

        {!report && !loading && (
          <button
            onClick={fetchAnalysis}
            className="w-full sm:w-auto bg-gradient-to-r from-garnet to-purple-800 hover:from-garnet-light hover:to-purple-700 text-white font-mono uppercase tracking-wider font-extrabold text-xs px-5 py-2.5 rounded-full transition duration-300 shadow-lg cursor-pointer transform hover:scale-102 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Проанализировать мой вкус</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-garnet animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-gray-200">ИИ анализирует лексику ваших разборов...</h4>
            <p className="text-[10px] text-gray-500 font-mono">Сопоставляем ваши вкусы с каталогами классиков и фестивальными трендами</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-garnet/10 border border-garnet/30 p-4.5 rounded-xl flex gap-3 text-xs text-garnet-light font-sans items-start">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-garnet" />
          <div className="space-y-1">
            <span className="font-bold">Анализ прерван</span>
            <p className="text-gray-400 leading-relaxed font-mono text-[11px]">{error}</p>
          </div>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-8 animate-fade-in">
          
          {report.fallback && (
            <div className="bg-[#1b1c1e] border border-graphite-light/50 px-3.5 py-2 rounded-lg text-[10px] text-gray-400 font-mono flex items-center justify-between">
              <span>⚠️ Использован локальный алгоритмический парсер вкусов (Gemini API Offline).</span>
              <button onClick={fetchAnalysis} className="text-garnet hover:underline font-bold bg-transparent border-0 cursor-pointer">Перезапустить</button>
            </div>
          )}

          {/* Literary introductory quote element wrapper */}
          <div className="relative bg-[#111] p-5 rounded-xl border-l-[3px] border-amber-600 block shadow-inner">
            <Quote className="w-8 h-8 text-amber-600/20 absolute top-2 right-4" />
            <p className="text-xs italic text-gray-300 leading-relaxed font-serif tracking-wide">
              — «Кинематограф — это музыка для глаз. И у каждого глаза есть свой собственный звукоряд. Твой критик видит скрытые ритмы кадра и вплетает их в ткань текстов...»
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Preferences column */}
            <div className="bg-graphite-dark border border-graphite-light/40 p-5 rounded-xl space-y-3 hover:border-amber-600/35 transition duration-300">
              <div className="flex items-center gap-2 text-amber-500">
                <BookOpen className="w-4 h-4" />
                <h4 className="text-xs font-mono font-black uppercase tracking-wider">Глубинная синефилия (Стиль)</h4>
              </div>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">{report.preferences}</p>
            </div>

            {/* Dislikes column */}
            <div className="bg-graphite-dark border border-graphite-light/40 p-5 rounded-xl space-y-3 hover:border-garnet/35 transition duration-300">
              <div className="flex items-center gap-2 text-rose-500">
                <Ban className="w-4 h-4" />
                <h4 className="text-xs font-mono font-black uppercase tracking-wider">Теневой сектор (Не в вашем вкусе)</h4>
              </div>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">{report.dislikes}</p>
            </div>

            {/* Strengths column */}
            <div className="bg-graphite-dark border border-graphite-light/40 p-5 rounded-xl space-y-3 hover:border-emerald-600/35 transition duration-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <Award className="w-4 h-4" />
                <h4 className="text-xs font-mono font-black uppercase tracking-wider">Суперсила рецензента</h4>
              </div>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">{report.strengths}</p>
            </div>

            {/* Recommendations column */}
            <div className="bg-graphite-dark border border-graphite-light/40 p-5 rounded-xl space-y-3 hover:border-blue-500/35 transition duration-300">
              <div className="flex items-center gap-2 text-blue-400">
                <Compass className="w-4 h-4" />
                <h4 className="text-xs font-mono font-black uppercase tracking-wider">Режиссёры и темы для открытия</h4>
              </div>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">{report.recommendations}</p>
            </div>
          </div>

          {/* Critic Match full-width card bottom block */}
          <div className="bg-gradient-to-br from-[#1c1411] to-[#121216] border border-amber-600/20 p-6 rounded-xl space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 hover:border-amber-600/50 transition duration-300">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] uppercase font-black">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Исторический прообраз</span>
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Ваша кинематографическая родственная душа</h4>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">{report.comparison}</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={fetchAnalysis}
              className="text-white hover:text-amber-400 font-mono text-xs uppercase font-extrabold flex items-center gap-1 bg-transparent border border-graphite-light py-1.5 px-3 rounded hover:bg-[#1a1c22] transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-50 animate-pulse" />
              <span>Пересчитать профиль вкуса</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
