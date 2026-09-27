"use client";

import { useParams } from "next/navigation";
import { CourseFormPage } from "@/components/admin/admin-pages";

export default function EditCoursePage() {
  const params = useParams();
  return <CourseFormPage id={params.id as string} />;
}
