import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const IconMenu = (p: P) => (
  <svg {...base(p)}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconSun = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IconMoon = (p: P) => (
  <svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2l2.9 6.1 6.6.9-4.9 4.6 1.2 6.5L12 17.8 6.2 20l1.2-6.5L2.5 9l6.6-.9L12 2z" /></svg>
);
export const IconStarHalf = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2v15.8l-5.8 4.2 1.2-6.5-4.9-4.6 6.6-.9L12 2z" /></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconChevronUp = (p: P) => (
  <svg {...base(p)}><path d="m6 15 6-6 6 6" /></svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>
);
export const IconPlay = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M8 5.1v13.8c0 .8.9 1.3 1.6.9l11-6.9c.6-.4.6-1.4 0-1.8l-11-6.9c-.7-.4-1.6.1-1.6.9z" /></svg>
);
export const IconBookOpen = (p: P) => (
  <svg {...base(p)}><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" /></svg>
);
export const IconBrain = (p: P) => (
  <svg {...base(p)}><path d="M12 4.5a2.5 2.5 0 0 0-4.9-.7A2.5 2.5 0 0 0 5 8.3v.2a2.5 2.5 0 0 0 0 4.5A2.5 2.5 0 0 0 7 17.5a2.5 2.5 0 0 0 5 .8M12 4.5V3" /><path d="M12 4.5a2.5 2.5 0 0 1 4.9-.7A2.5 2.5 0 0 1 19 8.3v.2a2.5 2.5 0 0 1 0 4.5A2.5 2.5 0 0 1 17 17.5a2.5 2.5 0 0 1-5 .8M12 4.5V3" /></svg>
);
export const IconTarget = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>
);
export const IconTrophy = (p: P) => (
  <svg {...base(p)}><path d="M8 21h8m-4-4v4M7 4h10v6a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /></svg>
);
export const IconGraduationCap = (p: P) => (
  <svg {...base(p)}><path d="m2 9 10-5 10 5-10 5L2 9z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>
);
export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
);
export const IconCircleX = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></svg>
);
export const IconFlag = (p: P) => (
  <svg {...base(p)}><path d="M5 21V4M5 4h13l-2.5 3L18 10H5" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>
);
export const IconPlayCircle = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m10 9 5 3-5 3V9z" /></svg>
);
export const IconVideo = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></svg>
);
export const IconFileText = (p: P) => (
  <svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8m8 4H8M10 9H8" /></svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" /></svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconFilter = (p: P) => (
  <svg {...base(p)}><path d="M3 5h18M6 12h12M10 19h4" /></svg>
);
export const IconPhone = (p: P) => (
  <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const IconMapPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const IconFacebook = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M14 8h2.5V4.5H14c-2.2 0-4 1.8-4 4V11H7.5v3.5H10V21h3.5v-6.5H16L16.8 11h-3.3V8.8c0-.5.2-.8.5-.8z" /></svg>
);
export const IconYoutube = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8z" /><path d="m10 8.8 5 3.2-5 3.2V8.8z" fill="#fff" stroke="#fff" strokeWidth="0.5" /></svg>
);
export const IconInstagram = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" /></svg>
);
export const IconTelegram = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M21.5 4.3 18.7 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.6-.2L6.6 12.5l-4.4-1.4c-1-.3-1-1 .2-1.4l18-6.9c.8-.3 1.5.2 1.2 1.5z" /></svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = (p: P) => (
  <svg {...base(p)}><path d="M17.9 17.9A10.5 10.5 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.3-5.3M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2 3.2M2 2l20 20" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconDevice = (p: P) => (
  <svg {...base(p)}><rect x="2" y="4" width="14" height="14" rx="2" /><path d="M7 18v2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H11" /></svg>
);
export const IconShieldCheck = (p: P) => (
  <svg {...base(p)}><path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" /></svg>
);
export const IconDashboard = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v6h-6" /></svg>
);
export const IconSparkles = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM5 15l.8 1.7L7.5 17.5l-1.7.8L5 20l-.8-1.7L2.5 17.5l1.7-.8L5 15z" /></svg>
);
export const IconFlame = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M13.5 2.5c-.3 2.7 1 3.8 2.2 5.2 1.3 1.5 2.1 3 2.1 5.1a5.8 5.8 0 0 1-11.6.7c0-2.5 1.2-4 2.8-5.9.3-.4.6-.1.5.3-.1.9.2 1 .5.5.5-.8.5-3.4 3.5-5.9z" /></svg>
);
export const IconAward = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="9" r="6" /><path d="M8.5 14 7 22l5-3 5 3-1.5-8" /></svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
);
export const IconGlobe = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
);
export const IconTrendingUp = (p: P) => (
  <svg {...base(p)}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const IconWallet = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const IconList = (p: P) => (
  <svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-3v-7h-8v7H5a2 2 0 0 1-2-2z" /></svg>
);
export const IconRocket = (p: P) => (
  <svg {...base(p)}><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8-.8-.7-2-.7-3 0zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.7 7.5-6.1 11a22 22 0 0 1-3.9 2z" /><path d="M9 12H4s.6-3.3 2-4.5c1.6-1.3 5 0 5 0M12 15v5s3.3-.6 4.5-2c1.3-1.6 0-5 0-5" /></svg>
);
export const IconKey = (p: P) => (
  <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="m10.9 12.1 9.1-9.1M16 5l3 3M13 8l3 3" /></svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}><path d="m12 3 9 5-9 5-9-5 9-5zM4 13l8 4.5 8-4.5M4 17l8 4.5 8-4.5" /></svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
export const IconMessageCircle = (p: P) => (
  <svg {...base(p)}><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.3-1.1L3 20l1.1-5.2A8.5 8.5 0 1 1 21 11.5z" /></svg>
);
export const IconVerified = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2 9.2 3.7l-3-.4-.4 3L4 9.3l2 2.7-2 2.7 1.8 2.9.4 3 3-.4L12 22l2.8-2.8 3 .4.4-3 1.8-2.9-2-2.7 2-2.7-1.8-2.9-.4-3-3 .4L12 2zm-1.2 13.5-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5.4 5.4z" /></svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11v5" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}><path d="M12 3 2.5 20h19L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const IconUpload = (p: P) => (
  <svg {...base(p)}><path d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" /></svg>
);
export const IconSend = (p: P) => (
  <svg {...base(p)}><path d="m3 3 18 9-18 9 3.5-9L3 3z" /><path d="M6.5 12H21" /></svg>
);