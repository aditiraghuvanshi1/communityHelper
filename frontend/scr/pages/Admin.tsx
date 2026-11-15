// Admin console: live KPIs, analytics charts, filterable complaint table and the
// status-update workflow. Server enforces the admin role; this page mirrors it.
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  ArrowBigUp,
  Clock3,
  Inbox,
  LogIn,
  MapPin,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/EmptyState";
import MapView, { type MapMarker } from "@/components/map/MapView";
import { CategoryChip, StatusBadge } from "@/components/StatusBadge";
import StatusTimeline from "@/components/StatusTimeline";
import { CATEGORIES, CATEGORY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/civic";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { fileToCompressedDataUrl, formatRelativeTime } from "@/lib/media";
import { LOCALITY_TREE } from "@/lib/localities";
import { useLanguage } from "@/lib/language-context";
import { useMe } from "@/lib/useAuth";
import type { AdminStats, Category, Complaint, ComplaintDetail, ComplaintPage, Status } from "@/lib/types";

const ALL = "all";

const TOWNS = Array.from(
  new Set(LOCALITY_TREE.flatMap((s) => s.districts.flatMap((d) => d.towns.map((t) => t.name)))),
).sort();

function complaintToMarker(c: Complaint): MapMarker {
  return {
    id: c.id, lat: c.lat, lng: c.lng, category: c.category,
    status: c.status, title: c.title, upvote_count: c.upvote_count,
  };
}

function ManageDialog({ complaintId, open, onClose }: { complaintId: string; open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: () => apiGet<ComplaintDetail>(`/complaints/${complaintId}`),
    enabled: open && Boolean(complaintId),
  });
  const [status, setStatus] = useState<string>("under_review");
  const [remark, setRemark] = useState("");
  const [resolutionRemark, setResolutionRemark] = useState("");
  const [resolutionPhoto, setResolutionPhoto] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && detail.data) {
      const options = STATUSES.filter((s) => s !== detail.data!.status);
      setStatus(options[0] ?? "under_review");
      setRemark("");
      setResolutionRemark("");
      setResolutionPhoto("");
    }
  }, [open, complaintId, detail.data]);

  const statusOptions = detail.data ? STATUSES.filter((s) => s !== detail.data.status) : STATUSES;

  async function submit() {
    if (status !== "resolved" && remark.trim().length < 3) {
      toast.error(t("Add a remark (at least 3 characters) — it is shown on the public timeline"));
      return;
    }
    if (status === "resolved" && !resolutionPhoto) {
      toast.error(t("Upload an after-resolution photo before resolving this complaint"));
      return;
    }
    setBusy(true);
    try {
      await apiPut<ComplaintDetail>(`/admin/complaints/${complaintId}/status`, {
        status,
        remark: remark.trim() || "Resolved with photographic evidence.",
        ...(status === "resolved" ? { resolution_photo: resolutionPhoto, resolution_remark: resolutionRemark.trim() || null } : {}),
      });
      toast.success(`${t("Status updated to")} ${t(STATUS_LABELS[status as keyof typeof STATUS_LABELS])}`);
      void queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      void queryClient.invalidateQueries({ queryKey: ["adminComplaints"] });
      void queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        toast.error(t("This complaint is already in that status"));
      } else {
        toast.error(t("Could not update the status — try again"));
      }
    } finally {
      setBusy(false);
    }
  }

  const c = detail.data;
  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl" data-testid="admin-manage-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Manage complaint")}</DialogTitle>
        </DialogHeader>
        {!c ? (
          <div className="h-64 animate-pulse rounded-lg bg-[#EAECE4]" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              <CategoryChip category={c.category} />
              <span className="text-xs text-[#52656F]">{formatRelativeTime(c.created_at)} · {t("by")} {c.reporter_name}</span>
            </div>
            <h3 className="font-heading text-base font-bold text-[#172B3A]">{c.title}</h3>
            <p className="text-sm leading-relaxed text-[#52656F]">{c.description}</p>
            {c.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2" data-testid="admin-dialog-photos">
                {c.photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Evidence ${index + 1}`} className="h-24 w-full rounded-lg border border-[#E2E4DC] object-cover" />
                ))}
              </div>
            )}
            <MapView
              mode="browse"
              center={[c.lat, c.lng]}
              zoom={16}
              markers={[complaintToMarker(c)]}
              className="h-48 w-full rounded-lg border border-[#E2E4DC]"
            />
            <p className="text-xs text-[#52656F]">
              <MapPin className="mr-1 inline size-3.5" />
              {c.locality}, {c.town} · {c.lat.toFixed(6)}, {c.lng.toFixed(6)}
              {c.address ? ` · ${c.address}` : ""}
            </p>

            <div className="rounded-lg border border-[#E2E4DC] bg-white p-4">
              <div className="font-heading text-sm font-bold text-[#172B3A]">{t("Update status")}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("New status")}</Label>
                  <Select value={status} onValueChange={(value: string) => setStatus(value)}>
                    <SelectTrigger data-testid="admin-status-select">
                      <SelectValue>{(v) => t(STATUS_LABELS[v as Status])}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>{t(STATUS_LABELS[s])}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="admin-remark">{t("Official remark (visible on the public timeline)")}</Label>
                  {status === "resolved" ? (
                    <div className="space-y-3">
                      <Label htmlFor="resolution-photo">{t("After-resolution photograph (required)")}</Label>
                      <Input
                        id="resolution-photo"
                        data-testid="admin-resolution-photo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await fileToCompressedDataUrl(file);
                            if (compressed.length > 1_600_000) throw new Error("Compressed image must be smaller than 1.2 MB");
                            setResolutionPhoto(compressed);
                          }
                          catch (error) { toast.error(error instanceof Error ? error.message : "Could not read that image"); event.target.value = ""; }
                        }}
                      />
                      {resolutionPhoto && <img src={resolutionPhoto} alt="Resolution evidence preview" className="h-28 rounded-lg border border-[#E2E4DC] object-cover" />}
                      <Label htmlFor="resolution-remark">{t("Resolution remarks (optional)")}</Label>
                      <Textarea id="resolution-remark" data-testid="admin-resolution-remark" value={resolutionRemark} onChange={(e) => setResolutionRemark(e.target.value)} rows={2} maxLength={600} />
                    </div>
                  ) : <Textarea
                    id="admin-remark"
                    data-testid="admin-remark-input"
                    placeholder={t("e.g. Work order issued to the zonal engineering section; repair crew scheduled for Thursday.")}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    maxLength={600}
                  />}
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose} data-testid="admin-dialog-cancel">{t("Cancel")}</Button>
                <Button size="sm" onClick={submit} disabled={busy} data-testid="admin-dialog-save">
                  {busy ? t("Saving…") : t("Save status update")}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-[#EAECE4] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#52656F]">{t("Timeline so far")}</div>
              <div className="mt-3">
                <StatusTimeline history={c.history} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useMe();
  const isAdmin = user?.role === "admin";

  const stats = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => apiGet<AdminStats>("/admin/stats"),
    enabled: isAdmin,
  });
  const [townFilter, setTownFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [managingId, setManagingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["adminComplaints", { townFilter, categoryFilter, statusFilter, search }],
    queryFn: () => {
      const p = new URLSearchParams();
      if (townFilter !== ALL) p.set("town", townFilter);
      if (categoryFilter !== ALL) p.set("category", categoryFilter);
      if (statusFilter !== ALL) p.set("status", statusFilter);
      if (search.trim()) p.set("q", search.trim());
      p.set("limit", "200");
      return apiGet<ComplaintPage>(`/admin/complaints?${p.toString()}`);
    },
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={user ? ShieldAlert : LogIn}
          title={user ? t("Administrator access required") : t("Sign in as an administrator")}
          description={
            user
              ? t("Your account does not have municipal admin rights. If you believe this is a mistake, contact the platform team.")
              : t("The admin console is restricted to authorised municipal accounts.")
          }
          action={!user ? <Button render={<Link to="/login?next=/admin" />} data-testid="admin-signin-cta">{t("Sign in")}</Button> : undefined}
          testId="admin-access-denied"
        />
      </div>
    );
  }

  const kpis = [
    { label: t("Total complaints"), value: stats.data?.total, icon: Inbox, testid: "admin-stat-total" },
    { label: t("Pending review"), value: stats.data?.pending, icon: Clock3, testid: "admin-stat-pending" },
    { label: t("In progress"), value: stats.data?.in_progress, icon: Wrench, testid: "admin-stat-progress" },
    { label: t("Resolved"), value: stats.data?.resolved, icon: ArrowBigUp, testid: "admin-stat-resolved" },
  ];
  const categoryData = Object.entries(stats.data?.by_category ?? {}).map(([key, count]) => ({
    label: t(CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] ?? key),
    count,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#237A62]">{t("Municipal desk")}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-[#172B3A]">{t("Admin dashboard")}</h1>
        </div>
        <p className="text-sm text-[#52656F]">{t("Signed in as")} {user!.name} · {t("administrator")}</p>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[#E2E4DC] bg-white p-4" data-testid={kpi.testid}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#52656F]">{kpi.label}</span>
              <kpi.icon className="size-4 text-[#237A62]" />
            </div>
            <div className="mt-2 font-heading text-3xl font-bold text-[#172B3A]">
              {kpi.value === undefined ? "—" : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">{t("Complaints by category")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 260 }} data-testid="admin-chart-category">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={categoryData} margin={{ left: 24, right: 12 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#237A62" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">{t("Reports — last 14 days")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 260 }} data-testid="admin-chart-daily">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.data?.daily ?? []} margin={{ left: -12, right: 12 }}>
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(label: string) => label} />
                  <Area dataKey="count" stroke="#172B3A" strokeWidth={2} fill="#E6A34A" fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + table */}
      <div className="mt-8 rounded-xl border border-[#E2E4DC] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Town")}</Label>
            <Select value={townFilter} onValueChange={(value: string) => setTownFilter(value)}>
              <SelectTrigger data-testid="admin-filter-town" className="w-[160px]">
                <SelectValue>{(v) => (v === ALL ? t("All towns") : (v as string))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("All towns")}</SelectItem>
                {TOWNS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Category")}</Label>
            <Select value={categoryFilter} onValueChange={(value: string) => setCategoryFilter(value)}>
              <SelectTrigger data-testid="admin-filter-category" className="w-[180px]">
                <SelectValue>{(v) => (v === ALL ? t("All categories") : t(CATEGORY_LABELS[v as Category]))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("All categories")}</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(CATEGORY_LABELS[c])}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Status")}</Label>
            <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
              <SelectTrigger data-testid="admin-filter-status" className="w-[160px]">
                <SelectValue>{(v) => (v === ALL ? t("All statuses") : t(STATUS_LABELS[v as Status]))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("All statuses")}</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(STATUS_LABELS[s])}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grow space-y-1.5">
            <Label className="text-xs" htmlFor="admin-search">{t("Search")}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52656F]" />
              <Input
                id="admin-search"
                data-testid="admin-search-input"
                placeholder={t("Title, description or locality")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-4" data-testid="admin-table">
          {list.isLoading ? (
            <div className="h-72 animate-pulse rounded-lg bg-[#EAECE4]" />
          ) : (list.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={Inbox}
              title={t("No complaints match these filters")}
              description={t("Adjust the town, category or status filters to see more of the queue.")}
              testId="admin-table-empty"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Complaint")}</TableHead>
                  <TableHead>{t("Locality")}</TableHead>
                  <TableHead>{t("Category")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Support")}</TableHead>
                  <TableHead>{t("Reported")}</TableHead>
                  <TableHead className="text-right">{t("Manage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data!.items.map((complaint) => (
                  <TableRow key={complaint.id} data-testid={`admin-row-${complaint.id}`}>
                    <TableCell className="max-w-[280px]">
                      <Link
                        to={`/complaints/${complaint.id}`}
                        className="line-clamp-1 font-medium text-[#172B3A] hover:text-[#237A62]"
                      >
                        {complaint.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-[#52656F]">
                      {complaint.locality}, {complaint.town}
                    </TableCell>
                    <TableCell className="text-sm text-[#52656F]">{t(CATEGORY_LABELS[complaint.category])}</TableCell>
                    <TableCell><StatusBadge status={complaint.status} /></TableCell>
                    <TableCell className="text-right text-sm font-medium">{complaint.upvote_count}</TableCell>
                    <TableCell className="text-sm text-[#52656F]">{formatRelativeTime(complaint.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        data-testid={`admin-manage-${complaint.id}`}
                        onClick={() => setManagingId(complaint.id)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <p className="mt-3 text-xs text-[#52656F]">
          {list.data ? `${list.data.total} complaints in view` : "Loading…"} · status changes appear on the public timeline instantly.
        </p>
      </div>

      {managingId && (
        <ManageDialog complaintId={managingId} open={Boolean(managingId)} onClose={() => setManagingId(null)} />
      )}
      <Button variant="ghost" size="sm" render={<Link to="/explore" />} className="mt-6" data-testid="admin-back-explore">
        <ArrowLeft className="size-4" /> Back to public view
      </Button>
    </div>
  );
}
