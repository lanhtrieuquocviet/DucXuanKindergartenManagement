const TZ = 'Asia/Ho_Chi_Minh';

function nowVN() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

/** Hè: tháng 4–9 | Đông: tháng 10–3 (giờ VN) */
function getCalendarSeasonVN() {
  const month = nowVN().getMonth() + 1;
  return month >= 4 && month <= 9 ? 'summer' : 'winter';
}

/**
 * @param {{ activeTimetableSeason?: string } | null | undefined} yearLean
 * @returns {'summer'|'winter'}
 */
function resolveEffectiveTimetableSeason(yearLean) {
  const s = yearLean?.activeTimetableSeason;
  if (s === 'summer' || s === 'winter') return s;
  return getCalendarSeasonVN();
}

module.exports = {
  nowVN,
  getCalendarSeasonVN,
  resolveEffectiveTimetableSeason,
};
