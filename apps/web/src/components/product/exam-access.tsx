"use client";

import { ButtonLink } from "@/components/ui/button";
import { PurchasePanel, type PurchasePlan } from "./purchase-panel";
import { useOwned } from "./use-owned";

export function ExamAccess({
  examId,
  examSlug,
  isFree,
  title,
  allowedPaymentMethods,
  plans,
  planNote,
  features,
}: {
  examId: string;
  examSlug: string;
  isFree: boolean;
  title: string;
  allowedPaymentMethods?: string[];
  plans: PurchasePlan[];
  planNote?: string;
  features: string[];
}) {
  const owned = useOwned("exam", examId, examSlug);

  if (isFree || owned) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        <p className="font-display text-lg font-extrabold text-foreground">পরীক্ষা দিতে প্রস্তুত?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFree ? "এই exam সম্পূর্ণ ফ্রি — এখনই শুরু করুন।" : "আপনার access চালু আছে — এখনই শুরু করুন।"}
        </p>
        <ButtonLink href={`/exam/${examSlug}/take`} variant="accent" className="mt-4 w-full">
          পরীক্ষা শুরু করুন
        </ButtonLink>
      </div>
    );
  }

  return (
    <PurchasePanel
      kind="Exam"
      title={title}
      productId={examId}
      productType="exam"
      ownerSlug={examSlug}
      allowedPaymentMethods={allowedPaymentMethods}
      plans={plans}
      planNote={planNote}
      features={features}
    />
  );
}
