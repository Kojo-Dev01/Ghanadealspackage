"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { GalleryUploader } from "./gallery-uploader";
import { CoordinatePicker } from "./coordinate-picker";

/* ── Formatted number input helper ──
   Shows commas (e.g. "1,250,000") while storing the raw numeric string in form state.
   Strips non-numeric chars on change (keeps one decimal point for prices). */
function useFormattedNumber(
  value: string,
  onChange: (raw: string) => void,
  opts?: { allowDecimal?: boolean },
) {
  const [focused, setFocused] = useState(false);

  const display = focused
    ? value
    : value
      ? Number(value).toLocaleString("en-GH", {
          maximumFractionDigits: opts?.allowDecimal ? 2 : 0,
        })
      : "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/,/g, "");
      if (opts?.allowDecimal) {
        // allow digits and one decimal point
        raw = raw.replace(/[^\d.]/g, "");
        const parts = raw.split(".");
        if (parts.length > 2) raw = parts[0] + "." + parts.slice(1).join("");
      } else {
        raw = raw.replace(/\D/g, "");
      }
      onChange(raw);
    },
    [onChange, opts?.allowDecimal],
  );

  return { display, handleChange, setFocused };
}

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
  "Apartment", "House", "Villa", "Townhouse", "Penthouse", "Compound",
  "Duplex", "Bungalow", "Full Floor", "Half Floor", "Whole Building",
  "Land", "Commercial", "Office", "Bulk Sale Unit", "Hotel & Hotel Apartment",
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
          <PriceInput value={data.price} onChange={(v) => set("price", v)} placeholder="e.g. 250,000" className={inputCls} />
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
        {/* Location search / map / link picker */}
        <CoordinatePicker
          latitude={data.latitude}
          longitude={data.longitude}
          location={data.location}
          region={data.region}
          regions={REGIONS}
          inputCls={inputCls}
          onSelect={(result) => {
            set("latitude", result.lat);
            set("longitude", result.lng);
            if (result.location) set("location", result.location);
            if (result.region) set("region", result.region);
          }}
        />

        {/* Region & Specific Location (editable, auto-filled from map) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Location Details</h3>
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
          <p className="text-[10px] text-muted/60 mt-2">These fields are auto-filled when you search or pick a location above. You can also edit them manually.</p>
        </div>

        {/* Hidden-ish coordinate display (read-only for reference) */}
        {data.latitude && data.longitude && (
          <div className="flex items-center gap-3 text-xs text-muted bg-panel-alt rounded-lg px-3 py-2 border border-border">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Coordinates: <strong className="text-foreground">{data.latitude}, {data.longitude}</strong></span>
          </div>
        )}
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
              <AreaInput value={data.area} onChange={(v) => set("area", v)} placeholder="e.g. 2,500" className={inputCls} />
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
    const mainImage = data.gallery[0] ?? "";
    const otherImages = data.gallery.slice(1);

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

        {/* Amenities multi-select */}
        <AmenitiesPicker
          value={data.amenities}
          onChange={(v) => set("amenities", v)}
          inputCls={inputCls}
        />

        {/* Main Image */}
        <GalleryUploader
          value={mainImage ? [mainImage] : []}
          onChange={(urls) => {
            const next = urls.length > 0 ? [urls[0], ...otherImages] : [...otherImages];
            set("gallery", next);
          }}
          max={1}
          label="Main Image"
          hint="This photo will be shown as the cover in search results."
        />

        {/* Additional Gallery */}
        <GalleryUploader
          value={otherImages}
          onChange={(urls) => {
            const next = mainImage ? [mainImage, ...urls] : [...urls];
            set("gallery", next);
          }}
          max={9}
          label="Gallery Photos"
          hint="Upload additional property photos. Up to 9 more images."
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

/* ── Formatted number sub-components ── */

function PriceInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const { display, handleChange, setFocused } = useFormattedNumber(value, onChange, { allowDecimal: true });
  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className={className}
    />
  );
}

function AreaInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const { display, handleChange, setFocused } = useFormattedNumber(value, onChange, { allowDecimal: true });
  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className={className}
    />
  );
}

/* ── Amenities picker with search ── */

const COMMON_AMENITIES = [
  // General
  "Swimming Pool", "Shared Pool", "Private Pool", "Children's Pool",
  "Gym / Fitness Center", "Shared Gym", "Private Gym",
  "Security", "Garden", "Private Garden", "Balcony", "Terrace", "Rooftop",
  "Central A/C", "Air Conditioning", "Generator / Backup Power", "Borehole / Water Tank",
  "Gated Community", "CCTV / Surveillance", "Intercom", "Elevator / Lift",
  "WiFi / Internet", "Cable TV", "Laundry Room", "Storage Room", "Study",
  // Staff & Service
  "Maids Room", "Maid Service", "Boys Quarters (BQ)", "Staff Quarters", "Servant Quarters",
  "Concierge Service",
  // Parking
  "Parking", "Covered Parking", "Garage", "Car Port",
  // Leisure
  "Playground", "Children's Play Area", "Tennis Court", "Basketball Court",
  "Clubhouse", "Spa / Sauna", "Shared Spa", "Jacuzzi", "Private Jacuzzi",
  "Barbecue Area", "Fireplace",
  // Interior
  "Walk-in Closet", "Built in Wardrobes", "Built in Kitchen Appliances", "Fitted Kitchen",
  "Smart Home System", "Ensuite Bathrooms", "Guest Toilet", "Dining Area",
  // Exterior & Views
  "View of Water", "View of Landmark", "Solar Panels",
  "Fully Tiled", "POP Ceiling", "Marble Flooring", "Granite Countertops",
  "Paved Compound", "Fence / Wall",
  // Other
  "Wheelchair Accessible", "Pets Allowed", "Pet Friendly",
];

function AmenitiesPicker({
  value,
  onChange,
  inputCls,
}: {
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = value
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  const filtered = COMMON_AMENITIES.filter(
    (a) =>
      a.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(a),
  );

  function toggle(amenity: string) {
    if (selected.includes(amenity)) {
      onChange(selected.filter((a) => a !== amenity).join(", "));
    } else {
      onChange([...selected, amenity].join(", "));
    }
  }

  function addCustom() {
    const trimmed = search.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed].join(", "));
    setSearch("");
  }

  return (
    <div className="grid gap-1.5" ref={wrapperRef}>
      <span className="text-xs font-semibold text-muted">Amenities & Features</span>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[11px] font-medium px-2.5 py-1 rounded-full hover:bg-accent/20 transition-colors cursor-pointer"
            >
              {a}
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addCustom(); }
          }}
          placeholder={selected.length > 0 ? "Search or type to add more…" : "Search amenities…"}
          className={inputCls + " w-full"}
        />
        {search.trim() && !COMMON_AMENITIES.some((a) => a.toLowerCase() === search.trim().toLowerCase()) && (
          <button
            type="button"
            onClick={addCustom}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer hover:bg-accent-hover transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="border border-border rounded-lg bg-panel shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => { toggle(a); setSearch(""); }}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-panel-alt transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0">
                  {selected.includes(a) && (
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  )}
                </span>
                {a}
              </button>
            ))}
          </div>
          {/* Scroll indicator footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-panel-alt text-[10px] text-muted">
            <span>{filtered.length} available{search ? ` for "${search}"` : ""}</span>
            <span className="flex items-center gap-1">
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              Scroll for more
            </span>
          </div>
        </div>
      )}

      <span className="text-[10px] text-muted/60">
        {selected.length} selected{selected.length > 0 ? "" : " — click above to browse"} · {COMMON_AMENITIES.length} amenities available · Type a custom one and press Enter
      </span>
    </div>
  );
}
