"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  latitude: string;
  longitude: string;
  onSelect: (lat: string, lng: string) => void;
};

const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.187;
const DEFAULT_ZOOM = 12;

function buildMapHtml(lat: number, lng: number, hasMarker: boolean) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map').setView([${lat},${lng}],${hasMarker ? 16 : DEFAULT_ZOOM});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'&copy; OpenStreetMap',maxZoom:19
}).addTo(map);
var marker=${hasMarker ? `L.marker([${lat},${lng}]).addTo(map)` : "null"};
map.on('click',function(e){
  if(marker)map.removeLayer(marker);
  marker=L.marker([e.latlng.lat,e.latlng.lng]).addTo(map);
  parent.postMessage({type:'coord-pick',lat:e.latlng.lat.toFixed(7),lng:e.latlng.lng.toFixed(7)},'*');
});
<\/script>
</body></html>`;
}

export function CoordinatePicker({ latitude, longitude, onSelect }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [expanded, setExpanded] = useState(false);

  const lat = latitude ? parseFloat(latitude) : DEFAULT_LAT;
  const lng = longitude ? parseFloat(longitude) : DEFAULT_LNG;
  const hasMarker = !!(latitude && longitude);

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      if (e.data?.type === "coord-pick") {
        onSelect(e.data.lat, e.data.lng);
      }
    },
    [onSelect],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-xs font-semibold text-accent hover:text-accent/80 transition-colors mt-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        Pick on map instead
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between bg-panel-alt px-3 py-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Click the map to set coordinates</span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-muted hover:text-foreground text-xs transition-colors"
        >
          Hide map
        </button>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={buildMapHtml(lat, lng, hasMarker)}
        className="w-full border-0"
        style={{ height: 300 }}
        title="Pick property coordinates"
        sandbox="allow-scripts"
      />
    </div>
  );
}
