// Report flow: three focused steps — details, exact location on the map, photos — then submit.
// Signing in is required to submit; browsing stays open.
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Check, LocateFixed, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/EmptyState";
import MapView from "@/components/map/MapView";
import { LocalityPickerDialog } from "@/components/LocalityPicker";
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/civic";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { fileToCompressedDataUrl } from "@/lib/media";
import { useLocality } from "@/lib/locality-context";
import { useLanguage } from "@/lib/language-context";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useMe } from "@/lib/useAuth";
import type { Category, ComplaintDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Details", "Location", "Photos & submit"];
const MAX_PHOTOS = 3;

export default function Report() {
  const { data: user, isLoading: meLoading } = useMe();
  const { selection, center } = useLocality();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const debouncedSearch = useDebouncedValue(locationSearch, 350);

  const search = useQuery({
    queryKey: ["reportGeoSearch", debouncedSearch],
    queryFn: () => apiGet<{ results: { display_name: string; lat: number; lng: number }[] }>(
      `/geo/search?q=${encodeURIComponent(debouncedSearch.trim())}`,
    ),
    enabled: debouncedSearch.trim().length >= 3,
    placeholderData: keepPreviousData,
  });

  const mapCenter: [number, number] = useMemo(
    () => (position ? [position.lat, position.lng] : center),
    [position, center],
  );

  if (meLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={MapPin}
          title={t("Sign in to report an issue")}
          description={t("Reporting needs an account so the ward office can follow up with the right person. Browsing the map stays open to everyone.")}
          action={
            <div className="flex gap-2">
              <Button render={<Link to="/login?next=/report" />} data-testid="report-signin-cta">{t("Sign in")}</Button>
              <Button variant="outline" render={<Link to="/register?next=/report" />} data-testid="report-register-cta">{t("Create account")}</Button>
            </div>
          }
        />
      </div>
    );
  }

  function validateStep0(): boolean {
    const next: Record<string, string> = {};
    if (title.trim().length < 10) next.title = t("Give the issue a clear title of at least 10 characters");
    if (description.trim().length < 20) next.description = t("Describe the problem in at least 20 characters so the desk can act on it");
    if (!category) next.category = t("Pick the category that fits best");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep1(): boolean {
    const next: Record<string, string> = {};
    if (!selection) next.locality = t("Choose your locality first — it routes the complaint");
    if (!position) next.position = t("Pin the exact spot on the map: click the map or use your GPS location");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_PHOTOS} photos per complaint`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    for (const file of chosen) {
      try {
        const dataUrl = await fileToCompressedDataUrl(file);
        setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, dataUrl] : prev));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not read that image");
      }
    }
  }

  async function submit() {
    if (!selection || !position) return;
    setSubmitting(true);
    try {
      const created = await apiPost<ComplaintDetail>("/complaints", {
        title: title.trim(),
        description: description.trim(),
        category,
        state: selection.state,
        district: selection.district,
        town: selection.town,
        locality: selection.locality ?? selection.town,
        address: address.trim(),
        lat: position.lat,
        lng: position.lng,
        photos,
      });
      queryClient.setQueryData(["complaint", created.id], created);
      for (const key of [["complaints"], ["myComplaints"], ["homeTotal"], ["homeActive"], ["homeResolved"], ["homeFeed"]]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      toast.success("Complaint submitted — it is now on the public record", {
        description: "The municipal desk reviews new reports within a few working days.",
      });
      navigate(`/complaints/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error("Your session expired — sign in again to submit");
        navigate("/login?next=/report");
      } else {
        toast.error("Could not submit the complaint — check your connection and try again");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function detectGps() {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser does not support location detection");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location captured from GPS — drag the amber pin if it needs adjusting");
      },
      () => toast.error("Location permission denied — click the map to place the pin manually"),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" render={<Link to="/explore" />}>
        <ArrowLeft className="size-4" /> {t("Back to explore")}
      </Button>
      <h1 className="mt-3 font-heading text-2xl font-bold text-[#172B3A]">{t("Report an issue")}</h1>
      <p className="mt-1 text-sm text-[#52656F]">
        {t("A precise report gets fixed faster. Two minutes is all it takes.")}
      </p>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2" data-testid="report-stepper">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                index < step && "bg-[#237A62] text-white",
                index === step && "bg-[#172B3A] text-white",
                index > step && "border border-[#D5D9CD] bg-white text-[#52656F]",
              )}
            >
              {index < step ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className={cn("hidden text-xs font-semibold sm:block", index === step ? "text-[#172B3A]" : "text-[#52656F]")}>
              {t(label)}
            </span>
            {index < STEPS.length - 1 && <span className="h-px flex-1 bg-[#D5D9CD]" />}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-xl border border-[#E2E4DC] bg-white p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="report-title">{t("Title")}</Label>
              <Input
                id="report-title"
                data-testid="report-title-input"
                placeholder="e.g. Deep pothole on the 100 Feet Road signal crossing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
              />
              {errors.title && <p className="text-xs font-medium text-[#C2410C]" data-testid="report-title-error">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-description">{t("What exactly is wrong?")}</Label>
              <Textarea
                id="report-description"
                data-testid="report-description-input"
                placeholder="Describe the problem, since when, and how it affects people passing through…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={4000}
              />
              {errors.description && <p className="text-xs font-medium text-[#C2410C]" data-testid="report-description-error">{errors.description}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("Category")}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICONS[c];
                  const activeCategory = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      data-testid={`report-category-${c}`}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all duration-150",
                        activeCategory
                          ? "border-[#237A62] bg-[#EAEFEA] text-[#172B3A]"
                          : "border-[#E2E4DC] bg-white text-[#52656F] hover:border-[#CBD5E1]",
                      )}
                    >
                      <Icon className="size-5" style={activeCategory ? { color: CATEGORY_COLORS[c] } : undefined} />
                      <span className="text-xs font-semibold leading-tight">{t(CATEGORY_LABELS[c])}</span>
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="text-xs font-medium text-[#C2410C]" data-testid="report-category-error">{errors.category}</p>}
            </div>
            <div className="flex justify-end">
              <Button data-testid="report-next-1" onClick={() => { if (validateStep0()) setStep(1); }}>
                {t("Next: pin the location")} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#EAECE4] px-3 py-2.5 text-sm">
              <span className="flex items-center gap-1.5 text-[#172B3A]">
                <MapPin className="size-4 text-[#237A62]" />
                {selection ? (
                  <>{t("Routing to")} <strong>{selection.locality ?? selection.town}</strong>, {selection.district}</>
                ) : (
                  t("No locality chosen yet")
                )}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} data-testid="report-change-locality">
                {selection ? t("Change") : t("Choose locality")}
              </Button>
            </div>
            {errors.locality && <p className="text-xs font-medium text-[#C2410C]">{errors.locality}</p>}

            <MapView
              mode="pick"
              center={mapCenter}
              zoom={position ? 16 : 13}
              pickPosition={position ? [position.lat, position.lng] : null}
              onPick={setPosition}
              className="h-80 w-full rounded-xl border border-[#E2E4DC]"
            />
            {errors.position && <p className="text-xs font-medium text-[#C2410C]">{errors.position}</p>}
            <p className="text-xs text-[#52656F]">
              {t("Click the map to drop the pin, drag it to fine-tune, or use your current GPS position.")}
              {position && (
                <span className="ml-1 font-semibold text-[#237A62]" data-testid="report-pinned-coords">
                  Pinned: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </span>
              )}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={detectGps} data-testid="report-gps-button">
                <LocateFixed className="size-4" /> {t("Use my current location")}
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-search">{t("Search a place to jump the map there")}</Label>
              <Input
                id="location-search"
                data-testid="report-location-search"
                placeholder="e.g. Koramangala 5th Block"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
              {debouncedSearch.trim().length >= 3 && (search.data?.results.length ?? 0) > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-[#E2E4DC]">
                  {search.data!.results.map((result) => (
                    <button
                      key={`${result.display_name}-${result.lat}`}
                      data-testid="report-location-result"
                      className="block w-full border-b border-[#E2E4DC] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-[#EAECE4]"
                      onClick={() => {
                        setPosition({ lat: result.lat, lng: result.lng });
                        setLocationSearch("");
                      }}
                    >
                      <MapPin className="mr-1.5 inline size-3.5 text-[#237A62]" />
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-address">{t("Nearest landmark (optional)")}</Label>
              <Input
                id="report-address"
                data-testid="report-address-input"
                placeholder="e.g. Opposite the bus depot gate"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={240}
              />
            </div>

            {(errors.locality || errors.position) && (
              <p className="rounded-lg bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#991B1B]" data-testid="report-step2-error">
                {errors.locality ?? errors.position}
              </p>
            )}
            <div className="flex justify-between pt-1">
              <Button variant="outline" onClick={() => setStep(0)} data-testid="report-back-1">
                <ArrowLeft className="size-4" /> {t("Back")}
              </Button>
              <Button data-testid="report-next-2" onClick={() => { if (validateStep1()) setStep(2); }}>
                {t("Next: add photos")} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t("Photos (up to 3, optional but powerful)")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative" data-testid={`report-photo-preview-${index}`}>
                    <img src={photo} alt={`Attachment ${index + 1}`} className="h-24 w-full rounded-lg border border-[#E2E4DC] object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      data-testid={`report-photo-remove-${index}`}
                      className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-[#E2E4DC] bg-white text-[#C2410C] shadow-sm"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label
                    className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#D5D9CD] text-xs font-medium text-[#52656F] hover:border-[#237A62] hover:text-[#237A62]"
                    data-testid="report-photo-input-label"
                  >
                    <Camera className="size-5" />
                    {t("Add photo")}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      data-testid="report-photo-input"
                      onChange={(e) => {
                        void handlePhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-[#52656F]">Photos are compressed in your browser before upload; nothing over ~1 MB is stored.</p>
            </div>

            <div className="rounded-lg bg-[#EAECE4] p-4 text-sm" data-testid="report-review">
              <div className="font-heading text-sm font-bold text-[#172B3A]">{t("Review")}</div>
              <ul className="mt-2 space-y-1 text-[#52656F]">
                <li><strong className="text-[#172B3A]">{title.trim() || "Untitled"}</strong> — {category ? t(CATEGORY_LABELS[category]) : "no category"}</li>
                <li>{position ? `Pinned at ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : "No location pinned"}</li>
                <li>
                  Routing to {selection ? `${selection.locality ?? selection.town}, ${selection.district}` : "no locality"} ·{" "}
                  {photos.length} photo{photos.length === 1 ? "" : "s"}
                </li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="report-back-2">
                <ArrowLeft className="size-4" /> {t("Back")}
              </Button>
              <Button onClick={submit} disabled={submitting} data-testid="report-submit">
                {submitting ? t("Submitting…") : t("Submit complaint")}
              </Button>
            </div>
          </div>
        )}
      </div>
      <LocalityPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
