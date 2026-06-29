import schedule from '../schedule.json';

export function isOpenNow(now = new Date()) {
  const t = now.getTime();
  const windows = schedule.windows || [];

  for (const w of windows) {
    const start = new Date(w.start).getTime();
    const end = new Date(w.end).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (t >= start && t < end) {
      return { open: true, window: w };
    }
  }
  return { open: false, window: null };
}

export function nextWindow(now = new Date()) {
  const t = now.getTime();
  const windows = schedule.windows || [];
  let next = null;

  for (const w of windows) {
    const start = new Date(w.start).getTime();
    if (Number.isNaN(start)) continue;
    if (start > t) {
      if (!next || start < new Date(next.start).getTime()) {
        next = w;
      }
    }
  }
  return next;
}
