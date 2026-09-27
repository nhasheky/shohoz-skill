"use client";

import { useParams } from "next/navigation";
import { ExamFormPage } from "@/components/admin/admin-pages";

export default function EditExamPage() {
  const params = useParams();
  return <ExamFormPage id={params.id as string} />;
}
