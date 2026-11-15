// Complaint detail: full description, evidence photos, exact map pin, community support
// and the official status timeline with administrator remarks.
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowBigUp, Camera, MapPin, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EmptyState from "@/components/EmptyState";
import MapView, { type MapMarker } from "@/components/map/MapView";
import { CategoryChip, StatusBadge } from "@/components/StatusBadge";
import StatusTimeline from "@/components/StatusTimeline";
import UpvoteButton from "@/components/UpvoteButton";
import { apiGet } from "@/lib/api";
import { formatDateTime, formatRelativeTime } from "@/lib/media";
import { useLanguage } from "@/lib/language-context";
import type { ComplaintDetail as ComplaintDetailType } from "@/lib/types";

export default function ComplaintDetail() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const detail = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => apiGet<ComplaintDetailType>(`/complaints/${id}`),
    enabled: Boolean(id),
    retry: false,
  });

  if (detail.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded bg-white" />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl bg-white lg:col-span-7" />
          <div className="h-96 animate-pulse rounded-xl bg-white lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={RotateCcw}
          title={detail.error instanceof Error && detail.error.message.includes("404") ? t("Complaint not found") : t("Could not load this complaint")}
          description={t("The complaint may have been removed, or the link is incorrect. Head back to the map to find what you were looking for.")}
          action={<Button render={<Link to="/explore" />}><ArrowLeft className="size-4" /> {t("Back to explore")}</Button>}
        />
      </div>
    );
  }

  const c = detail.data;
  const marker: MapMarker[] = [
    { id: c.id, lat: c.lat, lng: c.lng, category: c.category, status: c.status, title: c.title, upvote_count: c.upvote_count },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" render={<Link to="/explore" />} data-testid="detail-back">
        <ArrowLeft className="size-4" /> {t("All complaints")}
      </Button>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              <CategoryChip category={c.category} />
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold leading-snug tracking-tight text-[#172B3A] sm:text-3xl" data-testid="detail-title">
              {c.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#52656F]">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-[#237A62]" />
                {c.locality}, {c.town} · {c.district}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="size-4" /> {c.reporter_name}
              </span>
              <span>{t("Reported")} {formatRelativeTime(c.created_at)}</span>
            </p>
            {c.address && <p className="mt-1 text-sm text-[#52656F]">{t("Landmark")}: {c.address}</p>}
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E4DC] bg-white p-4"
            data-testid="detail-support-bar"
          >
            <div className="flex items-center gap-2 text-sm text-[#52656F]">
              <ArrowBigUp className="size-5 text-[#237A62]" />
              <span><strong className="font-heading text-base text-[#172B3A]" data-testid="detail-upvote-count">{c.upvote_count}</strong> {t(c.upvote_count === 1 ? "neighbour supported this" : "neighbours supported this")}</span>
            </div>
            <UpvoteButton
              complaintId={c.id}
              upvoteCount={c.upvote_count}
              hasVoted={c.viewer_has_voted}
              testId="detail-upvote-button"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">{t("What happened")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#172B3A]" data-testid="detail-description">
                {c.description}
              </p>
            </CardContent>
          </Card>

          {c.photos.length > 0 && (
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-base">
                    <Camera className="size-4 text-[#237A62]" /> {t("Before: original complaint photos")} ({c.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="detail-photos">
                  {c.photos.map((photo, index) => (
                    <Dialog key={index}>
                      <DialogTrigger
                        className="overflow-hidden rounded-lg border border-[#E2E4DC]"
                        data-testid={`detail-photo-${index}`}
                      >
                        <img src={photo} alt={`${c.title} — photo ${index + 1}`} className="h-36 w-full object-cover transition-transform duration-150 hover:scale-105" />
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogTitle className="sr-only">{t("Complaint photo")} {index + 1}</DialogTitle>
                        <img src={photo} alt={`${c.title} — photo ${index + 1}`} className="max-h-[75vh] w-full rounded-lg object-contain" />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {c.status === "resolved" && c.resolution_photo && (
            <Card data-testid="detail-resolution-evidence">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Camera className="size-4 text-[#237A62]" /> {t("After: resolution evidence")}
                </CardTitle>
                {c.resolved_at && <p className="text-xs text-[#52656F]">{t("Resolved")} {formatDateTime(c.resolved_at)}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger className="overflow-hidden rounded-lg border border-[#E2E4DC]" data-testid="detail-resolution-photo">
                    <img src={c.resolution_photo} alt={`${c.title} — after resolution`} className="max-h-72 w-full object-cover" />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogTitle className="sr-only">{t("After resolution photo")}</DialogTitle>
                    <img src={c.resolution_photo} alt={`${c.title} — after resolution`} className="max-h-[75vh] w-full rounded-lg object-contain" />
                  </DialogContent>
                </Dialog>
                {c.resolution_remark && <p className="whitespace-pre-line text-sm text-[#52656F]" data-testid="detail-resolution-remark">{c.resolution_remark}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <MapView
              mode="browse"
              center={[c.lat, c.lng]}
              zoom={16}
              markers={marker}
              className="h-64 w-full rounded-xl border border-[#E2E4DC]"
            />
            <p className="mt-2 text-xs text-[#52656F]" data-testid="detail-coordinates">
              {t("Saved location")}: {c.lat.toFixed(6)}, {c.lng.toFixed(6)}
              {c.address ? ` · ${c.address}` : ""}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">{t("Official status history")}</CardTitle>
              <p className="text-xs text-[#52656F]">{t("Last updated")} {formatDateTime(c.updated_at)}</p>
            </CardHeader>
            <CardContent data-testid="detail-timeline">
              <StatusTimeline history={c.history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
