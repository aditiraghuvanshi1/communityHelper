// Explore: the complaint feed + live map with category/status filters, sorting and a
// map/list toggle. Browsing is public; supporting a complaint needs sign-in.
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowBigUp, List, LocateFixed, Map as MapIcon, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ComplaintCard from "@/components/ComplaintCard";
import EmptyState from "@/components/EmptyState";
import MapView, { type MapMarker } from "@/components/map/MapView";
import { CategoryChip, StatusBadge } from "@/components/StatusBadge";
import UpvoteButton from "@/components/UpvoteButton";
import { CATEGORIES, CATEGORY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/civic";
import { apiGet } from "@/lib/api";
import { formatRelativeTime } from "@/lib/media";
import { useLocality } from "@/lib/locality-context";
import { useLanguage } from "@/lib/language-context";
import type { Category, Complaint, ComplaintPage, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "all";

function toMarkers(items: Complaint[]): MapMarker[] {
  return items.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    category: c.category,
    status: c.status,
    title: c.title,
    upvote_count: c.upvote_count,
  }));
}

export default function Explore() {
  const { selection, center } = useLocality();
  const { t } = useLanguage();
  const [view, setView] = useState<"map" | "list">("map");
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<string>("new");
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (nearby) {
      p.set("near_lat", String(nearby.lat));
      p.set("near_lng", String(nearby.lng));
      p.set("radius_km", "5");
    } else if (selection) {
      p.set("state", selection.state);
      p.set("district", selection.district);
      p.set("town", selection.town);
      if (selection.locality) p.set("locality", selection.locality);
    }
    if (category !== ALL) p.set("category", category);
    if (status !== ALL) p.set("status", status);
    if (sort !== "new") p.set("sort", sort);
    p.set("limit", "100");
    return p.toString();
  }, [selection, category, status, sort, nearby]);

  const feed = useQuery({
    queryKey: ["complaints", queryString],
    queryFn: () => apiGet<ComplaintPage>(`/complaints?${queryString}`),
    placeholderData: keepPreviousData,
  });

  const items = feed.data?.items ?? [];
  const selected = selectedId ? items.find((c) => c.id === selectedId) ?? null : null;
  const scope = nearby
    ? "within 5 km of you"
    : selection
      ? selection.locality
        ? `${selection.locality}, ${selection.town}`
        : selection.town
      : "all localities";

  function detectNearby() {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser does not support location detection");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearby({ lat: position.coords.latitude, lng: position.coords.longitude });
        setView("map");
      },
      () => toast.error("Location permission denied — showing your selected locality instead"),
      { timeout: 10_000 },
    );
  }

  function resetFilters() {
    setCategory(ALL);
    setStatus(ALL);
    setSort("new");
    setNearby(null);
    setSelectedId(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#172B3A]">{t("Explore complaints")}</h1>
          <p className="mt-1 text-sm text-[#52656F]">
            {t("Showing")} <span data-testid="explore-count">{feed.data ? feed.data.total : "…"}</span> {t("issues in")}{" "}
            <span className="font-semibold text-[#172B3A]">{scope}</span>
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-[#EAECE4] p-1">
          <button
            data-testid="view-toggle-map"
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              view === "map" ? "bg-white text-[#172B3A] shadow-sm" : "text-[#52656F] hover:text-[#172B3A]",
            )}
          >
            <MapIcon className="size-4" /> {t("Map")}
          </button>
          <button
            data-testid="view-toggle-list"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              view === "list" ? "bg-white text-[#172B3A] shadow-sm" : "text-[#52656F] hover:text-[#172B3A]",
            )}
          >
            <List className="size-4" /> {t("List")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#E2E4DC] bg-white p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("Category")}</Label>
          <Select value={category} onValueChange={(value: string) => setCategory(value)}>
            <SelectTrigger data-testid="filter-category" className="w-[180px]">
              <SelectValue>{(v) => (v === ALL ? t("All categories") : t(CATEGORY_LABELS[v as Category]))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("All categories")}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{t(CATEGORY_LABELS[c])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("Status")}</Label>
          <Select value={status} onValueChange={(value: string) => setStatus(value)}>
            <SelectTrigger data-testid="filter-status" className="w-[160px]">
              <SelectValue>{(v) => (v === ALL ? t("All statuses") : t(STATUS_LABELS[v as Status]))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("All statuses")}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{t(STATUS_LABELS[s])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("Sort")}</Label>
          <Select value={sort} onValueChange={(value: string) => setSort(value)}>
            <SelectTrigger data-testid="filter-sort" className="w-[170px]">
              <SelectValue>{(v) => (v === "top" ? t("Most supported") : t("Newest first"))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{t("Newest first")}</SelectItem>
              <SelectItem value="top">{t("Most supported")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grow">
          <Button
            variant={nearby ? "default" : "outline"}
            data-testid="nearby-button"
            onClick={nearby ? () => setNearby(null) : detectNearby}
            className={cn(nearby && "bg-[#237A62] hover:bg-[#1d6653]")}
          >
            <LocateFixed className="size-4" />
            {nearby ? t("Nearby filter on — clear") : t("Near my location")}
          </Button>
        </div>
      </div>

      {/* Content */}
      {feed.isLoading ? (
        view === "map" ? (
          <div className="mt-5 h-[560px] animate-pulse rounded-xl bg-white" />
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        )
      ) : feed.isError ? (
        <div className="mt-5">
          <EmptyState
            icon={Search}
            title={t("Could not load complaints")}
            description={t("The feed is temporarily unavailable. Your data is safe — try again in a moment.")}
            action={
              <Button variant="outline" onClick={() => void feed.refetch()}>
                <RotateCcw className="size-4" /> {t("Retry")}
              </Button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={MapIcon}
            title={t("No complaints match these filters")}
            description={`Nothing reported in ${scope} for this combination yet. Widen the filters or set a different locality.`}
            action={
              <Button variant="outline" onClick={resetFilters} data-testid="reset-filters">
                <RotateCcw className="size-4" /> {t("Reset filters")}
              </Button>
            }
          />
        </div>
      ) : view === "map" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MapView
              mode="browse"
              center={nearby ? [nearby.lat, nearby.lng] : center}
              zoom={13}
              markers={toMarkers(items)}
              selectedId={selectedId}
              onSelectMarker={setSelectedId}
              className="h-[560px] w-full rounded-xl border border-[#E2E4DC]"
            />
          </div>
          <div className="space-y-3 lg:col-span-2">
            {selected && (
              <div
                className="rounded-xl border border-[#237A62] bg-white p-4"
                data-testid="selected-complaint-panel"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={selected.status} />
                  <CategoryChip category={selected.category} />
                </div>
                <h3 className="mt-2 font-heading text-base font-bold text-[#172B3A]">{selected.title}</h3>
                <p className="mt-1 text-xs text-[#52656F]">
                  {selected.locality}, {selected.town} · {formatRelativeTime(selected.created_at)} ·{" "}
                  {selected.reporter_name}
                </p>
                {selected.photos.length > 0 && (
                  <img
                    src={selected.photos[0]}
                    alt={selected.title}
                    className="mt-3 h-36 w-full rounded-lg border border-[#E2E4DC] object-cover"
                  />
                )}
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#52656F]">{selected.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <UpvoteButton
                    complaintId={selected.id}
                    upvoteCount={selected.upvote_count}
                    hasVoted={selected.viewer_has_voted}
                    size="sm"
                    testId="selected-upvote-button"
                  />
                  <Button size="sm" render={<Link to={`/complaints/${selected.id}`} />} data-testid="selected-open-details">
                    {t("Full details")}
                  </Button>
                </div>
              </div>
            )}
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1" data-testid="explore-side-list">
              {items.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} active={complaint.id === selectedId} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="explore-grid">
          {items.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
