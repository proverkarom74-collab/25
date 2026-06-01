import React, { useState, useEffect } from "react";
import { CorrectionRequest, MovieTitle } from "../types";
import { 
  ShieldAlert, CheckCircle, XCircle, Clock, ArrowRight, Check, X, AlertCircle, Info 
} from "lucide-react";
import { useStore } from "../store";

interface ModerationViewProps {
  requests: CorrectionRequest[];
  loading: boolean;
  onReview: (requestId: string, action: "approve" | "reject") => Promise<boolean>;
  movies: MovieTitle[];
}

export function ModerationView({ requests, loading, onReview, movies }: ModerationViewProps) {
  const { directorsList, fetchDirectors } = useStore();

  useEffect(() => {
    if (directorsList.length === 0) {
      fetchDirectors();
    }
  }, [directorsList.length]);

  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredRequests = requests.filter(req => req.status === filter);

  const getDiff = (original: any, proposed: any, isDirector = false) => {
    if (!original || !proposed) return [];
    const diffs: { field: string; originalVal: string; proposedVal: string }[] = [];
    
    const movieFields = [
      { key: "title", label: "Название (RU)" },
      { key: "originalTitle", label: "Название (Оригинал)" },
      { key: "year", label: "Год выпуска" },
      { key: "releaseDate", label: "Дата релиза" },
      { key: "duration", label: "Длительность" },
      { key: "director", label: "Режиссер" },
      { key: "country", label: "Страна производства" },
      { key: "overview", label: "Описание сюжета" },
      { key: "cast", label: "Актерский состав" },
      { key: "genres", label: "Жанры" }
    ];

    const directorFields = [
      { key: "name", label: "Имя (RU)" },
      { key: "originalName", label: "Оригинальное имя" },
      { key: "yearsOfLife", label: "Годы жизни / Возраст" },
      { key: "quote", label: "Цитата" },
      { key: "biography", label: "Биография" },
      { key: "country", label: "Страна" },
      { key: "style", label: "Стиль режиссуры" },
      { key: "keyThemes", label: "Ключевые темы" },
      { key: "awards", label: "Награды" }
    ];

    const fields = isDirector ? directorFields : movieFields;

    for (const f of fields) {
      let oVal = original[f.key];
      let pVal = proposed[f.key];
      
      if (Array.isArray(oVal)) oVal = oVal.join(", ");
      if (Array.isArray(pVal)) pVal = pVal.join(", ");
      
      const oStr = String(oVal !== undefined && oVal !== null ? oVal : "").trim();
      const pStr = String(pVal !== undefined && pVal !== null ? pVal : "").trim();
      
      if (oStr !== pStr) {
        diffs.push({
          field: f.label,
          originalVal: oStr || "—",
          proposedVal: pStr || "—"
        });
      }
    }
    return diffs;
  };

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessingId(requestId);
    try {
      await onReview(requestId, action);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Moderation Panel Info */}
      <div className="bg-gradient-to-r from-amber-500/10 to-garnet/10 border border-amber-500/20 p-5 rounded-xl">
        <div className="flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Панель киномодератора</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Здесь отображаются сообщения пользователей о неточностях в энциклопедии. Искусственный интеллект автоматически проанализировал замечания и подготовил черновик изменений (<code className="text-amber-300 font-mono text-[11px]">Proposed Changes</code>). Ваша задача — проверить корректность предложенных данных перед их сохранением в базе, чтобы избежать вандализма или ошибочных правок.
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-graphite border border-graphite-light p-1 rounded-lg max-w-md">
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === "pending" 
              ? "bg-garnet text-white" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>На очереди ({requests.filter(r => r.status === "pending").length})</span>
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === "approved" 
              ? "bg-emerald-650/40 text-emerald-400 border border-emerald-500/10" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Одобренные ({requests.filter(r => r.status === "approved").length})</span>
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === "rejected" 
              ? "bg-rose-950/20 text-rose-400 border border-rose-500/10" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Отклоненные ({requests.filter(r => r.status === "rejected").length})</span>
        </button>
      </div>

      {/* Requests List */}
      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-garnet"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-graphite border border-graphite-light p-10 rounded-xl text-center text-xs text-gray-400 font-mono">
          {filter === "pending" 
            ? "Нет обращений, ожидающих модерации. Все данные энциклопедии проверены!" 
            : filter === "approved" 
            ? "Вы еще не одобрили ни одного исправления." 
            : "Список отклоненных обращений пуст."}
        </div>
      ) : (
         <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isDirType = req.type === "director" || !!req.directorId;
            const originalObj = isDirType 
              ? (directorsList || []).find(d => d.id === req.directorId)
              : movies.find(m => m.slug === req.movieSlug);
            const diffs = getDiff(originalObj, req.proposedChanges, isDirType);
            const isExpanded = expandedRequestId === req.id;

            return (
              <div 
                key={req.id} 
                className="bg-graphite border border-graphite-light rounded-xl overflow-hidden transition hover:border-gray-700"
              >
                {/* Header row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-graphite-dark/40 border-b border-graphite-light">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">
                        {isDirType ? "Режиссёр:" : "Фильм/Сериал:"}
                      </span>
                      <span className="text-sm font-bold text-white hover:text-garnet transition cursor-pointer font-sans">
                        {isDirType ? req.directorName : req.movieTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-graphite-light text-gray-350 font-mono">
                        {isDirType ? req.directorId : req.movieSlug}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-mono">
                      <span>Отправитель:</span>
                      <span className="text-amber-400 font-medium">{req.username}</span>
                      <span>•</span>
                      <span>{req.userEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString("ru-RU")} в {new Date(req.createdAt).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {req.status === "pending" && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold text-[10px] uppercase">
                        В ожидании
                      </span>
                    )}
                    {req.status === "approved" && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] uppercase">
                        ✓ Применено
                      </span>
                    )}
                    {req.status === "rejected" && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold text-[10px] uppercase">
                        ✕ Отклонено
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-4">
                  {/* User Issue Description */}
                  <div className="bg-graphite-dark/60 border border-graphite-light p-3.5 rounded-lg">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-garnet" />
                      <span>Описание проблемы от пользователя</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed italic">
                      &ldquo;{req.description}&rdquo;
                    </p>
                  </div>

                  {/* Diff comparison preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-gray-450 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>Предлагаемые изменения ({diffs.length})</span>
                      </h4>
                      <button
                        onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                        className="text-[11px] text-garnet hover:underline font-mono cursor-pointer"
                      >
                        {isExpanded ? "Свернуть сравнение" : "Развернуть сравнение"}
                      </button>
                    </div>

                    {isExpanded ? (
                      diffs.length === 0 ? (
                        <div className="text-xs text-gray-400 italic">
                          Изменений не обнаружено. Данные ИИ полностью сходятся с текущими.
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                          {diffs.map((diff, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-graphite-dark/30 p-3 rounded-lg border border-graphite-light/50">
                              <div className="md:col-span-2 text-xs font-bold text-gray-300 font-mono self-start pt-1">
                                {diff.field}
                              </div>
                              <div className="md:col-span-5 text-xs text-rose-400/90 bg-rose-950/10 border border-rose-500/10 p-2.5 rounded line-through overflow-hidden break-words leading-relaxed">
                                {diff.originalVal}
                              </div>
                              <div className="md:col-span-5 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded overflow-hidden break-words leading-relaxed relative">
                                <span className="absolute top-1 right-1 text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1 rounded">Новое</span>
                                {diff.proposedVal}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>Затронуто полей: {diffs.length}.</span>
                        <button
                          onClick={() => setExpandedRequestId(req.id)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Показать детальные различия
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action buttons (only for pending) */}
                  {req.status === "pending" && (
                    <div className="pt-3 border-t border-graphite-light flex justify-end gap-3.5">
                      <button
                        disabled={processingId !== null}
                        onClick={() => handleAction(req.id, "reject")}
                        className="px-4 py-2 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Отклонить правки</span>
                      </button>

                      <button
                        disabled={processingId !== null}
                        onClick={() => handleAction(req.id, "approve")}
                        className="px-5 py-2 rounded-lg bg-emerald-650 hover:bg-emerald-600 border border-emerald-500/25 text-white text-xs font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Одобрить и Применить</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
