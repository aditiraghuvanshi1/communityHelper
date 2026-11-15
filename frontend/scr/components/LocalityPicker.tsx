// Locality picker: cascading state → district → town → locality selects, Nominatim
// search, and GPS detection. Writes through the shared locality context.
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { LOCALITY_TREE } from "@/lib/localities";
import { useLanguage } from "@/lib/language-context";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useLocality, type LocalitySelection } from "@/lib/locality-context";
import type { GeocodeResult } from "@/lib/types";

const WHOLE_TOWN = "whole_town";

interface Draft extends LocalitySelection {
  lat?: number;
  lng?: number;
}

function selectionFromGeocode(result: GeocodeResult, fallbackTown: string): Draft {
  const addr = result.address;
  return {
    state: addr.state || "Karnataka",
    district: addr.district || addr.state || "Bengaluru Urban",
    town: addr.city || addr.district || fallbackTown,
    locality: addr.suburb || undefined,
    lat: result.lat,
    lng: result.lng,
  };
}

export function LocalityPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selection, setSelection } = useLocality();
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Draft | null>(selection ? { ...selection } : null);
  const [query, setQuery] = useState("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    if (open) {
      setDraft(selection ? { ...selection } : null);
      setQuery("");
    }
  }, [open, selection]);

  const search = useQuery({
    queryKey: ["geoSearch", debouncedQuery],
    queryFn: () =>
      apiGet<{ results: GeocodeResult[] }>(`/geo/search?q=${encodeURIComponent(debouncedQuery.trim())}`),
    enabled: debouncedQuery.trim().length >= 3,
  });

  const stateNames = useMemo(() => LOCALITY_TREE.map((s) => s.name), []);
  const districts = useMemo(
    () => LOCALITY_TREE.find((s) => s.name === draft?.state)?.districts ?? [],
    [draft?.state],
  );
  const towns = useMemo(
    () => districts.find((d) => d.name === draft?.district)?.towns ?? [],
    [districts, draft?.district],
  );
  const localities = useMemo(
    () => towns.find((t) => t.name === draft?.town)?.localities ?? [],
    [towns, draft?.town],
  );

  function detectLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(t("Your browser does not support location detection"));
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await apiGet<{ result: GeocodeResult | null }>(
            `/geo/reverse?lat=${latitude}&lng=${longitude}`,
          );
          const base: Draft = data.result
            ? selectionFromGeocode(data.result, "Bengaluru")
            : { state: "Karnataka", district: "Bengaluru Urban", town: "Bengaluru" };
          setDraft({ ...base, lat: latitude, lng: longitude });
          toast.success("Detected your location — pick the matching locality if the name looks off");
        } catch {
          toast.error(t("Could not look up your location — choose it from the lists below"));
        } finally {
          setGpsBusy(false);
        }
      },
      () => {
        setGpsBusy(false);
        toast.error(t("Location permission denied — choose your locality from the lists"));
      },
      { timeout: 10_000 },
    );
  }

  function apply() {
    if (!draft || !draft.state || !draft.district || !draft.town) {
      toast.error(t("Pick a state, district and town first"));
      return;
    }
    const { lat, lng, ...selection } = draft;
    setSelection({ ...selection, ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}) } as LocalitySelection);
    toast.success(`Now showing reports for ${selection.locality ?? selection.town}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="locality-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Choose your locality")}</DialogTitle>
          <DialogDescription>
            {t("Complaints are grouped by locality. Search a place, detect your location, or pick from the lists.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locality-search">{t("Search any Indian town or neighbourhood")}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52656F]" />
              <Input
                id="locality-search"
                data-testid="locality-search-input"
                placeholder="e.g. Indiranagar, Bengaluru"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {debouncedQuery.trim().length >= 3 && (
              <div className="max-h-44 overflow-y-auto rounded-lg border border-[#E2E4DC] bg-white">
                {search.isFetching && (
                  <div className="px-3 py-2.5 text-sm text-[#52656F]">{t("Searching places…")}</div>
                )}
                {!search.isFetching && (search.data?.results.length ?? 0) === 0 && (
                  <div className="px-3 py-2.5 text-sm text-[#52656F]">{t("No matching places found")}</div>
                )}
                {search.data?.results.map((result) => (
                  <button
                    key={`${result.display_name}-${result.lat}`}
                    data-testid="locality-search-result"
                    className="flex w-full items-start gap-2 border-b border-[#E2E4DC] px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-[#EAECE4]"
                    onClick={() => {
                      setDraft(selectionFromGeocode(result, draft?.town ?? "Bengaluru"));
                      setQuery("");
                    }}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#237A62]" />
                    <span className="line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
            {debouncedQuery.trim().length > 0 && debouncedQuery.trim().length < 3 && (
              <p className="text-xs text-[#52656F]">{t("Type at least 3 characters to search")}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("State")}</Label>
              <Select
                value={draft?.state ?? ""}
                onValueChange={(value: string) =>
                  setDraft({ state: value, district: "", town: "" })
                }
              >
                <SelectTrigger data-testid="locality-state-select"><SelectValue placeholder={t("Select state")} /></SelectTrigger>
                <SelectContent>
                  {stateNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name === "Tamil Nadu" ? t("Tamil Nadu (Chennai)") : name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("District")}</Label>
              <Select
                value={draft?.district || ""}
                onValueChange={(value: string) => setDraft((d) => ({ state: d?.state ?? "", district: value, town: "" }))}
                disabled={!draft?.state}
              >
                <SelectTrigger data-testid="locality-district-select"><SelectValue placeholder={t("Select district")} /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Town / City")}</Label>
              <Select
                value={draft?.town || ""}
                onValueChange={(value: string) => setDraft((d) => ({ state: d?.state ?? "", district: d?.district ?? "", town: value }))}
                disabled={!draft?.district}
              >
                <SelectTrigger data-testid="locality-town-select"><SelectValue placeholder={t("Select town")} /></SelectTrigger>
                <SelectContent>
                  {towns.map((t) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Locality (optional)")}</Label>
              <Select
                value={draft?.locality || WHOLE_TOWN}
                onValueChange={(value: string) =>
                  setDraft((d) => ({
                    state: d?.state ?? "",
                    district: d?.district ?? "",
                    town: d?.town ?? "",
                    locality: value === WHOLE_TOWN ? undefined : value,
                  }))
                }
                disabled={!draft?.town || localities.length === 0}
              >
                <SelectTrigger data-testid="locality-area-select">
                  <SelectValue placeholder={draft?.town ? t("Whole town") : t("Select town first")}>
                    {(v) => (!v || v === WHOLE_TOWN ? t("Whole town") : (v as string))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WHOLE_TOWN}>{t("Whole town")}</SelectItem>
                  {localities.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              data-testid="detect-location-button"
              onClick={detectLocation}
              disabled={gpsBusy}
            >
              <LocateFixed className="size-4" />
              {gpsBusy ? t("Detecting…") : t("Use my current location")}
            </Button>
            <Button data-testid="apply-locality-button" onClick={apply} disabled={!draft?.town}>
              {t("Use this locality")}
            </Button>
          </div>
          {draft?.lat !== undefined && draft?.lng !== undefined && (
            <p className="text-xs text-[#52656F]">
              {t("Map coordinates captured:")} {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
