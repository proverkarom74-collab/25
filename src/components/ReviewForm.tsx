import React, { useState, useMemo, useEffect } from "react";
import { RatingBreakdown, calculateOverallRating, UserReview } from "../types";
import { useStore } from "../store";
import { Star, HelpCircle, Save, Sparkles, Loader2, Info, RotateCcw } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

// Custom Tooltip component for the trend chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-graphite-dark border border-graphite-light p-2.5 rounded-lg shadow-xl text-[11px] select-none">
        <p className="font-bold text-white leading-tight mb-1">{data.title}</p>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-gray-400">{data.date}:</span>
          <span className="text-garnet font-extrabold">★ {data.rating} / 100</span>
        </div>
      </div>
    );
  }
  return null;
};

export function ReviewForm() {
  const { currentMovie, submitReview, user } = useStore();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Draft saving & restoring state
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Initialize rating breakouts
  const [story, setStory] = useState(7);
  const [acting, setActing] = useState(7);
  const [visuals, setVisuals] = useState(7);
  const [sound, setSound] = useState(7);
  const [genreMatch, setGenreMatch] = useState(7);

  // Active dragged slider for haptic feedback pulse
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch logged-in user reviews to draw critical trend line chart
  useEffect(() => {
    if (!user) {
      setUserReviews([]);
      return;
    }

    let active = true;
    const fetchUserHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/users/${user.username}`);
        if (!res.ok) throw new Error("Failed to load user profile");
        const data = await res.json();
        if (active && data.reviews) {
          // Sort oldest to newest (chronological order)
          const sorted = [...data.reviews].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setUserReviews(sorted);
        }
      } catch (err) {
        console.error("Error loading user review history for chart:", err);
      } finally {
        if (active) setLoadingHistory(false);
      }
    };

    fetchUserHistory();
    return () => {
      active = false;
    };
  }, [user, success]);

  const chartData = useMemo(() => {
    // Take the last 10 reviews in chronological order
    const last10 = userReviews.slice(-10);
    return last10.map((r, idx) => ({
      index: idx + 1,
      title: r.titleName,
      rating: r.averageRating,
      date: new Date(r.createdAt).toLocaleDateString("ru-RU", { month: "short", day: "numeric" }),
    }));
  }, [userReviews]);

  const averageAllReviews = useMemo(() => {
    if (userReviews.length === 0) return 0;
    const sum = userReviews.reduce((acc, r) => acc + r.averageRating, 0);
    return Math.round(sum / userReviews.length);
  }, [userReviews]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setActiveSlider(null);
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, []);

  // Load draft when currentMovie changes
  useEffect(() => {
    if (currentMovie) {
      const savedDraft = localStorage.getItem(`review_draft_${currentMovie.id}`);
      if (savedDraft) {
        setText(savedDraft);
        setSavingStatus("saved");
      } else {
        setText("");
        setSavingStatus("idle");
      }
    }
  }, [currentMovie]);

  // Auto-save draft as user types
  useEffect(() => {
    if (!currentMovie) return;

    // Check if text is actually different from last saved draft to prevent saving idle inputs on mount
    const saved = localStorage.getItem(`review_draft_${currentMovie.id}`) || "";
    if (text === saved) {
      return;
    }

    setSavingStatus("saving");
    const timer = setTimeout(() => {
      if (text.trim()) {
        localStorage.setItem(`review_draft_${currentMovie.id}`, text);
        setSavingStatus("saved");
      } else {
        localStorage.removeItem(`review_draft_${currentMovie.id}`);
        setSavingStatus("idle");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [text, currentMovie]);

  const categories: { key: keyof RatingBreakdown; val: number; set: (v: number) => void; label: string; desc: string }[] = [
    { key: "story", val: story, set: setStory, label: "Сюжет и сценарий", desc: "Логичность повествования, глубина идей и раскрытие тем" },
    { key: "acting", val: acting, set: setActing, label: "Актёрская игра", desc: "Эмпатия, достоверность эмоций и химия между персонажами" },
    { key: "visuals", val: visuals, set: setVisuals, label: "Визуал и съёмка", desc: "Операторская работа, съемка, цветокоррекция, костюмы, эффекты" },
    { key: "sound", val: sound, set: setSound, label: "Музыка и звук", desc: "Музыкальная атмосфера, звуковая партитура, озвучка" },
    { key: "genreMatch", val: genreMatch, set: setGenreMatch, label: "Соответствие жанру", desc: "Насколько фильм верен жанру (Оценка 1-10 работает как множитель x1 - x2.5)" },
  ];

  // Live average of scores (Max 100)
  const calculatedAverage = useMemo(() => {
    return calculateOverallRating({ story, acting, visuals, sound, genreMatch });
  }, [story, acting, visuals, sound, genreMatch]);

// Vibe tag text dependent on rating (1-100)
  const getVerdictByRating = (score: number) => {
    if (score >= 90) return { text: "Абсолютный Шедевр", color: "text-emerald-400" };
    if (score >= 75) return { text: "Великолепно", color: "text-emerald-500" };
    if (score >= 60) return { text: "Очень Хорошо", color: "text-amber-400" };
    if (score >= 45) return { text: "Приемлемо", color: "text-gray-300" };
    if (score >= 30) return { text: "Слабо", color: "text-orange-400" };
    return { text: "Хлам / Провал", color: "text-red-500" };
  };

  const getRatingDescription = (key: keyof RatingBreakdown, val: number) => {
    const roundVal = Math.round(val);
    const mult = (1 + ((val - 1) / 9) * 1.5).toFixed(2);

    if (key === "story") {
      switch (roundVal) {
        case 1: return "Полный бред и хаос. Сюжет написан левой пяткой, никакой логики или интриги не обнаружено.";
        case 2: return "Дыра на дыре в сценарии. Персонажи творят глупости, а происходящее вызывает фейспалм.";
        case 3: return "Скучно и затянуто. История провисает на каждом шагу, хочется перемотать.";
        case 4: return "Очень банально. Шаблонный сюжет со всеми известными штампами и предсказуемой развязкой.";
        case 5: return "Средне. Простой проходной сюжет под попкорн на один беззаботный вечер.";
        case 6: return "Нормально, есть интрига. Повествование предсказуемо, но свою планку хорошего кино держит.";
        case 7: return "Интересно следить за происходящим. Хорошая история с парой неплохих находок.";
        case 8: return "Достойный сюжет! Увлекает с первых минут, держит напряжение и радует твистами.";
        case 9: return "Отличная, многослойная история. Первоклассная драма с глубоким смыслом и посылом.";
        case 10: return "Шедевр драматургии! Идеально выверенная история, вводящая в литературный экстаз.";
        default: return "";
      }
    }
    if (key === "acting") {
      switch (roundVal) {
        case 1: return "Фальшивые кривляния. Ни одной живой эмоции, актеры будто читают текст под гипнозом.";
        case 2: return "Абсолютно картонная игра. Персонажи не вызывают ни капли сопереживания.";
        case 3: return "Слабо. Смотрится как любительский школьный драмкружок на утреннике.";
        case 4: return "Сухо и без души. Отыграно чисто ради гонорара, химии между героями нет.";
        case 5: return "Обычная игра без ярких взлетов и фатальных провалов. Пойдет.";
        case 6: return "Актёры стараются и играют вполне убедительно во многих сценах.";
        case 7: return "Хорошая актерская работа. Веришь эмоциям героев и искренне сопереживаешь им.";
        case 8: return "Прекрасный перформанс! Тонко переданные характеры, химия на экране сияет.";
        case 9: return "Потрясающая игра! Невероятный спектр эмоций и максимально глубокое вживание в образ.";
        case 10: return "Гениальное исполнение! Прожили жизни героев на экране, Оскар в студию!";
        default: return "";
      }
    }
    if (key === "visuals") {
      switch (roundVal) {
        case 1: return "Вырвите мне глаза. Халтурный монтаж, ужасный свет и спецэффекты уровня Paint.";
        case 2: return "Глазам больно. Темно, размыто и полностью отсутствует какое-либо видение стиля.";
        case 3: return "Очень скромно. Блеклые цвета, заезженные ракурсы и дешевые декорации.";
        case 4: return "Проходная картинка. Снято на скорую руку без единой красивой или необычной сцены.";
        case 5: return "Стандартный визуал. Снято аккуратно, но без претензии на художественный восторг.";
        case 6: return "Симпатично. Есть приятные кадры, эффекты не режут глаза и выглядят опрятно.";
        case 7: return "Привлекательно. Достойная операторская работа, приятная палитра и сочные кадры.";
        case 8: return "Стильный и красивый фильм! Многие кадры хочется сохранить в виде обоев на рабочий стол.";
        case 9: return "Настоящее эстетическое наслаждение! Шедевральная композиция кадра и шикарный визуал.";
        case 10: return "Визуальный гипноз! Каждая сцена — шедевр искусства, поражающий воображение.";
        default: return "";
      }
    }
    if (key === "sound") {
      switch (roundVal) {
        case 1: return "Кровь из ушей. Голоса хрипят, эффекты глушат речь, а музыка бесит.";
        case 2: return "Плоский, дешевый звук. Кажется, записывали в консервную банку.";
        case 3: return "Пресно. Невзрачный фоновый шум, ленивая озвучка и отсутствие атмосферы.";
        case 4: return "Простой монотонный саундтрек, который никак не помогает погружению.";
        case 5: return "Нормальный звук. Все слышно отчетливо, саундтрек звучит фоном и не мешает.";
        case 6: return "Достойное сведение. Музыкальные темы приятные и вовремя подчеркивают атмосферу.";
        case 7: return "Хороший саундтрек! Музыка создает нужный настрой и держит правильный ритм.";
        case 8: return "Отличный аудио-дизайн и сочный объемный звук. Саундтрек врезается в память.";
        case 9: return "Завораживающий музыкальный ряд, пробирающий до глубины души своим величием.";
        case 10: return "Аудио-шедевр! Идеальный ОСТ и невероятная глубина звуков, которые застревают в плеере.";
        default: return "";
      }
    }
    if (key === "genreMatch") {
      switch (roundVal) {
        case 1: return `Вообще мимо. Ни одного элемента заявленного жанра тут нет (Множитель: x${mult})`;
        case 2: return `Полная несостыковка. Ожидал одного жанра, а подсунули нелепый винегрет (Множитель: x${mult})`;
        case 3: return `Каноны жанра едва заметны под грудой чуждых элементов и клише (Множитель: x${mult})`;
        case 4: return `Слабое соответствие. Заявленный жанр передан поверхностно и неуклюже (Множитель: x${mult})`;
        case 5: return `Базовый уровень. Шаблон по учебнику соблюден, но абсолютно без изюминки (Множитель: x${mult})`;
        case 6: return `Жанр хорошо чувствуется, ключевые приемы сыграны достойно (Множитель: x${mult})`;
        case 7: return `Крепкое попадание. Каноны жанра отработаны на славу и радуют фанатов (Множитель: x${mult})`;
        case 8: return `Шикарный представитель своего жанра с сохранением всех любимых фишек (Множитель: x${mult})`;
        case 9: return `Супер-эталон! Образцовый пример жанра, раскрывающий его лучшие стороны (Множитель: x${mult})`;
        case 10: return "Квинтэссенция жанра! Задает планку качества и величие стандартов на годы вперед (Множитель: x2.50)";
        default: return "";
      }
    }
    return "";
  };

  const verdict = getVerdictByRating(calculatedAverage);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorLocal("Пожалуйста, сначала войдите в ваш аккаунт.");
      return;
    }

    if (text.trim().length < 15) {
      setErrorLocal("Текст рецензии должен быть длиной не менее 15 символов для аргументированности.");
      return;
    }

    setSubmitting(true);
    setErrorLocal(null);

    const ratingsObj: RatingBreakdown = {
      story,
      acting,
      visuals,
      sound,
      genreMatch,
    };

    const ok = await submitReview(text, ratingsObj);
    setSubmitting(false);

    if (ok) {
      setSuccess(true);
      setText("");
      if (currentMovie) {
        localStorage.removeItem(`review_draft_${currentMovie.id}`);
        setSavingStatus("idle");
      }
      // Reset sliders slightly
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  if (!currentMovie) return null;

  return (
    <div className="bg-graphite border border-graphite-light rounded-xl p-6 shadow-xl relative overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-garnet to-garnet-light absolute top-0 left-0 right-0" />
      
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-garnet" />
        <h3 className="text-lg font-bold text-white">Выписать рецензию</h3>
      </div>

      <p className="text-xs text-gray-400 mb-6 leading-relaxed">
        Оцените произведение по 5 профессиональным категориям. Соответствие жанру (1-10) преобразуется в множитель, формируя итоговую оценку из 100 возможных баллов!
      </p>

      {success ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center animate-scale-up py-12">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Star className="w-8 h-8 text-emerald-400 fill-current" />
          </div>
          <h4 className="text-md font-bold text-white">Рецензия опубликована!</h4>
          <p className="text-xs text-gray-400 mt-2">
            Ваши оценки успешно сохранены, и средневзвешенный балл "{currentMovie.title}" пересчитан.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left side: Sliders */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-graphite-light pb-2 mb-2">
                Сетка Оценок (1-10)
              </h4>
              
              {categories.map((cat) => (
                <div key={cat.key} className="space-y-1 block">
                  <div className="flex justify-between items-baseline">
                    <div className="relative group inline-flex items-center gap-1 cursor-help pb-1">
                      <span className="text-xs font-bold text-gray-200 border-b border-dashed border-gray-500 pb-0.5 group-hover:text-garnet group-hover:border-garnet transition">
                        {cat.label}
                      </span>
                      <HelpCircle className="w-3 h-3 text-gray-500 group-hover:text-garnet transition shrink-0" />
                      
                      {/* Tooltip content */}
                      <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-graphite border border-graphite-light text-[11px] text-gray-300 rounded-lg shadow-2xl z-50 pointer-events-none transition-all duration-150 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 flex flex-col gap-1">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-garnet shrink-0" />
                          {cat.label}
                        </div>
                        <p className="leading-relaxed text-gray-400 font-normal">
                          {cat.desc}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold text-garnet-light bg-garnet/10 px-2 py-0.5 rounded transition-all duration-150 ${
                      activeSlider === cat.key ? "ring-2 ring-garnet animate-pulse scale-110 text-white bg-garnet" : ""
                    }`}>
                      {cat.val}
                    </span>
                  </div>
                  
                  <p className={`text-[10px] leading-relaxed transition-colors duration-150 min-h-[32px] flex items-center ${
                    cat.val <= 3 ? "text-red-400/95" : cat.val <= 6 ? "text-gray-400" : cat.val <= 9 ? "text-emerald-400/90" : "text-amber-400 font-medium"
                  }`}>
                    {getRatingDescription(cat.key, cat.val)}
                  </p>
                  
                  <div className="relative pb-2">
                    {/* Soft ambient glow overlay on the slider track while dragging */}
                    <div className={`absolute inset-0 bg-garnet/10 rounded-lg blur-xs transition-opacity duration-200 pointer-events-none ${
                      activeSlider === cat.key ? "opacity-100 animate-pulse" : "opacity-0"
                    }`} />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={cat.val}
                      onChange={(e) => cat.set(Number(e.target.value))}
                      onPointerDown={() => setActiveSlider(cat.key)}
                      className={`relative w-full accent-garnet cursor-pointer bg-graphite-dark rounded h-1.5 mt-1 focus:outline-none transition-all duration-150 ${
                        activeSlider === cat.key ? "scale-[1.01] brightness-125" : ""
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: Live calculations and text fields */}
            <div className="flex flex-col justify-between gap-4 bg-graphite-dark/40 border border-graphite-light/50 p-4 rounded-xl">
              {/* Calculated dynamic average */}
              <div className="text-center p-3 border-b border-graphite-light pb-4">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Итоговая Ваша Оценка
                </p>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="w-8 h-8 text-garnet fill-current animate-pulse" />
                  <span className="text-4xl font-extrabold font-mono text-white tracking-tighter">
                    {calculatedAverage}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">/ 100</span>
                </div>

                <p className={`text-xs font-bold mt-1.5 ${verdict.color}`}>
                  {verdict.text}
                </p>
              </div>

              {/* Text review field */}
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <label htmlFor="review-text-area" className="block">
                    Текст рецензии и ваши мысли
                  </label>
                  {savingStatus === "saving" && (
                    <span className="text-[9px] font-mono text-gray-500 animate-pulse normal-case font-normal">сохранение...</span>
                  )}
                  {savingStatus === "saved" && text.trim() && (
                    <span className="text-[9px] font-mono text-emerald-500 normal-case font-normal">сохранено</span>
                  )}
                </div>
                <textarea
                  id="review-text-area"
                  required
                  rows={6}
                  placeholder="Опишите ваши впечатления от фильма, раскройте сильные и слабые стороны сюжета, актерских работ. (Почему вы поставили именно такие детальные баллы?)"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (errorLocal) setErrorLocal(null);
                  }}
                  className="w-full bg-graphite border border-graphite-light text-xs text-gray-200 rounded-lg p-3 placeholder-gray-600 focus:outline-none focus:border-garnet focus:ring-1 focus:ring-garnet leading-relaxed font-sans"
                />
                
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Минимум 15 символов</span>
                  <span className={text.trim().length >= 15 ? "text-emerald-400" : "text-gray-500"}>
                    {text.trim().length} символов
                  </span>
                </div>
              </div>

              {errorLocal && (
                <div className="bg-garnet/20 border border-garnet/40 p-2 rounded-lg flex items-start gap-1.5 text-[11.5px] text-gray-200">
                  <Info className="w-3.5 h-3.5 text-garnet shrink-0" />
                  <span>{errorLocal}</span>
                </div>
              )}

              {showConfirmReset ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-red-200">
                    <Info className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                    <span>Вы уверены, что хотите вернуть оценки к нейтральной отметке (5) и полностью очистить поле ввода?</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStory(5);
                        setActing(5);
                        setVisuals(5);
                        setSound(5);
                        setGenreMatch(5);
                        setText("");
                        if (currentMovie) {
                          localStorage.removeItem(`review_draft_${currentMovie.id}`);
                        }
                        setSavingStatus("idle");
                        setErrorLocal(null);
                        setShowConfirmReset(false);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-widest py-2.5 px-3 rounded-lg transition text-center cursor-pointer font-semibold"
                    >
                      Да, сбросить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(false)}
                      className="flex-1 bg-graphite border border-graphite-light hover:bg-graphite-light text-gray-300 text-xs font-mono font-bold uppercase tracking-widest py-2.5 px-3 rounded-lg transition text-center cursor-pointer font-semibold"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full sm:w-auto bg-graphite border border-graphite-light hover:border-gray-500 hover:bg-graphite-light text-gray-400 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider py-2 px-3.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Сбросить</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !user}
                    className="w-full sm:flex-1 bg-garnet hover:bg-garnet-light disabled:bg-graphite border-none text-white text-xs font-mono font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-garnet/10"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Публикация...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{user ? "Опубликовать рецензию" : "Войдите чтобы оценить"}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User historical personal analytics & rating trend chart */}
          {user && userReviews.length > 0 && (
            <div className="border-t border-graphite-light/20 pt-5 mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <Sparkles className="w-3.5 h-3.5 text-garnet" />
                    Линейный тренд вашей критичности
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">
                    Анализ хронологии последних {Math.min(10, userReviews.length)} рецензий. Позволяет увидеть динамику вашей строгости оценивания.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold select-none shrink-0">
                  <div className="px-2.5 py-1 bg-graphite rounded-lg border border-graphite-light text-gray-300">
                    Всего отзывов: <span className="text-white font-black">{userReviews.length}</span>
                  </div>
                  <div className="px-2.5 py-1 bg-garnet/10 rounded-lg border border-garnet/25 text-garnet-light">
                    Средний балл: <span className="text-white font-black">{averageAllReviews}</span>
                  </div>
                </div>
              </div>

              <div className="h-40 bg-graphite-dark/20 rounded-xl border border-graphite-light/20 p-3 relative">
                {loadingHistory && userReviews.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-graphite-dark/60 rounded-xl">
                    <span className="text-[11px] font-mono text-gray-400 animate-pulse">Загружаем тренд критичности...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.08)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'currentColor', fontSize: 9, opacity: 0.7 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: 'currentColor', fontSize: 9, opacity: 0.7 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {averageAllReviews > 0 && (
                        <ReferenceLine 
                          y={averageAllReviews} 
                          stroke="#800001" 
                          strokeDasharray="3 3" 
                          strokeWidth={1}
                          ifOverflow="extendDomain"
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#800001" 
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#800001', strokeWidth: 1.5, stroke: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#ab0204', strokeWidth: 2 }}
                        animationDuration={600}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {user && !loadingHistory && userReviews.length === 0 && (
            <div className="border-t border-graphite-light/20 pt-4 mt-6 text-center select-none">
              <p className="text-[10.5px] text-gray-500 font-mono">
                ✍️ Напишите вашу первую рецензию, чтобы построить личную траекторию критичности оценок!
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
