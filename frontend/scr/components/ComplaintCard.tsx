// Complaint summary card used in feeds, the explore list and the dashboard.
import { Link } from "react-router-dom";
import { ArrowBigUp, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryChip, StatusBadge } from "@/components/StatusBadge";
import { formatRelativeTime } from "@/lib/media";
import { useLanguage } from "@/lib/language-context";
import type { Complaint } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ComplaintCard({
  complaint,
  active = false,
}: {
  complaint: Complaint;
  active?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Card
      size="sm"
      data-testid={`complaint-card-${complaint.id}`}
      className={cn(
        "overflow-hidden transition-all duration-150 hover:border-[#CBD5E1] hover:shadow-sm",
        active && "border-[#237A62] ring-1 ring-[#237A62]",
      )}
    >
      <CardContent className="flex gap-3 p-4">
        {complaint.photos.length > 0 ? (
          <img
            src={complaint.photos[0]}
            alt={complaint.title}
            className="size-20 shrink-0 rounded-lg border border-[#E2E4DC] object-cover"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-[#EAECE4] text-xs font-medium text-[#52656F]">
            {t("No photo")}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={complaint.status} />
            <CategoryChip category={complaint.category} />
          </div>
          <Link
            to={`/complaints/${complaint.id}`}
            data-testid={`complaint-link-${complaint.id}`}
            className="mt-1.5 block font-heading text-sm font-bold leading-snug text-[#172B3A] hover:text-[#237A62]"
          >
            {complaint.title}
          </Link>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#52656F]">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {complaint.locality}, {complaint.town} · {formatRelativeTime(complaint.created_at)}
            </span>
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#52656F]">
            <ArrowBigUp className="size-3.5" /> {complaint.upvote_count}{" "}
            {t(complaint.upvote_count === 1 ? "support" : "supports")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
