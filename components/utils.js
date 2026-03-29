export const cls = (...c) => c.filter(Boolean).join(" ");

export function timeAgo(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const sec = Math.max(1, Math.floor((now - d) / 1000));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges = [
    [60, "seconds", 1],
    [3600, "minutes", 60],
    [86400, "hours", 3600],
    [604800, "days", 86400],
    [2629800, "weeks", 604800],
    [31557600, "months", 2629800],
  ];
  let unit = "years";
  let value = -Math.floor(sec / 31557600);
  for (const [limit, u, divisor] of ranges) {
    if (sec < limit) {
      unit = u;
      value = -Math.floor(sec / divisor);
      break;
    }
  }
  return rtf.format(value, /** @type {Intl.RelativeTimeFormatUnit} */ (unit));
}

export function formatTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function extractTurns(messages) {
  const turns = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") {
      const assistantMsg = messages[i + 1]?.role === "assistant" ? messages[i + 1] : null
      turns.push({ index: turns.length, userMsg: messages[i], assistantMsg })
    }
  }
  return turns
}

export function truncate(text, max = 80) {
  if (!text || text.length <= max) return text || ""
  return text.slice(0, max).trimEnd() + "..."
}

export function highlightMatch(text, query) {
  if (!query || !query.trim()) return [{ text, match: false }];
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const splitRegex = new RegExp(`(${escaped})`, "gi");
  const testRegex = new RegExp(`^${escaped}$`, "i");
  const parts = text.split(splitRegex);
  return parts.filter(Boolean).map((part) => ({
    text: part,
    match: testRegex.test(part),
  }));
}
