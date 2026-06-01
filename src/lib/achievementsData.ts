import { Achievement } from "../types";

export const ACHIEVEMENTS: Achievement[] = [
  // 1. Прогресс
  {
    id: "first-frame",
    title: "1-й кадр",
    description: "Написать первую рецензию",
    icon: "Award",
    rarity: "common",
    category: "Прогресс"
  },
  {
    id: "viewer-5",
    title: "Зритель",
    description: "Написать 5 рецензий",
    icon: "Eye",
    rarity: "common",
    category: "Прогресс"
  },
  {
    id: "critic-novice-10",
    title: "Критик-новичок",
    description: "Написать 10 рецензий",
    icon: "Award",
    rarity: "common",
    category: "Прогресс"
  },
  {
    id: "twenty-fifth-frame-25",
    title: "25-й кадр",
    description: "Написать 25 рецензий",
    icon: "Film",
    rarity: "rare",
    category: "Прогресс"
  },
  {
    id: "active-critic-50",
    title: "Активный рецензент",
    description: "Написать 50 рецензий",
    icon: "Flame",
    rarity: "rare",
    category: "Прогресс"
  },
  {
    id: "film-critic-100",
    title: "Кинокритик",
    description: "Написать 100 рецензий",
    icon: "Medal",
    rarity: "epic",
    category: "Прогресс"
  },
  {
    id: "screen-master-250",
    title: "Мастер экрана",
    description: "Написать 250 рецензий",
    icon: "Sparkles",
    rarity: "epic",
    category: "Прогресс"
  },
  {
    id: "cinema-legend-500",
    title: "Легенда кинематографа",
    description: "Написать 500 рецензий",
    icon: "Crown",
    rarity: "legendary",
    category: "Прогресс"
  },
  {
    id: "immortal-1000",
    title: "Бессмертный",
    description: "Написать 1000 рецензий",
    icon: "Activity",
    rarity: "legendary",
    category: "Прогресс"
  },

  // 2. Жанры
  {
    id: "animenik-30",
    title: "Анимешник",
    description: "30 рецензий на аниме",
    icon: "Tv",
    rarity: "rare",
    category: "Жанры"
  },
  {
    id: "tv-addict-40",
    title: "Сериальный наркоман",
    description: "40 рецензий на сериалы",
    icon: "Play",
    rarity: "rare",
    category: "Жанры"
  },
  {
    id: "blockbuster-enthusiast-30",
    title: "Блокбастер-энтузиаст",
    description: "30 рецензий на высокобюджетные фильмы",
    icon: "Zap",
    rarity: "rare",
    category: "Жанры"
  },
  {
    id: "arthouse-gourmet-20",
    title: "Артхаусный гурман",
    description: "20 рецензий на артхаусное кино",
    icon: "Coffee",
    rarity: "epic",
    category: "Жанры"
  },
  {
    id: "cartoon-expert-25",
    title: "Мультипликационный эксперт",
    description: "25 рецензий на мультфильмы",
    icon: "Smile",
    rarity: "rare",
    category: "Жанры"
  },
  {
    id: "documentalist-15",
    title: "Документалист",
    description: "15 рецензий на документальное кино",
    icon: "BookOpen",
    rarity: "rare",
    category: "Жанры"
  },
  {
    id: "short-connoisseur-20",
    title: "Короткометражный ценитель",
    description: "20 рецензий на короткометражки",
    icon: "Clock",
    rarity: "rare",
    category: "Жанры"
  },
  {
    id: "versatile-critic-12",
    title: "Разносторонний критик",
    description: "Рецензии минимум в 12 разных жанрах",
    icon: "Layers",
    rarity: "epic",
    category: "Жанры"
  },
  {
    id: "deep-specialist-50",
    title: "Глубокий специалист",
    description: "50+ рецензий в одном жанре",
    icon: "Compass",
    rarity: "epic",
    category: "Жанры"
  },

  // 3. Влияние
  {
    id: "voice-of-people",
    title: "Голос народа",
    description: "Одна рецензия набрала 50+ лайков",
    icon: "ThumbsUp",
    rarity: "common",
    category: "Влияние"
  },
  {
    id: "popular-critic",
    title: "Популярный критик",
    description: "Одна рецензия набрала 200+ лайков",
    icon: "Heart",
    rarity: "rare",
    category: "Влияние"
  },
  {
    id: "king-of-likes",
    title: "Король лайков",
    description: "Одна рецензия набрала 500+ лайков",
    icon: "Star",
    rarity: "epic",
    category: "Влияние"
  },
  {
    id: "influential-voice",
    title: "Влиятельный голос",
    description: "Суммарно 1000+ лайков на все рецензии",
    icon: "Megaphone",
    rarity: "legendary",
    category: "Влияние"
  },
  {
    id: "discussed",
    title: "Обсуждаемый",
    description: "Одна рецензия получила 30+ комментариев",
    icon: "MessageSquare",
    rarity: "rare",
    category: "Влияние"
  },

  // 4. Особые
  {
    id: "perfectionist-10",
    title: "Перфекционист",
    description: "10 рецензий с заполненными оценками по всем 5 категориям",
    icon: "CheckCircle",
    rarity: "epic",
    category: "Особые"
  },
  {
    id: "pioneer",
    title: "Первопроходец",
    description: "Написать рецензию на произведение, у которого было меньше 5 рецензий",
    icon: "Flag",
    rarity: "epic",
    category: "Особые"
  },
  {
    id: "night-critic-10",
    title: "Ночной критик",
    description: "Написать 10 рецензий в период с 00:00 до 06:00",
    icon: "Moon",
    rarity: "epic",
    category: "Особые"
  },
  {
    id: "marathoner-7",
    title: "Марафонец",
    description: "Написать 7 рецензий за один день",
    icon: "TrendingUp",
    rarity: "epic",
    category: "Особые"
  },
  {
    id: "critic-of-the-month",
    title: "Критик месяца",
    description: "Получить звание лучшего рецензента месяца (ежемесячно)",
    icon: "Calendar",
    rarity: "legendary",
    category: "Особые"
  },
  {
    id: "golden-pen",
    title: "Золотое перо",
    description: "Средняя оценка всех рецензий выше 8.5 (минимум 30 рецензий)",
    icon: "PenTool",
    rarity: "legendary",
    category: "Особые"
  },

  // 5. Сезонные
  {
    id: "new-year-marathon",
    title: "Новогодний марафон",
    description: "Написать 15 рецензий в декабре-январе",
    icon: "Calendar",
    rarity: "rare",
    category: "Сезонные"
  },
  {
    id: "halloween-horror",
    title: "Хэллоуин-ужастик",
    description: "10 рецензий ужасов в октябре",
    icon: "Moon",
    rarity: "rare",
    category: "Сезонные"
  },
  {
    id: "summer-blockbuster",
    title: "Летний блокбастер",
    description: "12 рецензий на фильмы, вышедшие летом",
    icon: "Flame",
    rarity: "rare",
    category: "Сезонные"
  },
  {
    id: "autumn-arthouse",
    title: "Осенний артхаус",
    description: "8 рецензий артхауса в сентябре-ноябре",
    icon: "Coffee",
    rarity: "rare",
    category: "Сезонные"
  },

  // 6. Режиссёры / Авторские
  {
    id: "nolan-fan",
    title: "Нолановец",
    description: "10 рецензий на фильмы Кристофера Нолана",
    icon: "Film",
    rarity: "epic",
    category: "Режиссёры"
  },
  {
    id: "tarantino-fan",
    title: "Тарантино-фанат",
    description: "8 рецензий на фильмы Квентина Тарантино",
    icon: "Film",
    rarity: "epic",
    category: "Режиссёры"
  },
  {
    id: "villeneuve-fan",
    title: "Вселенная Дени",
    description: "7 рецензий на фильмы Дени Вильнёва",
    icon: "Compass",
    rarity: "epic",
    category: "Режиссёры"
  },
  {
    id: "hitchcock-fan",
    title: "Мастер саспенса",
    description: "6 рецензий на фильмы Альфреда Хичкока",
    icon: "Eye",
    rarity: "epic",
    category: "Режиссёры"
  },
  {
    id: "geek-cult",
    title: "Гик-культ",
    description: "9 рецензий на фильмы Эдгара Райта или Джеймса Ганна",
    icon: "Zap",
    rarity: "epic",
    category: "Режиссёры"
  },
  {
    id: "auteur-detective",
    title: "Авторский следопыт",
    description: "15 рецензий на фильмы разных авторских режиссёров (один режиссёр — максимум 2 рецензии)",
    icon: "Search",
    rarity: "epic",
    category: "Режиссёры"
  },

  // 7. География
  {
    id: "taste-traveler",
    title: "Путешественник вкуса",
    description: "Рецензии на фильмы из 20+ разных стран",
    icon: "Globe",
    rarity: "epic",
    category: "География"
  },
  {
    id: "japanophile",
    title: "Японофил",
    description: "25 рецензий на японское кино (включая аниме)",
    icon: "Tv",
    rarity: "epic",
    category: "География"
  },
  {
    id: "euro-critic",
    title: "Еврокритик",
    description: "20 рецензий на европейское авторское кино",
    icon: "Globe",
    rarity: "epic",
    category: "География"
  },
  {
    id: "korean-wave",
    title: "Корейская волна",
    description: "15 рецензий на южнокорейские фильмы и сериалы",
    icon: "TrendingUp",
    rarity: "rare",
    category: "География"
  },

  // 8. Стиль
  {
    id: "brevity-soul",
    title: "Краткость — сестра таланта",
    description: "20 рецензий длиной менее 400 символов",
    icon: "Award",
    rarity: "rare",
    category: "Стиль"
  },
  {
    id: "novelist",
    title: "Романист",
    description: "10 рецензий длиннее 1500 символов",
    icon: "History",
    rarity: "rare",
    category: "Стиль"
  },
  {
    id: "emoji-explosion",
    title: "Эмоциональный взрыв",
    description: "15 рецензий, содержащих 8+ эмодзи",
    icon: "Heart",
    rarity: "rare",
    category: "Стиль"
  },
  {
    id: "spoilerphobe",
    title: "Спойлерфоб",
    description: "10 рецензий с пометкой \"Без спойлеров\"",
    icon: "UserCheck",
    rarity: "rare",
    category: "Стиль"
  },
  {
    id: "honest-critic",
    title: "Честный критик",
    description: "20 рецензий с оценкой ниже 5.0",
    icon: "Award",
    rarity: "rare",
    category: "Стиль"
  },

  // 9. Сообщество
  {
    id: "mentor",
    title: "Ментор",
    description: "30 ответов в комментариях под чужими рецензиями",
    icon: "MessageSquare",
    rarity: "epic",
    category: "Сообщество"
  },
  {
    id: "duelist",
    title: "Дуэлянт",
    description: "Участвовать в 15 баттлах \"Фильм vs Фильм\"",
    icon: "Trophy",
    rarity: "rare",
    category: "Сообщество"
  },
  {
    id: "taste-collector",
    title: "Коллекционер вкуса",
    description: "Создать 20 публичных коллекций",
    icon: "Layers",
    rarity: "epic",
    category: "Сообщество"
  },
  {
    id: "active-voting",
    title: "Голосование активно",
    description: "Проголосовать в 10 ежемесячных премиях",
    icon: "Award",
    rarity: "rare",
    category: "Сообщество"
  },

  // 10. Челленджи
  {
    id: "encyclopedist",
    title: "Энциклопедист",
    description: "Написать рецензии общей длиной более 50 000 символов суммарно",
    icon: "BookOpen",
    rarity: "legendary",
    category: "Челленджи"
  },
  {
    id: "critical-look",
    title: "Критический взгляд",
    description: "Поставить 10 оценок ниже 30 баллов (суровый критик)",
    icon: "AlertCircle",
    rarity: "rare",
    category: "Челленджи"
  },
  {
    id: "gold-standard",
    title: "Золотой стандарт",
    description: "15 рецензий на шедевры (оценки выше 85 баллов)",
    icon: "Trophy",
    rarity: "epic",
    category: "Челленджи"
  },
  {
    id: "series-binge",
    title: "Сезонный запой",
    description: "Написать рецензии на 5 сериалов целиком (тип 'tv', у которых isEnded: true)",
    icon: "Tv",
    rarity: "epic",
    category: "Челленджи"
  },
  {
    id: "time-traveler",
    title: "Проводник времени",
    description: "Написать рецензии на фильмы из 7 разных десятилетий",
    icon: "History",
    rarity: "legendary",
    category: "Челленджи"
  },
  {
    id: "sleepless",
    title: "Без сна",
    description: "Написать 5 рецензий за одну ночь (с 00:00 до 08:00)",
    icon: "Moon",
    rarity: "epic",
    category: "Челленджи"
  },
  {
    id: "lone-warrior",
    title: "Один в поле воин",
    description: "Написать 3 рецензии на очень редкие фильмы (менее 3 рецензий на сайте)",
    icon: "Eye",
    rarity: "epic",
    category: "Челленджи"
  },
  {
    id: "retro-archaeologist",
    title: "Ретро-археолог",
    description: "30 рецензий на фильмы старше 30 лет",
    icon: "History",
    rarity: "epic",
    category: "Челленджи"
  },
  {
    id: "futurist",
    title: "Футурист",
    description: "30 рецензий на фильмы 2024–2026 годов",
    icon: "Sparkles",
    rarity: "rare",
    category: "Челленджи"
  },
  {
    id: "weekend-marathon",
    title: "Марафон выходных",
    description: "20 рецензий за одни выходные",
    icon: "Trophy",
    rarity: "epic",
    category: "Челленджи"
  },

  // 11. Легендарные
  {
    id: "critic-legend",
    title: "Критик-легенда",
    description: "3000 рецензий + 15 000 лайков",
    icon: "Crown",
    rarity: "legendary",
    category: "Легендарные"
  },
  {
    id: "cinema-encyclopedia",
    title: "Энциклопедия кино",
    description: "Рецензии во всех доступных жанрах (минимум 18 жанров)",
    icon: "Layers",
    rarity: "legendary",
    category: "Легендарные"
  },
  {
    id: "immortal-voice",
    title: "Бессмертный голос",
    description: "Быть активным рецензентом более 2 лет",
    icon: "Volume2",
    rarity: "legendary",
    category: "Легендарные"
  },
  {
    id: "golden-fund",
    title: "Золотой фонд",
    description: "50 рецензий, которые набрали более 100 лайков каждая",
    icon: "Star",
    rarity: "legendary",
    category: "Легендарные"
  }
];
