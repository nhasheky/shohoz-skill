import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExam, getMyExamAttempt } from "@/lib/api";
import { ExamSession } from "@/components/exam/exam-session";
import { ExamAttempted } from "@/components/exam/exam-attempted";

export const metadata: Metadata = {
  title: "Exam Session — Shohoz Skill",
  robots: { index: false, follow: false },
};

export default async function ExamTakePage(props: PageProps<"/exam/[slug]/take">) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const exam = await getExam(params.slug);
  if (!exam) notFound();

  const subject = typeof searchParams.subject === "string" ? searchParams.subject : undefined;
  const topic = typeof searchParams.topic === "string" ? searchParams.topic : undefined;

  const info = await getMyExamAttempt(exam.id);
  if (info.attempted) {
    return <ExamAttempted exam={exam} attempt={info.attempt} pending={info.reExamPending} />;
  }

  return <ExamSession exam={exam} subjectId={subject} topicIndex={topic} />;
}