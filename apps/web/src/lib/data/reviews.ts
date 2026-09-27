import type { TestimonialReview } from "@/lib/types";

const snippetPool: { rating: number; text: string; role: string }[] = [
  { rating: 5, role: "Job Seeker, Dhaka", text: "Exactly the same pattern as the board paper. I sat the real exam and recognised questions from here." },
  { rating: 5, role: "Government Aspirant, Chattogram", text: "The answer explanations are the goldmine. I learn more from the corrections than the lessons." },
  { rating: 4.5, role: "Final-year Student, Rajshahi", text: "Loved that I could study on my phone between classes. The progress tracker kept me honest." },
  { rating: 5, role: "Housewife Aspirant, Sylhet", text: "Simple Bangla explanations for a complex English grammar topic. The instructor is a natural teacher." },
  { rating: 4.5, role: "Bank Job Aspirant, Khulna", text: "The negative-marking simulator is scary in a good way — you learn to never guess blindly." },
  { rating: 5, role: "BCS Candidate, Barishal", text: "I revised the entire curriculum twice in three months. Worth every taka." },
  { rating: 4, role: "Working Professional, Dhaka", text: "Short modules fit my schedule. The weekly revision quizzes keep knowledge fresh." },
  { rating: 5, role: "NTRCA Aspirant, Mymensingh", text: "Viva preparation section alone was worth the price. I aced my viva round." },
  { rating: 4.5, role: "Bangladesh Bank Aspirant", text: "Analytical writing samples with examiner comments — I could finally see where I was losing marks." },
  { rating: 5, role: "Laptop Teacher, Comilla", text: "Hands-on practice files included. My trainees now come prepared to the classroom." },
  { rating: 4, role: "University Student, Rangpur", text: "Good value for money. The quiz questions are tougher than the actual exam, which helped." },
  { rating: 5, role: "Job Seeker, Jashore", text: "The PDF book reader shows the watermark but stays readable everywhere, even on my small phone." },
];

const names = [
  "Rafiqul Islam",
  "Nusrat Jahan",
  "Tahmina Akter",
  "Sabbir Hossain",
  "Farhana Yasmin",
  "Mehedi Hasan",
  "Sharmin Sultana",
  "Abdullah Al Mamun",
  "Rokeya Khatun",
  "Tanvir Ahmed",
  "Sadia Afrin",
  "Imran Hossain",
];

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic per-item reviews (mock stand-in until the API serves real ones). */
export function getReviews({ id, count, baseRating }: { id: string; count: number; baseRating: number }): TestimonialReview[] {
  const seed = hashId(id);
  const out: TestimonialReview[] = [];
  for (let i = 0; i < count; i++) {
    const s = snippetPool[(seed + i * 7) % snippetPool.length];
    const name = names[(seed + i * 13) % names.length];
    const rating = s.rating > baseRating ? baseRating < 4.5 ? 4.5 : baseRating : s.rating;
    out.push({
      id: `r-${id}-${i}`,
      type: "text",
      text: s.text,
      name,
      role: s.role,
      rating,
      placement: "product",
      productSlugs: [id],
    });
  }
  return out;
}