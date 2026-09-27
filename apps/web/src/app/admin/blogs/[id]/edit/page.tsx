"use client";

import { useParams } from "next/navigation";
import { BlogFormPage } from "@/components/admin/admin-pages";

export default function EditBlogPage() {
  const params = useParams();
  return <BlogFormPage id={params.id as string} />;
}
