"use client";

import { useState, useTransition } from "react";
import { GalleryUploader } from "./gallery-uploader";
import { CoordinatePicker } from "./coordinate-picker";

/* ── Types ── */
export type ListingFormData = {
  title: string;
  listingType: "sale" | "rent" | "new";
  type: string;
  price: string;
  priceLabel: string;
  region: string;
  location: string;
  beds: string;
  baths: string;
  area: string;
  furnishing: string;
  parking: string;
  description: string;
  amenities: string;
  gallery: string[];
  latitude: string;
  longitude: string;
  floorPlans: string[];
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<ListingFormData>;
  submitLabel?: string;
};

const STEPS = [
  { key: "details", label: "Property Details" },
  { key: "location", label: "Location & Specs" },
  { key: "media", label: "Description & Media" },
  { key: "review", label: "Review & Submit" },
] as const;

const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Northern",
  "Volta", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Savannah", "North East", "Oti", "Western North",
];

const PROPERTY_TYPES = [
  "Apartment", "House", "Villa", "Townhouse", "Land", "Commercial", "Office",
];

const inputCls =
  "border border-border rounded-lg bg-panel-alt px-3 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

/* ── Component ── */
export function ListingFormWizard({ action, defaultValues, submitLabel = "Submit Listing" }: Props) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [data, setData] = useState<ListingFormData>({
    title: defaultValues?.title ?? "",
    listingType: defaultValues?.listingType ?? "sale",
    type: defaultValues?.type ?? "Apartment",
    price: defaultValues?.price ?? "",
    priceLabel: defaultValues?.priceLabel ?? "",
    region: defaultValues?.region ?? "",
    location: defaultValues?.location ?? "",
    beds: defaultValues?.beds ?? "0",
    baths: defaultValues?.baths ?? "0",
    area: defaultValues?.area ?? "0",
    furnishing: defaultValues?.furnishing ?? "",
    parking: defaultValues?.parking ?? "",
    description: defaultValues?.description ?? "",
    amenities: defaultValues?.amenities ?? "",
    gallery: defaultValues?.gallery ?? [],
    latitude: defaultValues?.latitude ?? "",
    longitude: defaultValues?.longitude ?? "",
    floorPlans: defaultValues?.floorPlans ?? [],
  });

  function set<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  /* ── Validation per step ── */
  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!data.title.trim()) return "Title is required.";
      if (!data.price || Number(data.price) <= 0) return "Price must be greater than zero.";
    }
    if (s === 1) {
      if (!data.region) return "Region is required.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(s: number) {
    // Only allow going back or to a validated step
    if (s < step) { setError(""); setStep(s); return; }
    // Going forward — validate all intermediate steps
    for (let i = step; i < s; i++) {
      const err = validateStep(i);
      if (err) { setError(err); setStep(i); return; }
    }
    setError("");
    setStep(s);
  }

  function handleSubmit() {
    const err = validateStep(0) || validateStep(1);
    if (err) { setError(err); return; }
    setError("");

    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      fd.set(k, Array.isArray(v) ? JSON.stringify(v) : v);
    }

    startTransition(() => {
      action(fd);
    });
  }

  /* ── Step renderers ── */
  function renderDetails() {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Title *
            <input
              value={data.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={200}
              placeholder="e.g. 3 Bedroom Apartment in East Legon"
              className={inputCls}
            />
          </label>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Listing Type *
          <select value={data.listingType} onChange={(e) => set("listingType", e.target.value as "sale" | "rent" | "new")} className={inputCls}>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
            <option value="new">New Development</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Property Type *
          <select value={data.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Price (GHS) *
          <input type="number" value={data.price} onChange={(e) => set("price", e.target.value)} min={0} step="0.01" placeholder="e.g. 250000" className={inputCls} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Price Label <span className="font-normal opacity-60">(optional)</span>
          <input value={data.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} maxLength={50} placeholder="e.g. /month, /year" className={inputCls} />
        </label>
      </div>
    );
  }

  function renderLocation() {
    return (
      <div className="grid gap-6">
        {/* Location */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Location</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Region *
              <select value={data.region} onChange={(e) => set("region", e.target.value)} className={inputCls}>
                <option value="">Select region</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Specific Location
              <input value={data.location} onChange={(e) => set("location", e.target.value)} maxLength={200} placeholder="e.g. East Legon, Airport Residential" className={inputCls} />
            </label>
          </div>
        </div>
        {/* Map Coordinates */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Map Coordinates <span className="font-normal opacity-60">(optional)</span></h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Latitude
              <input type="number" value={data.latitude} onChange={(e) => set("latitude", e.target.value)} step="0.0000001" min={-90} max={90} placeholder="e.g. 5.6037" className={inputCls} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Longitude
              <input type="number" value={data.longitude} onChange={(e) => set("longitude", e.target.value)} step="0.0000001" min={-180} max={180} placeholder="e.g. -0.1870" className={inputCls} />
            </label>
          </div>
          <CoordinatePicker
            latitude={data.latitude}
            longitude={data.longitude}
            onSelect={(lat, lng) => { set("latitude", lat); set("longitude", lng); }}
          />
          <p className="text-[10px] text-muted/60 mt-1">Enter GPS coordinates manually or click the map to set the property location.</p>
        </div>
        {/* Specs */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Specifications</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Bedrooms
              <input type="number" value={data.beds} onChange={(e) => set("beds", e.target.value)} min={0} max={99} className={inputCls} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Bathrooms
              <input type="number" value={data.baths} onChange={(e) => set("baths", e.target.value)} min={0} max={99} className={inputCls} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Area (sq ft)
              <input type="number" value={data.area} onChange={(e) => set("area", e.target.value)} min={0} step="0.01" className={inputCls} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Furnishing
              <select value={data.furnishing} onChange={(e) => set("furnishing", e.target.value)} className={inputCls}>
                <option value="">Not specified</option>
                <option value="Furnished">Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Parking
              <select value={data.parking} onChange={(e) => set("parking", e.target.value)} className={inputCls}>
                <option value="">Not specified</option>
                <option value="1 Space">1 Space</option>
                <option value="2 Spaces">2 Spaces</option>
                <option value="3+ Spaces">3+ Spaces</option>
                <option value="Garage">Garage</option>
                <option value="None">None</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  }

  function renderMedia() {
    return (
      <div className="grid gap-4">
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Description
          <textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Describe the property — features, surroundings, condition..."
            className={inputCls + " resize-y"}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Amenities
          <input
            value={data.amenities}
            onChange={(e) => set("amenities", e.target.value)}
            maxLength={1000}
            placeholder="Swimming Pool, Gym, Security, Garden (comma-separated)"
            className={inputCls}
          />
          <span className="text-[10px] text-muted/60">Separate amenities with commas</span>
        </label>
        <GalleryUploader
          value={data.gallery}
          onChange={(urls) => set("gallery", urls)}
          max={10}
          label="Property Photos"
          hint="First photo will be the main image shown in search results. You can upload up to 10 photos."
        />
        <GalleryUploader
          value={data.floorPlans}
          onChange={(urls) => set("floorPlans", urls)}
          max={5}
          label="Floor Plans"
          hint="Upload floor plan images (optional). Up to 5 floor plans."
        />
      </div>
    );
  }

  function renderReview() {
    const amenitiesList = data.amenities.split(",").map((a) => a.trim()).filter(Boolean);
    const price = Number(data.price) || 0;

    return (
      <div className="grid gap-5">
        {/* Property Details */}
        <div className="bg-panel-alt border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Property Details</h3>
            <button type="button" onClick={() => goToStep(0)} className="text-xs text-accent hover:underline cursor-pointer">Edit</button>
          </div>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Title</dt><dd className="text-foreground">{data.title || "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Listing Type</dt><dd className="text-foreground capitalize">{data.listingType === "sale" ? "For Sale" : "For Rent"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Property Type</dt><dd className="text-foreground">{data.type}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Price</dt><dd className="text-foreground">GHS {price.toLocaleString()}{data.priceLabel ? ` ${data.priceLabel}` : ""}</dd></div>
          </dl>
        </div>

        {/* Location & Specs */}
        <div className="bg-panel-alt border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Location & Specs</h3>
            <button type="button" onClick={() => goToStep(1)} className="text-xs text-accent hover:underline cursor-pointer">Edit</button>
          </div>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Region</dt><dd className="text-foreground">{data.region || "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Location</dt><dd className="text-foreground">{data.location || "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Beds / Baths</dt><dd className="text-foreground">{data.beds} bed · {data.baths} bath</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Area</dt><dd className="text-foreground">{Number(data.area) ? `${Number(data.area).toLocaleString()} sq ft` : "—"}</dd></div>
            {data.furnishing && <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Furnishing</dt><dd className="text-foreground">{data.furnishing}</dd></div>}
            {data.parking && <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Parking</dt><dd className="text-foreground">{data.parking}</dd></div>}
            {(data.latitude || data.longitude) && <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Coordinates</dt><dd className="text-foreground">{data.latitude}, {data.longitude}</dd></div>}
          </dl>
        </div>

        {/* Description & Media */}
        <div className="bg-panel-alt border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Description & Media</h3>
            <button type="button" onClick={() => goToStep(2)} className="text-xs text-accent hover:underline cursor-pointer">Edit</button>
          </div>
          {data.description ? (
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4 mb-2">{data.description}</p>
          ) : (
            <p className="text-sm text-muted italic mb-2">No description provided.</p>
          )}
          {amenitiesList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {amenitiesList.map((a) => (
                <span key={a} className="bg-accent/10 text-accent text-[11px] px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          )}
          {data.gallery.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.gallery.map((url, i) => (
                <div key={url} className="rounded-lg overflow-hidden border border-border w-20 h-14 relative">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-0.5 left-0.5 bg-accent text-white text-[8px] font-bold px-1 rounded">Main</span>}
                </div>
              ))}
            </div>
          )}
          {data.floorPlans.length > 0 && (
            <div>
              <p className="text-[10px] text-muted mb-1">{data.floorPlans.length} floor plan{data.floorPlans.length !== 1 ? "s" : ""}</p>
              <div className="flex flex-wrap gap-2">
                {data.floorPlans.map((url, i) => (
                  <div key={url} className="rounded-lg overflow-hidden border border-border w-20 h-14">
                    <img src={url} alt={`Floor plan ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Step indicator ── */
  function renderStepper() {
    return (
      <nav className="flex items-center gap-1 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => goToStep(i)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer
                ${active ? "bg-accent text-white" : done ? "bg-accent/10 text-accent" : "bg-panel-alt text-muted"}
              `}
            >
              <span className={`
                w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold leading-none
                ${active ? "bg-white/20 text-white" : done ? "bg-accent text-white" : "bg-border text-muted"}
              `}>
                {done ? "✓" : i + 1}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>
    );
  }

  /* ── Main render ── */
  const stepContent = [renderDetails, renderLocation, renderMedia, renderReview];
  const isLast = step === STEPS.length - 1;

  return (
    <div>
      {renderStepper()}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg px-4 py-2.5 text-sm mb-4">
          {error}
        </div>
      )}

      <section className="bg-panel border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">{STEPS[step].label}</h2>
        {stepContent[step]()}
      </section>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-panel-alt transition-colors cursor-pointer"
          >
            ← Back
          </button>
        )}
        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Submitting…" : submitLabel}
          </button>
        )}
        <span className="text-xs text-muted ml-auto">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>
    </div>
  );
}
