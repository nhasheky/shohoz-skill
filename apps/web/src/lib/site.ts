export type NavigationItem = {
  label: string;
  labelBn: string;
  href: string;
};

export const SITE = {
  name: "Shohoz Skill",
  nameBn: "সহজ স্কিল",
  tagline: "Learn to Earn",
  taglineBn: "শিখুন, উপার্জন করুন",
  description:
    "Bangladesh's fastest learning platform for government-job preparation — courses, MCQ exams, and books. Learn to Earn.",
  url: "https://shohozskill.com",
  locale: "bn-BD",
  supportEmail: "support@shohozskill.com",
  phone: "+880 1700-000000",
  phoneBn: "+৮৮০ ১৭০০-০০০০০০",
  address: "Level 4, Dhanmondi, Dhaka 1209, Bangladesh",
  addressBn: "লেভেল ৪, ধানমন্ডি, ঢাকা ১২০৯",
  maxDevices: 2,
  socials: {
    facebook: "https://facebook.com/shohozskill",
    youtube: "https://youtube.com/@shohozskill",
    instagram: "https://instagram.com/shohozskill",
    telegram: "https://t.me/shohozskill",
  },
} as const;

export const NAV_ITEMS: NavigationItem[] = [
  { label: "Home", labelBn: "হোম", href: "/" },
  { label: "Courses", labelBn: "কোর্স", href: "/courses" },
  { label: "Books", labelBn: "বই", href: "/books" },
  { label: "Exams", labelBn: "এক্সাম", href: "/exams" },
  { label: "Blogs", labelBn: "ব্লগ", href: "/blogs" },
  { label: "About Us", labelBn: "আমাদের সম্পর্কে", href: "/about" },
  { label: "Contact", labelBn: "যোগাযোগ", href: "/contact" },
];

export const FOOTER_LINKS = {
  products: [
    { label: "Courses", href: "/courses" },
    { label: "Books", href: "/books" },
    { label: "Exam MCQ Test", href: "/exams" },
    { label: "Exam Packages", href: "/exams#packages" },
    { label: "Free Exams", href: "/exams?type=free" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Blogs", href: "/blogs" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Admin", href: "/admin" },
  ],
  support: [
    { label: "Help Center", href: "/contact" },
    { label: "Refund Policy", href: "/terms" },
    { label: "Report an Issue", href: "/contact" },
  ],
} as const;

export const CURRENCY = {
  code: "BDT",
  symbol: "৳",
  symbolLatin: "Tk",
};