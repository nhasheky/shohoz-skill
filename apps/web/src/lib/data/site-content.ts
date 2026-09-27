import type { Category, FaqItem, TestimonialReview } from "@/lib/types";

export const testimonials: TestimonialReview[] = [
  {
    id: "trv-1",
    type: "text",
    text: "আমি বিসিএস প্রিলিমিনারি ৪৬তম বিসিএসে প্রিলি পাস করেছি। শর্টকাট ম্যাথ আর জিকে প্যাকেজটা আমার জন্য গেম-চেঞ্জার ছিল। ভিডিওগুলো মোবাইল ডাটাতেও দ্রুত চলে!",
    name: "মো. রাকিব হাসান",
    nameBn: "মো. রাকিব হাসান",
    role: "৪৬তম বিসিএস ক্যাডার (শিক্ষা ক্যাডার)",
    rating: 5,
    placement: "homepage",
    featured: true,
  },
  {
    id: "trv-2",
    type: "text",
    text: "এনটিআরসিএ স্কুল বাংলা কোর্সের মডেল টেস্টগুলো রিয়েল এক্সামের থেকে সহজ সই হয়নি। লিখিত কৌশলটা একদম নতুন করে শিখেছি।",
    name: "শারমিন সুলতানা",
    nameBn: "শারমিন সুলতানা",
    role: "এনটিআরসিএ সহকারী শিক্ষক",
    rating: 5,
    placement: "homepage",
  },
  {
    id: "trv-3",
    type: "text",
    text: "ব্যাংক জব প্যাকেজের নেগেটিভ মার্কিং সিমুলেটরটা অসাধারণ। 'কোনটা বাদ দেব, কোনটা গেস করব' — এই আত্মবিশ্বাসটা এখান থেকেই পেয়েছি।",
    name: "নাদিয়া ইসলাম",
    nameBn: "নাদিয়া ইসলাম",
    role: "বাংলাদেশ ব্যাংক সহকারী পরিচালক (২০২৫)",
    rating: 5,
    placement: "all",
  },
  {
    id: "trv-4",
    type: "text",
    text: "পিডিএফ বইটা অনলাইনে পড়ার অভিজ্ঞতা দারুণ — নামের ওয়াটারমার্ক সহ। ঢাকার বাইরে থেকেও ডেলিভারি কার্ড ছিল দ্রুত।",
    name: "আব্দুল করিম",
    nameBn: "আব্দুল করিম",
    role: "বেনাপোল, যশোর",
    rating: 4.5,
    placement: "homepage",
  },
  {
    id: "trv-5",
    type: "text",
    text: "ভাইভা কোর্সটা সেরা। আয়নায় আয়নায় উত্তর করার অভ্যাস আর বোর্ড-সদস্যের মক ভাইভা — এরপর বোর্ডে ঢুকে কোন ভয় লাগেনি।",
    name: "ফারিয়া রহমান",
    nameBn: "ফারিয়া রহমান",
    role: "ব্যাংক ভাইভা সফল, ২০২৫",
    rating: 5,
    placement: "product",
  },
  {
    id: "trv-6",
    type: "image",
    imageSrc: "review-1",
    name: "সালমান শাহরিয়ার",
    role: "রাজশাহী",
    rating: 5,
    placement: "homepage",
  },
];

export const homepageStats = [
  { label: "Students career-ready", value: 62000, suffix: "+" },
  { label: "Enrollments this year", value: 18420, suffix: "" },
  { label: "Courses & exams live", value: 320, suffix: "+" },
  { label: "Pass rate among engaged learners", value: 78, suffix: "%" },
];

export const categories: Category[] = [
  { slug: "bcs", label: "BCS Preparation", labelBn: "বিসিএস", description: "Preliminary, written & viva", count: 28 },
  { slug: "ntrca", label: "Teacher Registration (NTRCA)", labelBn: "এনটিআরসিএ", description: "School & college level", count: 16 },
  { slug: "bank", label: "Bank Jobs", labelBn: "ব্যাংক জব", description: "AD, PO, cash officer & more", count: 22 },
  { slug: "gk", label: "GK & Current Affairs", labelBn: "সাধারণ জ্ঞান", description: "Weekly digests & 400-list", count: 34 },
  { slug: "english", label: "English Language", labelBn: "ইংরেজি", description: "Grammar to composition", count: 18 },
  { slug: "writing", label: "Written & Viva", labelBn: "লিখিত ও ভাইভা", description: "Essay, interview & grooming", count: 12 },
];

export const homeFaq: FaqItem[] = [
  { question: "আমি কি মোবাইল থেকে ক্লাস করতে পারব?", answer: "হ্যাঁ। সব ভিডিও adaptive-streamed, ৩জি নেটেও সাব-সেকেন্ডে লোড হয়। কোর্স, এক্সাম ও বই রিডার সব মোবাইল-ফার্স্ট।" },
  { question: "একটি কোর্স কিনলে কতদিন অ্যাক্সেস পাব?", answer: "আপনি বেছে নিতে পারেন লাইফটাইম, ১, ২, ৩ বা ৬ মাসের অ্যাক্সেস — দাম আলাদা আলাদা।" },
  { question: "কোন পদ্ধতিতে পেমেন্ট করা যায়?", answer: "বিকাশ, নগদ ও এসএসএল কমার্জের মাধ্যমে তাৎক্ষণিক পেমেন্ট করা যায়।" },
  { question: "একই অ্যাকাউন্টে কয়টি ডিভাইসে লগইন করা যাবে?", answer: "একসাথে সর্বোচ্চ ২টি ডিভাইস। তৃতীয় ডিভাইসে লগইন করতে আগের একটি সেশন থেকে লগআউট করতে হবে।" },
  { question: "কোর্সের মান ভালো না লাগলে টাকা ফেরত দেওয়া হয়?", answer: "প্রথম ৩ দিনের মধ্যে, ২০%-এর কম কোর্স দেখলে সম্পূর্ণ ফেরতের জন্য আবেদন করতে পারবেন।" },
];

export const aboutContent = {
  story: [
    "Shohoz Skill started in 2020 with one belief: government-job preparation in Bangladesh should be fast, honest, and affordable. We had watched thousands of aspirants drift for years between coaching centres and photocopied notes — expensive, exhausting, and rarely exam-focused.",
    "So we rebuilt preparation as a product. Short, exam-oriented video lessons. MCQ engines that simulate the real negative-marking pressure. Books you can read instantly online or get delivered to any upazila. Everything cached at the edge so a lecture starts the instant you tap play.",
    "Today 62,000+ learners study with Shohoz Skill. Our alumni sit in BCS cadre, bank AD offices, and school classrooms across the country. Every lesson we ship still answers one question: does this get you one step closer to your job?",
  ],
  values: [
    { title: "Speed is respect", description: "Every second you spend loading is a second stolen from studying. We engineer for sub-second pages." },
    { title: "Exam-first content", description: "We map every lesson to actual questions asked in real exams. No fluff, no filler." },
    { title: "Honest pricing", description: "A library of lakhs should not cost lakhs. Our bundles keep quality affordable." },
    { title: "Bangla-first", description: "You learn fastest in your mother tongue. English explanations exist — but Bangla leads." },
  ],
  milestones: [
    { year: "2020", title: "Founded in Dhaka", description: "First 3 courses launched on Facebook Live." },
    { year: "2022", title: "10,000 learners", description: "Course library grew to 40 titles." },
    { year: "2024", title: "Books & print shipping", description: "Online PDF reader + nationwide hardcopy delivery." },
    { year: "2025", title: "62,000+ students", description: "Exam engine crossed 5 lakh MCQ results processed." },
  ],
};