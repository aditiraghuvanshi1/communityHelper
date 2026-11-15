// Genuine interactive Leaflet map (OpenStreetMap tiles). Two modes:
// - "browse": complaint markers coloured by category, clickable, filterable by the caller
// - "pick": click anywhere or drag a marker to choose an exact location (report flow)
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/civic";
import type { Category, Status } from "@/lib/types";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  category: Category;
  status: Status;
  title: string;
  upvote_count: number;
}

interface MapViewProps {
  mode: "browse" | "pick";
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  selectedId?: string | null;
  onSelectMarker?: (id: string) => void;
  pickPosition?: [number, number] | null;
  onPick?: (pos: { lat: number; lng: number }) => void;
  className?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function categoryIcon(category: Category, selected: boolean): L.DivIcon {
  const size = selected ? 26 : 18;
  return L.divIcon({
    className: selected ? "cc-marker cc-marker-selected" : "cc-marker",
    html: `<span class="cc-marker-dot" style="background:${CATEGORY_COLORS[category]};width:${size}px;height:${size}px"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const PICK_ICON = L.divIcon({
  className: "cc-marker cc-marker-selected",
  html: `<span class="cc-marker-dot" style="background:#E6A34A;width:24px;height:24px"></span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function MapView({
  mode,
  center,
  zoom = 13,
  markers = [],
  selectedId = null,
  onSelectMarker,
  pickPosition = null,
  onPick,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const selectRef = useRef(onSelectMarker);
  selectRef.current = onSelectMarker;

  // Initialise the map exactly once, with a real OSM tile layer and attribution.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, { center, zoom, zoomControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    if (mode === "pick") {
      el.classList.add("cc-pick-cursor");
      map.on("click", (event: L.LeafletMouseEvent) => {
        pickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
      });
    }
    const observer = new ResizeObserver(() => {
      if (mapRef.current === map) map.invalidateSize();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      // A zoom transition still in flight would call _onZoomTransitionEnd on a removed
      // map (Leaflet's "_leaflet_pos" crash) — neutralise it before tearing down.
      const internal = map as unknown as { _onZoomTransitionEnd: () => void };
      internal._onZoomTransitionEnd = () => {};
      map.stop();
      map.off();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      pickMarkerRef.current = null;
    };
    // centre/zoom are read at mount; later changes flow through the recenter effect
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centre when the chosen locality or a picked position changes. No pan/zoom
  // animation: an in-flight animation racing the map's unmount is Leaflet's classic
  // "Cannot read properties of undefined (reading '_leaflet_pos')" crash.
  useEffect(() => {
    mapRef.current?.setView(center, zoom, { animate: false });
  }, [center[0], center[1], zoom]);

  // Sync complaint markers (browse mode).
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer || mode !== "browse") return;
    layer.clearLayers();
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon: categoryIcon(m.category, m.id === selectedId) });
      marker.bindPopup(
        `<div class="space-y-1" style="min-width:180px">
           <div style="font-weight:700;color:#172B3A">${escapeHtml(m.title)}</div>
           <div style="font-size:12px;color:#52656F">
             ${escapeHtml(CATEGORY_LABELS[m.category])} · ${escapeHtml(STATUS_LABELS[m.status])} · ${m.upvote_count} ${m.upvote_count === 1 ? "support" : "supports"}
           </div>
         </div>`,
      );
      marker.on("click", () => selectRef.current?.(m.id));
      marker.addTo(layer);
    }
  }, [markers, selectedId, mode]);

  // Sync the draggable pick marker (pick mode).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== "pick") return;
    if (!pickPosition) {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      return;
    }
    if (!pickMarkerRef.current) {
      const marker = L.marker(pickPosition, { icon: PICK_ICON, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        pickRef.current?.({ lat: pos.lat, lng: pos.lng });
      });
      pickMarkerRef.current = marker;
    } else {
      pickMarkerRef.current.setLatLng(pickPosition);
    }
  }, [pickPosition, mode]);

  return <div ref={containerRef} className={className} data-testid={`map-${mode}`} />;
}
