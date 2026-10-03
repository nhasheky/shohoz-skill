export function formatBdt(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export function formatPrice(amount: number, includeSymbol = true): string {
  return `${includeSymbol ? "৳" : "Tk "}${formatBdt(amount)}`;
}

export function formatDate(input: string | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateBn(input: string | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function timeAgo(input: string | Date): string {
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return "";
  const seconds = Math.floor((Date.now() - t) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export function formatReadTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min read`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m read` : `${h}h read`;
}

export function formatDurationLabel(duration: string): string {
  switch (duration) {
    case "LIFETIME":
      return "Lifetime Access";
    case "1_MONTH":
      return "1 Month Access";
    case "2_MONTHS":
      return "2 Months Access";
    case "3_MONTHS":
      return "3 Months Access";
    case "6_MONTHS":
      return "6 Months Access";
    default:
      return duration;
  }
}

export function formatDurationKeyBn(duration: string): string {
  switch (duration) {
    case "LIFETIME":
      return "লাইফটাইম অ্যাক্সেস";
    case "1_MONTH":
      return "১ মাস";
    case "2_MONTHS":
      return "২ মাস";
    case "3_MONTHS":
      return "৩ মাস";
    case "6_MONTHS":
      return "৬ মাস";
    default:
      return duration;
  }
}

export function isDurationExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}