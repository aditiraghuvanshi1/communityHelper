// Landing page: hero with live locality map, real platform counters, how-it-works,
// category shortcuts and the newest reports — everything data-driven, nothing hardcoded.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowBigUp,
  CheckCircle2,
  ChevronRight,
  Map,
  MapPin,
  Megaphone,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ComplaintCard from "@/components/ComplaintCard";
import EmptyState from "@/components/EmptyState";
import MapView, { type MapMarker } from "@/components/map/MapView";
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/civic";
import { apiGet } from "@/lib/api";
import { useLocality } from "@/lib/locality-context";
import { useLanguage } from "@/lib/language-context";
import type { Complaint, ComplaintPage } from "@/lib/types";

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

export default function Home() {
  const { selection, center } = useLocality();
  const { t } = useLanguage();

  function pageParams(extra: string): string {
    const p = new URLSearchParams(extra);
    if (selection) {
      p.set("state", selection.state);
      p.set("district", selection.district);
      p.set("town", selection.town);
      if (selection.locality) p.set("locality", selection.locality);
    }
    return `/complaints?${p.toString()}`;
  }

  const total = useQuery({
    queryKey: ["homeTotal", selection?.state, selection?.district, selection?.town, selection?.locality],
    queryFn: () => apiGet<ComplaintPage>(pageParams("limit=1")),
  });
  const active = useQuery({
    queryKey: ["homeActive", selection?.town, selection?.locality],
    queryFn: () => apiGet<ComplaintPage>(pageParams("status=in_progress&limit=1")),
  });
  const resolved = useQuery({
    queryKey: ["homeResolved", selection?.town, selection?.locality],
    queryFn: () => apiGet<ComplaintPage>(pageParams("status=resolved&limit=1")),
  });
  const feed = useQuery({
    queryKey: ["homeFeed", selection?.town, selection?.locality],
    queryFn: () => apiGet<ComplaintPage>(pageParams("limit=3&sort=top")),
  });

  const scope = selection?.locality ?? selection?.town ?? t("every listed locality");
  const stats = [
    { label: t("Reports tracked"), value: total.data?.total, testid: "home-stat-total" },
    { label: t("Work in progress"), value: active.data?.total, testid: "home-stat-active" },
    { label: t("Resolved so far"), value: resolved.data?.total, testid: "home-stat-resolved" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[#E2E4DC] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#237A62]">
              {t("Community-powered civic reporting")}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold leading-tight tracking-tight text-[#172B3A] sm:text-5xl">
              {t("Your neighbourhood's problems,")}<br />{t("on the record.")}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#52656F]">
              {t("Report potholes, broken streetlights, overflowing garbage and more — pin it on the map, back reports from your neighbours, and follow every issue until the ward office closes it.")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" render={<Link to="/report" />} data-testid="hero-report-cta">
                <Megaphone className="size-4" /> {t("Report an issue")}
              </Button>
              <Button size="lg" variant="outline" render={<Link to="/explore" />} data-testid="hero-explore-cta">
                <Map className="size-4" /> {t("Explore the map")}
              </Button>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} data-testid={s.testid}>
                  <div className="font-heading text-2xl font-bold text-[#172B3A]">
                    {s.value === undefined ? "—" : s.value}
                  </div>
                  <div className="text-xs font-medium text-[#52656F]">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-1.5 text-sm text-[#52656F]">
              <MapPin className="size-4 text-[#237A62]" />
              {t("Currently showing:")} <span className="font-semibold text-[#172B3A]">{scope}</span>
            </p>
          </div>
          <div className="relative">
            <MapView
              mode="browse"
              center={center}
              zoom={13}
              markers={toMarkers(feed.data?.items ?? [])}
              className="h-[340px] w-full rounded-xl border border-[#E2E4DC] shadow-sm sm:h-[420px]"
            />
            <div className="absolute -bottom-4 left-4 rounded-lg border border-[#E2E4DC] bg-white px-4 py-2.5 shadow-md">
              <p className="text-xs font-medium text-[#52656F]">{t("Live reports on the map")}</p>
              <p className="font-heading text-sm font-bold text-[#172B3A]">
                {feed.data ? `${feed.data.items.length} pins in ${scope}` : "Loading live data…"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#172B3A]">{t("What can you report?")}</h2>
            <p className="mt-1 text-sm text-[#52656F]">{t("Eight categories, one accountable trail for each.")}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <Link
                key={category}
                to={`/explore?category=${category}`}
                data-testid={`home-category-${category}`}
                className="group flex items-center gap-3 rounded-xl border border-[#E2E4DC] bg-white px-4 py-3.5 transition-all duration-150 hover:border-[#CBD5E1] hover:shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EAECE4] text-[#172B3A] group-hover:bg-[#237A62] group-hover:text-white">
                  <Icon className="size-4.5" />
                </span>
                <span className="text-sm font-semibold text-[#172B3A]">{t(CATEGORY_LABELS[category])}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#172B3A]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-white">{t("From complaint to closure")}</h2>
          <p className="mt-1 text-sm text-[#9FB2BA]">
            {t("Every report follows one accountable trail — visible to you at every step.")}
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Megaphone,
                title: "Report it in two minutes",
                body: "Pin the exact spot on the map, add photos, pick a category. Done — the complaint is on record with a timestamp.",
              },
              {
                icon: Users,
                title: "Neighbours add weight",
                body: "Each support from a neighbour signals to the ward office that a problem affects the whole street, not one household.",
              },
              {
                icon: CheckCircle2,
                title: "Track until resolution",
                body: "Follow the official timeline — Under Review, Assigned, In Progress — with remarks from the desk handling your complaint.",
              },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E6A34A] font-heading text-base font-bold text-[#172B3A]">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2 font-heading text-base font-bold text-white">
                    <step.icon className="size-4 text-[#E6A34A]" />
                    {t(step.title)}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#9FB2BA]">{t(step.body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent reports */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#172B3A]">{t("Most-supported right now")}</h2>
            <p className="mt-1 text-sm text-[#52656F]">{t("The complaints your neighbours are rallying behind.")}</p>
          </div>
          <Button variant="ghost" size="sm" render={<Link to="/explore" />} data-testid="home-view-all">
            {t("View all")} <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="mt-6">
          {feed.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-white" />
              ))}
            </div>
          ) : (feed.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={Search}
              title={t("No reports here yet")}
              description={`Be the first to put an issue in ${scope} on the record.`}
              action={
                <Button render={<Link to="/report" />}>
                  {t("Report the first issue")} <ChevronRight className="size-4" />
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {feed.data!.items.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </div>
        {feed.data && feed.data.items.length > 0 && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-[#52656F]">
            <ArrowBigUp className="size-3.5 text-[#237A62]" />
            Sorted by community support in {scope}
          </p>
        )}
      </section>
    </div>
  );
}
