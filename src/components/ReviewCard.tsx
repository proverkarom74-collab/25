import React, { useState } from "react";
import { UserReview, RatingBreakdown } from "../types";
import { useStore } from "../store";
import { Star, Heart, Trash2, Calendar, ChevronDown, ChevronUp, Clock, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { RatingBadge } from "./RatingBadge";
import { getRatingColor } from "../lib/ratingUtils";


interface ReviewCardProps {
  review: UserReview;
  showMovieLink?: boolean;
  key?: any;
}

export function ReviewCard({ review, showMovieLink = false }: ReviewCardProps) {
  const { user, likeReview, deleteReview, setPage, submitComment } = useStore();
  const [expandRatings, setExpandRatings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isLikedByMe = user ? review.likes.includes(user.id) : false;
  const isMine = user ? review.userId === user.id : false;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!user) {
      alert("Войдите в систему, чтобы комментировать");
      return;
    }
    setIsSubmittingComment(true);
    const ok = await submitComment(review.id, newCommentText.trim());
    if (ok) {
      setNewCommentText("");
    }
    setIsSubmittingComment(false);
  };

  const translationMap: Record<keyof RatingBreakdown, { label: string; desc: string }> = {
    story: { label: "Сюжет", desc: "Убедительность истории и идеи" },
    acting: { label: "Актёры", desc: "Эмпатия и мастерство исполнения" },
    visuals: { label: "Визуал", desc: "Операторская работа, съемка и цвета" },
    sound: { label: "Звук", desc: "Саундтрек, музыка и шумы" },
    genreMatch: { label: "Жанр", desc: "Соответствие канонам жанра" }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="ReviewCard bg-graphite border border-graphite-light rounded-xl p-5 relative flex flex-col gap-4 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(128,0,1,0.15)] hover:border-garnet/40 shadow-lg">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={review.userAvatar}
            alt={review.userDisplayName}
            onClick={() => setPage("profile", "", review.username)}
            className="w-10 h-10 rounded-full object-cover border border-garnet/40 cursor-pointer hover:scale-105 transition"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 
              onClick={() => setPage("profile", "", review.username)}
              className="text-sm font-bold text-white hover:text-garnet transition cursor-pointer"
            >
              {review.userDisplayName}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
              <span>@{review.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Global Average score of this review */}
        <div className="flex flex-col items-end">
          <RatingBadge rating={review.averageRating} size="medium" forceScale10={true} showLabel={false} />
          {isMine && (
            <span className="text-[9px] uppercase tracking-wide text-garnet font-bold font-mono mt-1.5 animate-pulse">
              Ваша рецензия
            </span>
          )}
        </div>
      </div>

      {/* Optional movie reference link (for profile tabs) */}
      {showMovieLink && (
        <div 
          onClick={() => setPage("title", review.titleSlug)}
          className="flex items-center gap-3 bg-graphite-dark hover:bg-graphite-light border border-graphite-light rounded-lg p-2.5 cursor-pointer transition text-xs"
        >
          <img 
            src={review.titlePoster} 
            alt={review.titleName} 
            className="w-7 h-10 object-cover rounded" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h5 className="font-bold text-white hover:text-garnet transition leading-tight">
              {review.titleName}
            </h5>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
              {review.titleType === "movie" ? "Полный метр" : review.titleType === "tv" ? "Сериал" : review.titleType === "anime" ? "Аниме" : "Короткометражка"} • {review.titleYear}
            </p>
          </div>
        </div>
      )}

      {/* Review Text */}
      <div className="text-sm text-gray-200 leading-relaxed font-normal whitespace-pre-wrap font-sans">
        {review.text}
      </div>

      {/* Expand/Collapse Ratings Breakdown Panel */}
      <div className="border-t border-graphite-light pt-3">
        <button
          onClick={() => setExpandRatings(!expandRatings)}
          className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-garnet transition cursor-pointer"
        >
          {expandRatings ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Скрыть детальные оценки</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Показать детальные оценки ({Object.keys(review.ratings).length} категорий)</span>
            </>
          )}
        </button>

        <div 
          className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 transition-all duration-500 ease-in-out overflow-hidden"
          style={{
            maxHeight: expandRatings ? "450px" : "0px",
            opacity: expandRatings ? 1 : 0,
            marginTop: expandRatings ? "12px" : "0px",
            pointerEvents: expandRatings ? "auto" : "none"
          }}
        >
          {Object.entries(review.ratings).map(([key, val]) => {
            const info = translationMap[key as keyof RatingBreakdown];
            if (!info) return null;
            const categoryColor = getRatingColor(val);
            return (
              <div 
                key={key} 
                className="bg-graphite-dark/60 border border-graphite-light/50 p-2.5 rounded-lg transition-all"
                title={info.desc}
                style={{ borderColor: `${categoryColor}20` }}
              >
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                  {info.label}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-sm font-black font-mono" style={{ color: categoryColor }}>
                    {val}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">/10</span>
                </div>
                <div className="w-full bg-graphite rounded-full h-1 mt-1.5 overflow-hidden">
                  <div 
                    className="h-1 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${(val / 10) * 100}%`,
                      backgroundColor: categoryColor
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer controls: Like, comment, delete */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-graphite-light text-gray-400 text-xs">
        <div className="flex items-center gap-2">
          {/* Like button */}
          <button
            onClick={() => likeReview(review.id)}
            className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-full hover:bg-[#1a1a1a] transition cursor-pointer group/like ${
              isLikedByMe ? "text-garnet-light font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            <motion.div
              key={isLikedByMe ? "liked" : "unliked"}
              className="flex items-center justify-center shrink-0"
              animate={isLikedByMe ? {
                scale: [1, 1.45, 0.9, 1.2, 1],
                rotate: [0, -12, 12, -6, 0]
              } : {
                scale: [1, 0.85, 1]
              }}
              transition={{
                duration: isLikedByMe ? 0.65 : 0.25,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${
                  isLikedByMe 
                    ? "fill-current text-garnet filter drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" 
                    : "text-gray-500 group-hover/like:text-gray-300"
                }`} 
              />
            </motion.div>
            <span className="transition-all tabular-nums font-mono text-[11px] font-medium">
              {review.likes.length || 0}
            </span>
          </button>

          {/* Comments button toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-full hover:bg-[#1a1a1a] transition cursor-pointer ${
              showComments ? "text-garnet-light font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            <span className="transition-all tabular-nums font-mono text-[11px] font-medium">
              {(review.comments || []).length}
            </span>
          </button>
        </div>

        {isMine && (
          <button
            onClick={() => {
              if (confirm("Вы действительно хотите удалить рецензию?")) {
                deleteReview(review.id);
              }
            }}
            className="flex items-center gap-1 text-gray-500 hover:text-red-500 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить</span>
          </button>
        )}
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="border-t border-graphite-light/50 pt-4 mt-2 space-y-4 animate-fade-in text-left">
          <h5 className="text-[11px] font-bold text-gray-400 font-mono uppercase tracking-wider">
            Комментарии ({ (review.comments || []).length })
          </h5>

          {/* Comments List */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {(!review.comments || review.comments.length === 0) ? (
              <p className="text-gray-500 text-xs font-mono py-1">Никто еще не прокомментировал эту рецензию.</p>
            ) : (
              review.comments.map((comm) => (
                <div key={comm.id} className="bg-graphite-dark/50 border border-graphite-light/35 p-2.5 rounded-xl text-xs leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={comm.userAvatar}
                      alt={comm.userDisplayName}
                      className="w-5 h-5 rounded-full object-cover border border-garnet/30 cursor-pointer"
                      onClick={() => setPage("profile", "", comm.username)}
                    />
                    <div className="flex items-baseline gap-1.5">
                      <span 
                        onClick={() => setPage("profile", "", comm.username)}
                        className="font-bold text-white hover:text-garnet transition cursor-pointer"
                      >
                        {comm.userDisplayName}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">@{comm.username}</span>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono ml-auto">
                      {formatDate(comm.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-200">{comm.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Type form input */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 border-t border-graphite-light/10 pt-2.5">
              <input
                type="text"
                placeholder="Напишите комментарий..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-graphite-dark border border-graphite-light/60 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none focus:border-garnet/40 text-gray-200"
                disabled={isSubmittingComment}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newCommentText.trim()}
                className="bg-garnet hover:bg-garnet-light text-white text-[10px] px-3.5 py-1.5 rounded-lg transition font-bold font-mono uppercase cursor-pointer disabled:opacity-40"
              >
                {isSubmittingComment ? "..." : "ОК"}
              </button>
            </form>
          ) : (
            <p className="text-gray-500 text-[10px] font-mono text-center">
              Пожалуйста, войдите, чтобы комментировать.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
