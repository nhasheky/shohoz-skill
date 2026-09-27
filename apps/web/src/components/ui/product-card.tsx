import Link from "next/link";
import type { Course, Book, Exam, BlogPost } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatCount, formatPrice } from "@/lib/format";
import { Stars } from "@/components/ui/rating";
import { ProductCover } from "@/components/ui/product-cover";
import {
  IconArrowRight,
  IconBookOpen,
  IconClock,
  IconTarget,
  IconUsers,
  IconVideo,
} from "@/components/ui/icons";

function CardShell({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function CourseCard({ course }: { course: Course }) {
  const from = course.priceMap.LIFETIME ?? course.priceMap["6_MONTHS"] ?? course.priceMap["3_MONTHS"] ?? { amount: 0 };
  return (
    <CardShell href={`/courses/${course.slug}`}>
      <div className="relative">
        <ProductCover
          title={course.title}
          category={course.categoryBn ?? course.category}
          kind="course"
          accentText={course.isNew ? "NEW" : course.level}
          className="rounded-t-2xl"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{course.category}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <IconVideo width={13} height={13} /> {course.lectures} lectures
          </span>
        </div>
        <h3 className="mt-2 font-display text-[16px] font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
          {course.titleBn ? `${course.titleBn}` : course.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Stars rating={course.rating} />
          <span className="text-xs text-muted-foreground">
            {course.rating.toFixed(1)} ({course.reviewCount})
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconUsers width={13} height={13} /> {formatCount(course.students)} students
          </span>
          <span className="flex items-center gap-1">
            <IconClock width={13} height={13} /> {course.totalHours}h
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div>
            <span className="font-display text-lg font-extrabold text-foreground">{formatPrice(from.amount)}</span>
            {from.originalAmount && (
              <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatPrice(from.originalAmount)}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-accent">
            Enroll <IconArrowRight width={15} height={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </CardShell>
  );
}

export function BookCard({ book }: { book: Book }) {
  return (
    <CardShell href={`/books/${book.slug}`}>
      <div className="relative">
        <ProductCover title={book.title} category={book.category} kind="book" accentText={book.isNew ? "NEW" : undefined} className="rounded-t-2xl" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{book.category}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <IconBookOpen width={13} height={13} /> {book.pages} pages
          </span>
        </div>
        <h3 className="mt-2 font-display text-[16px] font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
          {book.titleBn ?? book.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{book.author.name}</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Stars rating={book.rating} />
          <span className="text-xs text-muted-foreground">({book.reviewCount})</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="text-sm">
            <span className="font-display text-lg font-extrabold text-foreground">{formatPrice(book.pdfPrice.amount)}</span>
            <span className="ml-1 text-xs text-muted-foreground">PDF</span>
            {book.hardcopyPrice && (
              <span className="ml-2 block text-xs text-muted-foreground">
                Hardcopy {formatPrice(book.hardcopyPrice.amount)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-accent">
            View <IconArrowRight width={15} height={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </CardShell>
  );
}

export function ExamCard({ exam }: { exam: Exam }) {
  const isPackage = exam.examType === "package";
  return (
    <CardShell href={`/exams/${exam.slug}`}>
      <div className="relative">
        <ProductCover
          title={exam.title}
          category={isPackage ? "Package" : exam.difficulty}
          kind={isPackage ? "package" : "exam"}
          accentText={exam.isFree ? "FREE" : "PAID"}
          className="rounded-t-2xl"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{isPackage ? `${exam.subjects.length} subjects` : exam.category ?? exam.difficulty}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <IconTarget width={13} height={13} /> {exam.questionsCount} MCQs
          </span>
          {exam.negativeMarking && <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">−VM</span>}
        </div>
        <h3 className="mt-2 font-display text-[16px] font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
          {exam.titleBn ?? exam.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{exam.tagline}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconUsers width={13} height={13} /> {formatCount(exam.attemptCount)} attempts
          </span>
          <span className="flex items-center gap-1">
            <IconClock width={13} height={13} /> {exam.durationMinutes || "topic-wise"} min
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div>
            {exam.isFree ? (
              <span className="font-display text-lg font-extrabold text-success">Free</span>
            ) : (
              <>
                <span className="font-display text-lg font-extrabold text-foreground">{formatPrice(exam.price.amount)}</span>
                {exam.price.originalAmount && (
                  <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatPrice(exam.price.originalAmount)}</span>
                )}
              </>
            )}
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-accent">
            {isPackage ? "Explore" : "Start"} <IconArrowRight width={15} height={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </CardShell>
  );
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <CardShell href={`/blogs/${post.slug}`}>
      <ProductCover title={post.title} category={post.categoryBn ?? post.category} kind="blog" className="rounded-t-2xl" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{post.category}</span>
          <span className="text-border">•</span>
          <span>{post.readMinutes} min read</span>
        </div>
        <h3 className="mt-2 font-display text-[16px] font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
          <span>{post.author.name}</span>
          <span className="flex items-center gap-1 font-semibold text-accent">
            Read <IconArrowRight width={15} height={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </CardShell>
  );
}