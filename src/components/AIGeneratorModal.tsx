import React, { useState } from "react";
import { useStore } from "../store";
import { Sparkles, X, Film, Tv, AlertCircle, Loader2 } from "lucide-react";

export function AIGeneratorModal() {
  const { 
    generateNewMovie, 
    generatingMovie, 
    errorMsg, 
    showGenerator, 
    setShowGenerator 
  } = useStore();

  const [genTitle, setGenTitle] = useState("");
  const [genYear, setGenYear] = useState("");
  const [genType, setGenType] = useState<"movie" | "tv" | "anime" | "short">("movie");

  if (!showGenerator) return null;

  const handleSuggestAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTitle.trim()) return;
    const ok = await generateNewMovie(genTitle, genType, genYear.trim() || undefined);
    if (ok) {
      setShowGenerator(false);
      setGenTitle("");
      setGenYear("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto font-sans">
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
                Год выхода (опционально)
              </label>
              <input
                type="text"
                max={2030}
                min={1880}
                placeholder="Например: 1999"
                value={genYear}
                onChange={(e) => setGenYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-graphite-dark border border-graphite-light text-sm text-[#f3f4f6] rounded-lg p-3 placeholder-gray-600 focus:outline-none focus:border-garnet focus:ring-1 focus:ring-garnet font-mono"
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
  );
}
