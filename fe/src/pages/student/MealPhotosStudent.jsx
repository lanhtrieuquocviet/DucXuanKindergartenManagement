import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMealPhoto } from "../../service/mealManagement.api";
import { ArrowLeft, ChevronLeft, ChevronRight, X, UtensilsCrossed, Clock } from "lucide-react";

/* ─── constants ─────────────────────────────────────── */
const MEAL_CONFIG = {
  sang:  { label: "Bữa sáng",       emoji: "🌅", gradient: "from-amber-400 to-orange-400",  bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  trua:  { label: "Bữa chính trưa", emoji: "🍚", gradient: "from-emerald-400 to-teal-500",  bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46" },
  chieu: { label: "Bữa phụ chiều",  emoji: "🍎", gradient: "from-violet-400 to-purple-500", bg: "#f5f3ff", border: "#c4b5fd", text: "#4c1d95" },
  xe:    { label: "Bữa xế",         emoji: "🥛", gradient: "from-sky-400 to-blue-500",      bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" },
  khac:  { label: "Khác",           emoji: "🍽️", gradient: "from-gray-400 to-slate-500",    bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
};

const DAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_FULL  = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

/* ─── helpers ───────────────────────────────────────── */
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function parseDate(str) { return new Date(str + "T00:00:00"); }
function fmt(str) {
  const [y,m,d] = str.split("-");
  return `${d}/${m}/${y}`;
}

/* generate 7-day window centred on selected date */
function getWeekDays(centerStr) {
  const center = parseDate(centerStr);
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center); d.setDate(d.getDate() + i);
    days.push(toDateStr(d));
  }
  return days;
}

/* ─── skeleton ──────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-4 px-4">
      {[1,2].map(k => (
        <div key={k} className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="h-12 bg-gray-100 animate-pulse" />
          <div className="p-3 grid grid-cols-3 gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── image grid ─────────────────────────────────────── */
function ImageGrid({ images, label, onOpen }) {
  if (!images?.length) return (
    <div className="flex flex-col items-center justify-center py-6 text-gray-300">
      <UtensilsCrossed size={32} className="mb-2" />
      <p className="text-xs">Chưa có hình ảnh</p>
    </div>
  );

  if (images.length === 1) return (
    <div className="p-3">
      <button onClick={() => onOpen(0)} className="w-full rounded-xl overflow-hidden shadow-sm active:scale-95 transition-transform">
        <img src={images[0]} alt={label} className="w-full max-h-64 object-cover" />
      </button>
    </div>
  );

  if (images.length === 2) return (
    <div className="p-3 grid grid-cols-2 gap-2">
      {images.map((img, i) => (
        <button key={i} onClick={() => onOpen(i)} className="aspect-square rounded-xl overflow-hidden shadow-sm active:scale-95 transition-transform">
          <img src={img} alt={`${label} ${i+1}`} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );

  /* 3-5 images: first image large, rest in a row */
  const [first, ...rest] = images;
  return (
    <div className="p-3 space-y-2">
      <button onClick={() => onOpen(0)} className="w-full rounded-xl overflow-hidden shadow-sm active:scale-95 transition-transform">
        <img src={first} alt={`${label} 1`} className="w-full h-52 object-cover" />
      </button>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${rest.length}, 1fr)` }}>
        {rest.map((img, i) => (
          <button key={i} onClick={() => onOpen(i+1)} className="aspect-square rounded-xl overflow-hidden shadow-sm active:scale-95 transition-transform relative">
            <img src={img} alt={`${label} ${i+2}`} className="w-full h-full object-cover" />
            {i === rest.length - 1 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <span className="text-white font-bold text-lg">+{images.length - 4}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── lightbox ───────────────────────────────────────── */
function Lightbox({ images, index, onClose, onPrev, onNext, onJump }) {
  const touchStart = useRef(null);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? onNext() : onPrev();
    touchStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <span className="text-white/60 text-sm">{index + 1} / {images.length}</span>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 active:bg-white/20">
          <X size={22} color="white" />
        </button>
      </div>

      {/* image */}
      <div className="flex-1 flex items-center justify-center relative px-2">
        {images.length > 1 && (
          <button onClick={onPrev} className="absolute left-2 z-10 p-3 rounded-full bg-white/10 active:bg-white/20">
            <ChevronLeft size={24} color="white" />
          </button>
        )}
        <img
          src={images[index]}
          alt={`Ảnh ${index+1}`}
          className="max-w-full max-h-full rounded-xl object-contain select-none"
          style={{ maxHeight: "75vh" }}
          draggable={false}
        />
        {images.length > 1 && (
          <button onClick={onNext} className="absolute right-2 z-10 p-3 rounded-full bg-white/10 active:bg-white/20">
            <ChevronRight size={24} color="white" />
          </button>
        )}
      </div>

      {/* dots */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`rounded-full transition-all ${i === index ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/35"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────── */
export default function MealPhotosStudent() {
  const navigate = useNavigate();
  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mealData, setMealData]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [lightbox, setLightbox]         = useState(null); // { images, index }
  const weekDays = getWeekDays(selectedDate);
  const weekRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMealData(null);
    getMealPhoto(selectedDate)
      .then(res => { if (!cancelled) setMealData(res.data || null); })
      .catch(() => { if (!cancelled) setMealData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  /* scroll selected day chip into view */
  useEffect(() => {
    const el = weekRef.current?.querySelector("[data-selected='true']");
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate]);

  const changeDate = (delta) => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  };

  const openLightbox  = (images, index) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);
  const prevImage = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const nextImage = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  const meals = mealData?.meals || [];
  const isToday = selectedDate === today;
  const dayName = DAY_FULL[parseDate(selectedDate).getDay()];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-30 bg-emerald-600 text-white shadow-md">
        {/* title bar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={() => navigate("/student")}
            className="p-2 -ml-2 rounded-full active:bg-emerald-500 transition"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold leading-tight">Hình ảnh bữa ăn</h1>
            <p className="text-emerald-200 text-xs">{dayName}, {fmt(selectedDate)}</p>
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 rounded-full font-medium transition"
            >
              Hôm nay
            </button>
          )}
        </div>

        {/* week day strip */}
        <div ref={weekRef} className="flex gap-1.5 px-3 pb-3 overflow-x-auto scrollbar-hide">
          {weekDays.map(dateStr => {
            const d = parseDate(dateStr);
            const isSelected = dateStr === selectedDate;
            const isTodayDay = dateStr === today;
            const isFuture   = dateStr > today;
            return (
              <button
                key={dateStr}
                data-selected={isSelected}
                onClick={() => !isFuture && setSelectedDate(dateStr)}
                disabled={isFuture}
                className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-3 py-2 min-w-[48px] transition-all
                  ${isSelected
                    ? "bg-white text-emerald-700 shadow-md scale-105"
                    : isFuture
                      ? "bg-white/10 text-white/30"
                      : "bg-white/20 text-white active:bg-white/30"
                  }`}
              >
                <span className="text-[10px] font-medium">{DAY_SHORT[d.getDay()]}</span>
                <span className={`text-sm font-bold mt-0.5 ${isTodayDay && !isSelected ? "underline decoration-2 decoration-white" : ""}`}>
                  {d.getDate()}
                </span>
                {isTodayDay && (
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-emerald-500" : "bg-white"}`} />
                )}
              </button>
            );
          })}

          {/* prev / next week arrows */}
          <button
            onClick={() => changeDate(-7)}
            className="flex-shrink-0 flex items-center justify-center w-10 h-14 rounded-2xl bg-white/20 active:bg-white/30 ml-1"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => changeDate(7)}
            disabled={selectedDate >= today}
            className="flex-shrink-0 flex items-center justify-center w-10 h-14 rounded-2xl bg-white/20 active:bg-white/30 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── body ── */}
      <div className="flex-1 py-4 max-w-lg mx-auto w-full">

        {loading ? (
          <Skeleton />
        ) : meals.length === 0 ? (
          /* empty state */
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <p className="font-semibold text-gray-600">Chưa có hình ảnh bữa ăn</p>
            <p className="text-sm text-gray-400 mt-1">
              {isToday ? "Nhà trường chưa cập nhật ảnh hôm nay" : "Không có dữ liệu cho ngày này"}
            </p>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-medium active:scale-95 transition-transform"
              >
                Xem hôm nay
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {/* summary chip */}
            <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
              <Clock size={13} />
              <span>Cập nhật {meals.length} bữa ăn · {fmt(selectedDate)}</span>
            </div>

            {meals.map((meal) => {
              const cfg = MEAL_CONFIG[meal.mealType] || MEAL_CONFIG.khac;
              return (
                <div
                  key={meal.mealType}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  style={{ border: `1.5px solid ${cfg.border}` }}
                >
                  {/* card header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ background: cfg.bg }}
                  >
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight" style={{ color: cfg.text }}>
                        {cfg.label}
                      </p>
                      {meal.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: cfg.text, opacity: 0.75 }}>
                          {meal.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: cfg.border, color: cfg.text }}>
                      {meal.images?.length || 0} ảnh
                    </span>
                  </div>

                  {/* image grid */}
                  <ImageGrid
                    images={meal.images}
                    label={cfg.label}
                    onOpen={(idx) => openLightbox(meal.images, idx)}
                  />
                </div>
              );
            })}

            {/* bottom pad for nav bar */}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* ── lightbox ── */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
          onJump={(i) => setLightbox(lb => ({ ...lb, index: i }))}
        />
      )}
    </div>
  );
}
