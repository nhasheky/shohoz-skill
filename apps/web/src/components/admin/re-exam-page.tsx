"use client";

import { useCallback, useEffect, useState } from "react";
import * as api from "@/lib/admin-api";
import { useAdminTitle } from "@/lib/use-admin-title";
import { useToast } from "./admin-toast";
import { Badge } from "./admin-ui";
import { cn } from "@/lib/cn";

export function ReExamPage() {
  useAdminTitle("Re-exam Requests");
  const toast = useToast();
  const [filter, setFilter] = useState("PENDING");
  const [rows, setRows] = useState<api.ReExamRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.listReExamRequests(filter));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function decide(id: string, approve: boolean) {
    try {
      if (approve) await api.approveReExam(id);
      else await api.rejectReExam(id);
      toast.success(approve ? "Approved — attempts reset" : "Rejected");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Re-exam Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Approve করলে ওই student-এর exam attempt reset হবে — সে আবার দিতে পারবে।</p>
        </div>
        <div className="flex gap-1.5">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors", filter === s ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">Kono request nei.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
              <div>
                <p className="text-sm font-bold text-foreground">{r.user?.name ?? "User"} <span className="text-xs font-normal text-muted-foreground">({r.user?.phone ?? "—"})</span></p>
                <p className="text-xs text-muted-foreground">{r.exam?.title ?? r.examId}</p>
                {r.note && <p className="mt-1 text-xs text-muted-foreground">“{r.note}”</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleString("en-BD")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "accent"}>{r.status}</Badge>
                {r.status === "PENDING" && (
                  <>
                    <button type="button" onClick={() => decide(r.id, true)} className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-success-foreground hover:opacity-90">Approve</button>
                    <button type="button" onClick={() => decide(r.id, false)} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-danger-foreground hover:opacity-90">Reject</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
