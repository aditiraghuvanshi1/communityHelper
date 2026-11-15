// Visual complaint timeline: every status stage from Reported through Resolved/Rejected,
// with the administrator remark and timestamp for each stage that has happened.
import { Check, Circle, X } from "lucide-react";
import { STATUS_LABELS } from "@/lib/civic";
import { formatDateTime } from "@/lib/media";
import { useLanguage } from "@/lib/language-context";
import type { Status, StatusEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<Status, string> = {
  reported: "#DC2626",
  under_review: "#D97706",
  assigned: "#4F46E5",
  in_progress: "#0284C7",
  resolved: "#16A34A",
  rejected: "#64748B",
};

export default function StatusTimeline({ history }: { history: StatusEvent[] }) {
  const { t } = useLanguage();
  if (history.length === 0) {
    return <p className="text-sm text-[#52656F]">{t("No status updates have been recorded yet.")}</p>;
  }
  const byStatus = new Map<Status, StatusEvent>();
  for (const event of history) byStatus.set(event.status, event); // ascending order → latest wins
  const rejectedAt = byStatus.has("rejected");
  const stages: Status[] = rejectedAt
    ? (["reported", "under_review", "assigned", "in_progress", "rejected"] as Status[])
    : (["reported", "under_review", "assigned", "in_progress", "resolved"] as Status[]);

  return (
    <ol className="relative space-y-0" data-testid="status-timeline">
      {stages.map((status, index) => {
        const event = byStatus.get(status);
        const isLast = index === stages.length - 1;
        const done = Boolean(event);
        return (
          <li key={status} className="relative flex gap-4 pb-6 last:pb-0" data-testid={`timeline-step-${status}`}>
            {!isLast && (
              <span
                aria-hidden
                className={cn("absolute left-[11px] top-7 h-full w-0.5", done ? "bg-[#D5D9CD]" : "bg-[#E2E4DC]")}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                done ? "border-transparent text-white" : "border-[#D5D9CD] text-[#D5D9CD]",
              )}
              style={done ? { backgroundColor: DOT_COLOR[status] } : undefined}
            >
              {event ? (
                status === "rejected" ? <X className="size-3.5" /> : <Check className="size-3.5" />
              ) : (
                <Circle className="size-2 fill-current" />
              )}
            </span>
            <div className="min-w-0">
              <div className={cn("text-sm font-semibold", done ? "text-[#172B3A]" : "text-[#9AA7AE]")}>
                {t(STATUS_LABELS[status])}
                {event && (
                  <span className="ml-2 font-normal text-xs text-[#52656F]">
                    {formatDateTime(event.created_at)}
                  </span>
                )}
              </div>
              {event && (
                <>
                  <p className="mt-1 text-sm leading-relaxed text-[#52656F]">{event.remark}</p>
                  <p className="mt-1 text-xs text-[#9AA7AE]">— {event.actor_name}, {t("municipal desk")}</p>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
