export type Role = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

export type AccessDuration = "LIFETIME" | "1_MONTH" | "2_MONTHS" | "3_MONTHS" | "6_MONTHS";

export type ProductType = "course" | "book" | "exam";

export type VideoSource = { type: "youtube"; youtubeId: string } | { type: "direct"; hlsUrl: string };

export type Price = { amount: number; originalAmount?: number };

export type Instructor = {
  id: string;
  name: string;
  nameBn?: string;
  title: string;
  bio: string;
  rating: number;
  students: number;
  courses: number;
  avatar?: string;
  verified?: boolean;
};

export type CurriculumSection = {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
};

export type CurriculumLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  source: VideoSource;
  preview?: boolean;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  titleBn?: string;
  tagline: string;
  description: string;
  category: string;
  categoryBn?: string;
  thumbnailUrl?: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  priceMap: Partial<Record<AccessDuration, Price>>;
  durationLabel: string;
  totalHours: number;
  lectures: number;
  quizzes: number;
  articles: number;
  resources: number;
  students: number;
  rating: number;
  reviewCount: number;
  certificate: boolean;
  instructor: Instructor;
  curriculum: CurriculumSection[];
  learningOutcomes: string[];
  requirements: string[];
  whoIsFor: string[];
  faq: FaqItem[];
  videos: { youtube?: string; direct?: string };
  enrolled?: boolean;
  allowedPaymentMethods?: string[];
  suggested?: SuggestedRef[];
  published: boolean;
  featured?: boolean;
  isNew?: boolean;
  createdAt: string;
  seo: Seo;
};

export type BookFormat = "pdf" | "hardcopy";

export type Book = {
  id: string;
  slug: string;
  title: string;
  titleBn?: string;
  subtitle: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  demoPdfUrl?: string;
  hasDemo?: boolean;
  author: BookAuthor;
  pages: number;
  edition: string;
  language: "En" | "Bn" | "Mixture";
  publisher: string;
  // A format is offered only when its price is present (null = not sold).
  pdfPrice?: Price | null;
  hardcopyPrice?: Price | null;
  allowedPaymentMethods?: string[];
  suggested?: SuggestedRef[];
  tableOfContents: { title: string; pages: string }[];
  samplePages: number;
  students: number;
  rating: number;
  reviewCount: number;
  published: boolean;
  featured?: boolean;
  isNew?: boolean;
  createdAt: string;
  seo: Seo;
};

export type BookAuthor = {
  id: string;
  name: string;
  nameBn?: string;
  title: string;
  bio: string;
  avatar?: string;
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

export type ExamTopic = {
  id: string;
  title: string;
  titleBn?: string;
  description?: string;
  slug: string;
  questionsCount: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarks: number;
  questions: Question[];
};

export type ExamSubject = {
  id: string;
  title: string;
  titleBn?: string;
  topics: ExamTopic[];
};

export type Exam = {
  id: string;
  slug: string;
  title: string;
  titleBn?: string;
  tagline: string;
  description: string;
  thumbnailUrl?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  examType: "subject" | "topic" | "package";
  packageId?: string;
  subjectId?: string;
  category?: string;
  isFree: boolean;
  price: Price;
  durationMinutes: number;
  rating: number;
  questionsCount: number;
  totalMarks: number;
  negativeMarking: boolean;
  defaultNegativeMarks: number;
  marksPerQuestion: number;
  attemptCount: number;
  passRate: number;
  avgScore: number;
  subjects: ExamSubject[];
  accessDuration: AccessDuration;
  allowedPaymentMethods?: string[];
  suggested?: SuggestedRef[];
  featured?: boolean;
  isNew?: boolean;
  published: boolean;
  createdAt: string;
  seo: Seo;
};

export type SuggestedRef = { type: "course" | "book" | "exam"; id: string };

export type ProductReview = {
  id: string;
  productType: "course" | "book" | "exam";
  productId: string;
  rating: number;
  text: string;
  imageUrl?: string | null;
  name: string;
  userId?: string | null;
  createdAt: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: BlogBlock[];
  category: string;
  categoryBn?: string;
  tags: string[];
  author: BlogAuthor;
  readMinutes: number;
  featured?: boolean;
  published: boolean;
  scheduledFor?: string;
  createdAt: string;
  updatedAt?: string;
  seo: Seo;
};

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "video"; youtubeId: string; title?: string }
  | { type: "gallery"; images: { src: string; alt: string }[] };

export type BlogAuthor = {
  id: string;
  name: string;
  nameBn?: string;
  title: string;
  avatar?: string;
};

export type TestimonialReview = {
  id: string;
  type: "image" | "text";
  imageSrc?: string;
  text?: string;
  name: string;
  nameBn?: string;
  role: string;
  rating: number;
  placement: "homepage" | "product" | "all";
  productSlugs?: string[];
  featured?: boolean;
};

export type FaqItem = { question: string; answer: string };

export type Seo = {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
};

export type DeviceSession = {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  current: boolean;
};

export type AppUser = {
  id: string;
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  status: "ACTIVE" | "BANNED" | "SUSPENDED";
  joinedAt: string;
  devices: DeviceSession[];
  verified: boolean;
};

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "BKASH" | "NAGAD" | "SSC" | "ROCKET" | "COD" | "SSLCOMMERZ";
export type DeliveryRegion = "DHAKA" | "OUTSIDE";

export type OrderCustomer = {
  id?: string;
  name?: string | null;
  nameBn?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type Order = {
  id: string;
  orderNumber?: number | null;
  userId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  user?: OrderCustomer | null;
  productType: ProductType;
  productId: string;
  productTitle: string;
  variant?: string | null;
  isPhysical?: boolean;
  quantity?: number;
  amount: number;
  discount?: number;
  deliveryCharge?: number;
  total?: number;
  items?: unknown;
  method: PaymentMethod;
  paymentMethod?: string | null;
  status: OrderStatus;
  address?: string | null;
  region?: DeliveryRegion | string | null;
  createdAt: string;
  txId?: string | null;
  consignmentId?: string | null;
  trackingCode?: string | null;
  courierStatus?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  userAgent?: string | null;
  customerHistory?: CourierHistory;
};

export type CourierHistory = {
  total: number;
  sent: number;
  delivered: number;
  cancelled: number;
  returned: number;
  inProgress: number;
};

export type Category = {
  slug: string;
  label: string;
  labelBn: string;
  description: string;
  icon?: string;
  count: number;
};

export type SiteSetting = {
  id?: string;
  logoUrl?: string | null;
  siteTitle: string;
  siteTitleBn?: string | null;
  faviconUrl?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  keywords?: string[];
  supportEmail?: string | null;
  supportPhone?: string | null;
  address?: string | null;
  socials?: Record<string, string> | null;
  deliveryChargeDhaka: number;
  deliveryChargeOutside: number;
  codEnabled?: boolean;
  sslcommerzEnabled?: boolean;
  reviewScrollSeconds?: number;
};

export type PageContent = {
  id?: string | null;
  page: string;
  data: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: string;
};