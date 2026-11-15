// Citizen dashboard: everything this account has reported, plus real tallies.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowBigUp, CheckCircle2, LogIn, Megaphone, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComplaintCard from "@/components/ComplaintCard";
import EmptyState from "@/components/EmptyState";
import { apiGet } from "@/lib/api";
import { useMe } from "@/lib/useAuth";
import { useLanguage } from "@/lib/language-context";
import type { ComplaintPage } from "@/lib/types";

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useMe();
  const mine = useQuery({
    queryKey: ["myComplaints"],
    queryFn: () => apiGet<ComplaintPage>("/complaints/mine"),
    enabled: Boolean(user),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={LogIn}
          title={t("Sign in to see your complaints")}
          description={t("Your dashboard lists every issue you reported and how the ward office is progressing on each.")}
          action={<Button render={<Link to="/login?next=/dashboard" />} data-testid="dashboard-signin-cta">{t("Sign in")}</Button>}
        />
      </div>
    );
  }

  const items = mine.data?.items ?? [];
  const resolvedCount = items.filter((c) => c.status === "resolved").length;
  const supports = items.reduce((sum, c) => sum + c.upvote_count, 0);
  const stats = [
    { label: t("Complaints filed"), value: mine.data?.total ?? 0, icon: Megaphone, testid: "dashboard-stat-filed" },
    { label: t("Resolved"), value: resolvedCount, icon: CheckCircle2, testid: "dashboard-stat-resolved" },
    { label: t("Supports received"), value: supports, icon: ArrowBigUp, testid: "dashboard-stat-supports" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#172B3A]" data-testid="dashboard-greeting">
            {t("Hello,")} {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-[#52656F]">
            {t("Every issue you have put on the record, with its live official status.")}
          </p>
        </div>
        <Button render={<Link to="/report" />} data-testid="dashboard-report-cta">
          <Megaphone className="size-4" /> {t("Report a new issue")}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#E2E4DC] bg-white p-4" data-testid={stat.testid}>
            <stat.icon className="size-4 text-[#237A62]" />
            <div className="mt-2 font-heading text-2xl font-bold text-[#172B3A]">{stat.value}</div>
            <div className="text-xs font-medium text-[#52656F]">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-heading text-lg font-bold text-[#172B3A]">{t("My complaints")}</h2>
      <div className="mt-4">
        {mine.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-white" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title={t("You haven't reported anything yet")}
            description={t("Spot a pothole on your street? It takes two minutes to put it on the record — pin it, photograph it, submit.")}
            action={<Button render={<Link to="/report" />}>{t("Report your first issue")}</Button>}
            testId="dashboard-empty"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="dashboard-grid">
            {items.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
