/*
 * Shared <input type="date"> / <input type="time"> helpers for the counter
 * sheets (counter-management) and the add-rule-with-new-counter sub-form
 * (rule↔counter linking). Single source so Home and Discipline build the same
 * startMs from a date + time pair. App clamps any future time back to now.
 */
export const pad2 = (n) => String(n).padStart(2, '0');

export function msToDateValue(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function msToTimeValue(ms) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function dateTimeToMs(dateStr, timeStr) {
  if (!dateStr) return NaN;
  const t = timeStr && timeStr.length >= 4 ? timeStr : '00:00';
  const ms = new Date(`${dateStr}T${t}`).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}
