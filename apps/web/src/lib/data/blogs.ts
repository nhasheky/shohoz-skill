import type { BlogPost } from "@/lib/types";

export const blogs: BlogPost[] = [
  {
    id: "b1",
    slug: "bcs-preliminary-study-plan",
    title: "A 6-Month BCS Preliminary Study Plan That Actually Works",
    excerpt: "Most aspirants drift for 2 years. This is the 6-month plan our toppers followed to clear the preliminary with 150+ marks.",
    category: "Study Plan",
    categoryBn: "স্টাডি প্ল্যান",
    tags: ["BCS", "preliminary", "study plan", "schedule"],
    author: { id: "auth-mahmud", name: "Mahmudul Hasan", nameBn: "মাহমুদুল হাসান", title: "Senior Faculty" },
    readMinutes: 8,
    featured: true,
    published: true,
    createdAt: "2026-01-10",
    seo: { title: "6-Month BCS Preliminary Study Plan — Shohoz Skill", description: "The exact month-by-month BCS Preliminary study plan followed by our 150+ scorers." },
    content: [
      { type: "heading", text: "Why 6 months is the sweet spot" },
      { type: "paragraph", text: "Three to six months of focused study beats two years of half-hearted effort. The BCS Preliminary is a race of precision, not marathon intensity. In this plan you will finish the syllabus exactly twice — once for concepts, once for revision — with MCQ practice woven in daily." },
      { type: "list", ordered: true, items: [
        "Month 1–2: Bangla + English syllabus with daily 30 MCQs.",
        "Month 3: Math shortcuts + Science + Computer topics.",
        "Month 4: GK Bangladesh Affairs + full-length weekly papers.",
        "Month 5: International GK + past-paper analysis (2014–2025).",
        "Month 6: Negative-marking simulators 3× weekly + weakness audit.",
      ]},
      { type: "quote", text: "Biriyani isn’t made in a day, and neither is a 150 in preliminary — but six months is exactly one biriyani-cooking marathon.", cite: "Shohoz Skill motto" },
      { type: "paragraph", text: "Track your scores per subject every week. If Bangla dips below 70%, redo the syllabus section before touching Math. Weakness-fixed-early is the single biggest difference between 45th and 50th rank lists." },
    ],
  },
  {
    id: "b2",
    slug: "negative-marking-strategy",
    title: "Mastering Negative Marking: When to Skip, When to Guess",
    excerpt: "A wrong guess on a 0.5-negative exam costs you twice what you think. Learn the probability rule that decides every blind attempt.",
    category: "Exam Strategy",
    categoryBn: "পরীক্ষার কৌশল",
    tags: ["MCQ", "negative marking", "strategy", "exam tips"],
    author: { id: "auth-shirin", name: "Shirin Akter", nameBn: "শিরিন আক্তার", title: "NTRCA Specialist" },
    readMinutes: 6,
    featured: true,
    published: true,
    createdAt: "2025-12-28",
    seo: { title: "Negative Marking Strategy — When to Guess — Shohoz Skill", description: "The probability rule for skipping vs guessing in negative-marking MCQ exams." },
    content: [
      { type: "heading", text: "The 4-option equation" },
      { type: "paragraph", text: "With 4 options, +1 for correct and −0.25 for wrong, blind guessing has an expected value of exactly zero. But exam-marking is rarely blind: you can usually eliminate one or two options. The moment you can rule out two options, guessing becomes strongly positive-EV." },
      { type: "list", ordered: false, items: [
        "5-option or 4-option? Adjust: with 5 options and −1 penalty, do NOT guess unless you can eliminate 3.",
        "Time budget: never spend more than 90 seconds on a single question in the MCQ papers.",
        "Mark doubtful ones and revisit in round two, not round one.",
      ]},
      { type: "paragraph", text: "Our exam engine shows your 'skip saved you X marks' after every test, so you can see the value of discipline in real numbers." },
    ],
  },
  {
    id: "b3",
    slug: "bank-ad-written-guide",
    title: "Bangladesh Bank AD Written: A Section-by-Section Breakdown",
    excerpt: "What to write, how to structure, and what examiners look for in the Bangladesh Bank AD written exam.",
    category: "Bank Job",
    categoryBn: "ব্যাংক জব",
    tags: ["Bangladesh Bank", "AD", "written", "exam guide"],
    author: { id: "auth-tanvir", name: "Tanvir Ahmed", nameBn: "তানভীর আহমেদ", title: "Ex-Bank Officer" },
    readMinutes: 7,
    featured: false,
    published: true,
    createdAt: "2025-12-05",
    seo: { title: "Bangladesh Bank AD Written Guide — Shohoz Skill", description: "Section-by-section guide to the BB AD written exam with examiner preferences." },
    content: [
      { type: "heading", text: "Structure of the paper" },
      { type: "paragraph", text: "The AD written paper tests English composition, analytical ability, and factual knowledge. Your structure matters as much as your content — mark allocation rewards tidy, signposted answers." },
      { type: "list", ordered: false, items: [
        "English: opening paragraph that states the thesis in one line.",
        "Analytical: data → trend → implication → recommendation chain.",
        "GK section: bullet the key numbers before prose.",
      ]},
      { type: "quote", text: "An examiner can grade a clean, average answer higher than a muddled brilliant one. Polish structure first." },
    ],
  },
  {
    id: "b4",
    slug: "ntrca-syllabus-2026",
    title: "NTRCA Syllabus 2025–26: What’s New and What to Prioritise",
    excerpt: "We mapped the updated NTRCA syllabus so you don’t waste a single hour on removed topics.",
    category: "NTRCA",
    categoryBn: "এনটিআরসিএ",
    tags: ["NTRCA", "syllabus", "teacher registration"],
    author: { id: "auth-shirin", name: "Shirin Akter", nameBn: "শিরিন আক্তার", title: "NTRCA Specialist" },
    readMinutes: 5,
    published: true,
    createdAt: "2025-11-18",
    seo: { title: "NTRCA Syllabus 2025-26 Breakdown — Shohoz Skill", description: "Updated NTRCA syllabus mapped with priority topics and removed sections." },
    content: [
      { type: "heading", text: "Priority ordering" },
      { type: "paragraph", text: "The Bangla and English portions carry the heaviest weight. General Knowledge comes next, followed by localised mathematics. The biggest mistake is over-investing in rare probability questions while ignoring simple grammar." },
      { type: "list", ordered: true, items: [
        "Bangla (বাগধারা + ব্যাকরণ) — highest yield.",
        "English right-form-of-verbs — predictable 10+ marks.",
        "GK Bangladesh Affairs — always topical, never ending.",
        "Math — only school-level shortcuts needed.",
      ]},
      { type: "paragraph", text: "We updated every NTRCA topic exam in the package to mirror this priority ordering." },
    ],
  },
  {
    id: "b5",
    slug: "revision-techniques-memorization",
    title: "7 Revision Techniques That Beat Memorization Burnout",
    excerpt: "Active recall, spaced repetition, and the 'teach-your-device' trick — the science-backed ways to remember a 400-item GK list.",
    category: "Exam Strategy",
    categoryBn: "পরীক্ষার কৌশল",
    tags: ["revision", "memory", "GK", "study tips"],
    author: { id: "auth-mahmud", name: "Mahmudul Hasan", nameBn: "মাহমুদুল হাসান", title: "Senior Faculty" },
    readMinutes: 6,
    published: true,
    createdAt: "2025-10-30",
    seo: { title: "7 Revision Techniques for Exam Memorization — Shohoz Skill", description: "Active recall and spaced-repetition techniques to memorize 400-GK lists without burnout." },
    content: [
      { type: "heading", text: "Your brain forgets on purpose" },
      { type: "paragraph", text: "Forgetting is the brain deleting unused routes. Revision is not re-learning — it is re-paving the route before it disappears. Revisit a GK point after 1, then 3, then 7 days to lock it permanently." },
      { type: "list", ordered: false, items: [
        "Explain the topic to your phone's voice recorder — teaching forces recall.",
        "Use our quiz mode with 'wrong answer only' filtering to target gaps.",
        "Link numbers to stories (16.9 crore → the 169 bus route).",
      ]},
    ],
  },
  {
    id: "b6",
    slug: "govt-job-viva-tips",
    title: "How to Spend the 7 Days Before a Government Job Viva",
    excerpt: "A day-by-day checklist for viva week: revision order, mock sessions, documents, and the night-before rule that calms nerves.",
    category: "Viva & Interview",
    categoryBn: "ভাইভা",
    tags: ["viva", "interview", "BCS", "checklist"],
    author: { id: "auth-kamal", name: "Kamal Hossain", nameBn: "কামাল হোসেন", title: "Former Viva Board Member" },
    readMinutes: 5,
    published: true,
    createdAt: "2025-09-22",
    seo: { title: "How to Spend 7 Days Before a Govt Job Viva — Shohoz Skill", description: "Day-by-day prep checklist for viva week including mock session and night-before rules." },
    content: [
      { type: "heading", text: "The 7-day countdown" },
      { type: "list", ordered: true, items: [
        "Day 7: Your bio-sheet and the 10 most likely self-questions.",
        "Day 6–5: Current affairs (last 3 months digest ×2).",
        "Day 4: Mock viva with a friend or our recorded sessions.",
        "Day 3: Confidence rituals — posture, voice, breathing.",
        "Day 2: Documents audit: originals + 20 photocopies.",
        "Day 1: Light revision only; no new topics.",
        "Viva day: Reach 45 minutes early; breathe before the door.",
      ]},
      { type: "paragraph", text: "Boards love the candidate who answers slowly, smiles, and admits 'I don't know' gracefully when needed. That honesty outranks a shaky bluff every single time." },
    ],
  },
];

export function getBlogBySlug(slug: string) {
  return blogs.find((b) => b.slug === slug);
}

export function getFeaturedBlogs() {
  return blogs.filter((b) => b.featured);
}

export function getRelatedBlogs(current: BlogPost, limit = 3) {
  const sameCat = blogs.filter((b) => b.id !== current.id && b.category === current.category);
  const rest = blogs.filter((b) => b.id !== current.id && b.category !== current.category);
  return [...sameCat, ...rest].slice(0, limit);
}