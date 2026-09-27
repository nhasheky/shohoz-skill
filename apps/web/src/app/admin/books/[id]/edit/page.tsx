"use client";

import { useParams } from "next/navigation";
import { BookFormPage } from "@/components/admin/admin-pages";

export default function EditBookPage() {
  const params = useParams();
  return <BookFormPage id={params.id as string} />;
}
