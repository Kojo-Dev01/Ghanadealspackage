# GhanaDeals — Google Maps System

## Overview

Google Maps is used in three distinct contexts:

| Context | Where | Purpose |
|---------|-------|---------|
| **Listings map** | `/listings` page | Multi-property map with price-tag markers and info cards |
| **Property detail map** | `/property/[id]` page | Single-property pin with image card overlay |
| **Coordinate picker** | Seller dashboard — new/edit listing | Address search + draggable pin for setting listing coordinates |

All three use the same API key. Coordinates are stored in the `properties` table and returned by the public API. Listings without coordinates are hidden from map views but still appear in list views.

---

## API Key

**Environment variable:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC5MrcurEu8rBwqqKA6Fo3BZK6h3j5SHu4
```

Set in the root `.env`. The `NEXT_PUBLIC_` prefix makes it available to the browser in Next.js apps. The backfill script also reads it under the same name.

**Mobile app:** Use this same key. Configure it in your mobile env file — just `GOOGLE_MAPS_API_KEY` (without the `NEXT_PUBLIC_` prefix is fine, but you'll need to pass it to the SDK explicitly).

**APIs enabled on this key:**
- Maps JavaScript API
- Places API (Autocomplete)
- Geocoding API

---

## Libraries Used (Web)

```json
"@react-google-maps/api": "^2.20.8"
"@googlemaps/js-api-loader": "1.16.8"
"@googlemaps/markerclusterer": "2.5.3"
```

The web app loads the `places` library alongside the Maps JS SDK:
```typescript
const LIBRARIES: ("places")[] = ["places"];
// passed to useJsApiLoader({ libraries: LIBRARIES })
```

**Mobile equivalent:** Use `react-native-maps` (for rendering) + `react-native-google-places-autocomplete` (for address search) + the Google Geocoding REST API for reverse geocoding. All three point to the same API key.

---

## Ghana Bounding Box

Used by all map components to restrict autocomplete and set default map bounds:

```typescript
const GHANA_BOUNDS = {
  north: 11.175,
  south: 4.737,
  east:   1.199,
  west:  -3.261,
};

const GHANA_CENTER = { lat: 7.9465, lng: -1.0232 };
```

---

## 1. Listings Map

**File:** [apps/web/components/listings-map.tsx](../apps/web/components/listings-map.tsx)

**Loaded by:** [apps/web/components/listings-content.tsx](../apps/web/components/listings-content.tsx) via dynamic import (no SSR):
```typescript
const ListingsMap = dynamic(
  () => import("./listings-map").then((m) => ({ default: m.ListingsMap })),
  { ssr: false },
);
```

### Props

```typescript
type Props = {
  properties: PropertyRecord[];  // full list from API — only those with lat/lng are shown on map
  hoveredId: string | null;      // ID of property card being hovered in the list
  onHover: (id: string | null) => void;
};
```

### Behaviour

- Only properties where `latitude != null && longitude != null` are rendered on the map (`mappable` array).
- On load, `fitBounds()` is called:
  - 0 properties → zoom to all of Ghana
  - 1 property → `setCenter` + `zoom: 14`
  - 2+ properties → `fitBounds` with 50px padding on all sides
- Clicking a price marker **selects** it (toggles — click again to deselect). Shows info card popup.
- Clicking the map background deselects.
- Hovering a property card (list side) highlights the matching marker (`map-price-tag--active` class).

### Custom Markers (Price Tags)

Markers are rendered as `OverlayViewF` positioned at `OVERLAY_MOUSE_TARGET` pane. Each marker is a `<button>` element:

```tsx
<button className={`map-price-tag${active ? " map-price-tag--active" : ""}`}>
  From {shortPrice(property.price)}
</button>
```

**Price formatting:**
```typescript
function shortPrice(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}
// 1500000 → "1.5M"  |  250000 → "250K"  |  800 → "800"
```

**CSS classes** (defined in `apps/web/app/globals.css`):
- `.map-price-tag` — default state
- `.map-price-tag--active` — hovered or selected state (red background, white text)

### Info Card Popup

When a marker is selected, an `OverlayViewF` positioned at the same coordinate shows a card:

```tsx
<div className="map-info-card">
  <button className="map-info-close" onClick={onClose}>✕</button>
  <Link href={`/property/${property.id}`}>
    <img src={property.image} ... />
    <div className="map-info-body">
      <div className="map-info-price">{property.priceFormatted}</div>
      <div className="map-info-title">{property.title}</div>
      <div className="map-info-specs">
        {beds} Beds · {baths} Baths · {area} sqm
      </div>
      <div className="map-info-location">{property.location}</div>
    </div>
  </Link>
</div>
```

Tapping the card navigates to the property detail page.

### Map Options

```typescript
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI:    true,
  zoomControl:         true,
  mapTypeControl:      false,
  streetViewControl:   false,
  fullscreenControl:   false,
  clickableIcons:      false,
  gestureHandling:     "greedy",   // single-finger scroll = zoom (no two-finger requirement)
  minZoom:             5,
  styles: [
    { featureType: "poi",     stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};
```

---

## 2. Property Detail Map

**File:** [apps/web/components/property-detail-map.tsx](../apps/web/components/property-detail-map.tsx)

**Used in:** [apps/web/app/property/[id]/page.tsx](../apps/web/app/property/%5Bid%5D/page.tsx) — only rendered when `property.latitude != null && property.longitude != null`.

### Props

```typescript
type Props = {
  latitude:       number;
  longitude:      number;
  title:          string;
  image:          string;          // primary listing image URL
  priceFormatted: string;          // e.g. "GHS 450,000"
  type:           string;          // e.g. "House", "Apartment"
  listingType:    string;          // "sale" | "rent" | "new" | "land" | "uncompleted"
};
```

### Behaviour

- Fixed zoom level: **16**
- Map centers at `{ lat: latitude + 0.0012, lng: longitude }` — slight north offset so the marker card doesn't clip the top of the map container
- Container: `100% width × 220px height`, `border-radius: 12px`
- No marker selection / interactivity — the entire marker is an `<a>` link to Google Maps

### Custom Marker

Rendered as `OverlayViewF` → `OVERLAY_MOUSE_TARGET`. Positioned with CSS `transform: translate(-50%, -100%)` so the pointer triangle sits exactly on the coordinate.

Structure:
```
┌──────────────┐  ← 160px wide, 2px red border, 10px radius
│  [image]     │  ← 160×90px, objectFit: cover
│  [title]     │  ← 11px bold, 1 line, ellipsis
└──────┬───────┘
       ▼           ← 8px CSS triangle (red fill)
```

**Colour values:**
- Border: `var(--red, #E63946)`
- Background: `var(--bg-card, #fff)`
- Title text: `var(--text-primary, #1a1a2e)`
- Triangle: `border-top: 8px solid var(--red, #E63946)`

### Overlaid UI (absolute positioned, not inside the OverlayView)

```
┌────────────────────────────────┐
│ [Villa for Sale]  [GHS 450K]  │  ← top-left red tag, top-right white price tag
│                                │
│          [map]                 │
│                                │
│                [View on ↗ GM] │  ← bottom-right green link
└────────────────────────────────┘
```

**"View on Google Maps" URL:**
```
https://www.google.com/maps/search/?api=1&query={latitude},{longitude}
```

### Map Options (detail map)

```typescript
{
  disableDefaultUI:   true,
  zoomControl:        true,
  mapTypeControl:     false,
  streetViewControl:  false,
  fullscreenControl:  false,
  clickableIcons:     false,
  gestureHandling:    "greedy",
  minZoom:            6,
  styles: [
    { featureType: "poi",     stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
}
```

---

## 3. Coordinate Picker (Seller Dashboard)

**File:** [apps/agents/components/coordinate-picker.tsx](../apps/agents/components/coordinate-picker.tsx)

**Used in:** Listing creation and edit wizard (`apps/agents/components/listing-form-wizard.tsx`).

### Props

```typescript
type Props = {
  latitude:  string;        // decimal string, e.g. "5.6037107"
  longitude: string;        // decimal string, e.g. "-0.1869644"
  location?: string;        // current location name (auto-filled)
  region?:   string;        // current region (auto-filled)
  regions:   string[];      // list of all Ghana regions for matching
  onSelect:  (result: LocationResult) => void;
  inputCls?: string;        // optional CSS class for the search input
};

type LocationResult = {
  lat:       string;
  lng:       string;
  location?: string;   // extracted neighbourhood/locality
  region?:   string;   // matched Ghana region
};
```

### Initial State

```typescript
const GHANA_CENTER = { lat: 7.9465, lng: -1.0232 };
const DEFAULT_ZOOM = 7;   // when no coordinates set yet
const PLACED_ZOOM  = 16;  // after placing a pin
```

If `latitude` and `longitude` props are non-empty, the map opens centred on the existing pin at zoom 16. Otherwise it opens on Ghana center at zoom 7.

### Search Input (Places Autocomplete)

Uses `@react-google-maps/api` `Autocomplete` component:

```typescript
<Autocomplete
  onLoad={(ac) => { autocompleteRef.current = ac; }}
  onPlaceChanged={onPlaceChanged}
  options={{
    componentRestrictions: { country: "gh" },   // Ghana only
    bounds: GHANA_BOUNDS,
    strictBounds: false,
  }}
>
  <input
    ref={searchInputRef}
    type="text"
    placeholder="Search for a location in Ghana…"
    value={searchValue}
    onChange={(e) => setSearchValue(e.target.value)}
  />
</Autocomplete>
```

**On place selected (`onPlaceChanged`):**
1. Reads `place.geometry.location` → lat/lng
2. Calls `extractLocation(place.address_components)` → locality name
3. Calls `matchRegion(place.address_components, regions)` → Ghana region
4. Pans map to new location, sets zoom to 16
5. Calls `onSelect({ lat, lng, location, region })`

### Map Click / Marker Drag (Reverse Geocoding)

When the user clicks the map or drags the marker, reverse geocoding runs:

```typescript
const gc = new google.maps.Geocoder();
gc.geocode({ location: { lat, lng } }, (results, status) => {
  if (status === "OK" && results?.[0]) {
    const components = results[0].address_components;
    const location = extractLocation(components);
    const region   = matchRegion(components, regions);
    onSelect({ lat: String(lat), lng: String(lng), location, region });
  } else {
    onSelect({ lat: String(lat), lng: String(lng) });
  }
});
```

**Address component parsing:**

```typescript
// Location name — first match among:
function extractLocation(components): string {
  // checks: sublocality, sublocality_level_1, neighborhood, locality
  // returns joined string, e.g. "Osu, Accra"
}

// Region — strips " Region" suffix, case-insensitive match
function matchRegion(components, knownRegions): string | undefined {
  const adminLevel1 = components.find(c => c.types.includes("administrative_area_level_1"));
  const raw = adminLevel1.long_name.replace(/ Region$/i, "").trim();
  return knownRegions.find(r => r.toLowerCase() === raw.toLowerCase());
}
```

### Ghana Regions List

The 16 regions used for matching and validation:

```typescript
const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Northern",
  "Volta", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Savannah", "North East", "Oti", "Western North",
];
```

---

## 4. Database — Coordinate Storage

### Schema (migration `007_tier1_features.sql`)

```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude  numeric(10, 7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);

CREATE INDEX IF NOT EXISTS idx_properties_lat_lng
  ON properties (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

**Precision:** `numeric(10, 7)` = 7 decimal places ≈ 1mm accuracy.

**Nullability:** Both columns are nullable. Many older listings have `NULL` coordinates — these are excluded from map queries automatically.

---

## 5. API — Coordinate Fields & Bounding Box Filter

**Endpoint:** `GET /v1/properties`

### Coordinate Fields in Response

```typescript
{
  id:             string;
  latitude?:      number;    // undefined if NULL in DB
  longitude?:     number;    // undefined if NULL in DB
  // ... all other property fields
}
```

Always check for existence before using on mobile:
```typescript
if (property.latitude != null && property.longitude != null) {
  // safe to place on map
}
```

### Bounding Box Filter (for map viewport queries)

Pass the current map viewport corners as query parameters to fetch only properties visible on screen:

```
GET /v1/properties?swLat=5.5&swLng=-0.3&neLat=5.7&neLng=-0.1
```

| Param | Type | Description |
|-------|------|-------------|
| `swLat` | number string | Southwest corner latitude |
| `swLng` | number string | Southwest corner longitude |
| `neLat` | number string | Northeast corner latitude |
| `neLng` | number string | Northeast corner longitude |

All four must be provided together. If any are missing or NaN, the filter is skipped and all coordinates are returned. Can be combined with any other filter (`region`, `type`, `minPrice`, etc.).

**Server-side filter logic:**
```typescript
if (allFourParamsValid) {
  query
    .gte("latitude",  swLat)
    .lte("latitude",  neLat)
    .gte("longitude", swLng)
    .lte("longitude", neLng)
    .not("latitude",  "is", null)
    .not("longitude", "is", null);
}
```

**Mobile usage pattern:**
```
// On map region change:
const bounds = mapRef.current.getBounds();
const ne = bounds.getNorthEast();
const sw = bounds.getSouthWest();
fetch(`/v1/properties?swLat=${sw.lat}&swLng=${sw.lng}&neLat=${ne.lat}&neLng=${ne.lng}`);
```

---

## 6. Backfill Script — Geocoding Missing Coordinates

**File:** [scripts/backfill-coords.mjs](../scripts/backfill-coords.mjs)

For listings created without coordinates, this script geocodes them using the Google Geocoding REST API.

### Usage

```bash
# Dry run — logs what would be updated, no DB writes
node scripts/backfill-coords.mjs preview

# Apply — writes lat/lng to DB for all NULL-coordinate listings
node scripts/backfill-coords.mjs apply
```

### How it geocodes

```javascript
// Query format: "{location}, {region}, Ghana"
// e.g. "East Legon, Greater Accra, Ghana"
const query = [row.location, row.region, "Ghana"].filter(Boolean).join(", ");

const url = `https://maps.googleapis.com/maps/api/geocode/json`
          + `?address=${encodeURIComponent(query)}`
          + `&components=country:GH`
          + `&key=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
```

- Uses the first result only
- Country restricted to Ghana (`components=country:GH`)
- Only processes rows where `latitude IS NULL`

---

## 7. Mobile Implementation Guide

### SDK recommendation

| Need | Recommended library |
|------|-------------------|
| Map rendering | `react-native-maps` with Google Maps provider |
| Address autocomplete | `react-native-google-places-autocomplete` |
| Reverse geocoding | `@react-native-community/geolocation` + Google Geocoding REST API |

### API key setup (React Native)

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="AIzaSyC5MrcurEu8rBwqqKA6Fo3BZK6h3j5SHu4" />
```

**iOS** — `AppDelegate.swift` / `AppDelegate.m`:
```swift
GMSServices.provideAPIKey("AIzaSyC5MrcurEu8rBwqqKA6Fo3BZK6h3j5SHu4")
```

### Replicate the listings map behaviour

```typescript
// 1. Fetch properties (with optional bbox)
const { items } = await fetch(`${API_BASE}/v1/properties?limit=50`).then(r => r.json());

// 2. Filter to mappable only
const mappable = items.filter(p => p.latitude != null && p.longitude != null);

// 3. Render price-tag markers
mappable.map(p => (
  <Marker
    key={p.id}
    coordinate={{ latitude: p.latitude, longitude: p.longitude }}
    onPress={() => setSelected(p.id)}
  >
    <View style={styles.priceTag}>
      <Text style={styles.priceTagText}>From {shortPrice(p.price)}</Text>
    </View>
  </Marker>
));

// 4. Show bottom sheet / card when marker tapped
```

### Replicate the detail map behaviour

```typescript
<MapView
  provider={PROVIDER_GOOGLE}
  region={{
    latitude:      property.latitude + 0.0012,   // slight north offset
    longitude:     property.longitude,
    latitudeDelta:  0.005,
    longitudeDelta: 0.005,
  }}
  scrollEnabled={false}
  zoomEnabled={true}
>
  <Marker coordinate={{ latitude: property.latitude, longitude: property.longitude }}>
    {/* Custom card view — image + title + red border */}
  </Marker>
</MapView>
```

**"Open in Google Maps" deep link:**
```typescript
const url = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
Linking.openURL(url);
```

### Places autocomplete — Ghana restriction

```typescript
<GooglePlacesAutocomplete
  placeholder="Search location in Ghana…"
  query={{
    key: GOOGLE_MAPS_API_KEY,
    language: 'en',
    components: 'country:gh',   // restrict to Ghana
  }}
  requestUrl={{
    url: 'https://maps.googleapis.com/maps/api',  // direct (or proxy through your API)
    useOnPlatform: 'web',
  }}
  onPress={(data, details) => {
    const lat = details?.geometry?.location?.lat;
    const lng = details?.geometry?.location?.lng;
    // extract address_components same as web version
  }}
  fetchDetails={true}
/>
```

### Reverse geocoding (REST, usable from mobile)

```
GET https://maps.googleapis.com/maps/api/geocode/json
  ?latlng={lat},{lng}
  &components=country:GH
  &key={GOOGLE_MAPS_API_KEY}
```

Parse `results[0].address_components` using the same logic as the web:
- `administrative_area_level_1` → strip " Region" suffix → match against 16 Ghana regions
- `sublocality` / `neighborhood` / `locality` → location name string

---

## 8. Key File Reference

| File | Purpose |
|------|---------|
| [apps/web/components/listings-map.tsx](../apps/web/components/listings-map.tsx) | Multi-property map with price markers + info cards |
| [apps/web/components/property-detail-map.tsx](../apps/web/components/property-detail-map.tsx) | Single property map with image card marker |
| [apps/agents/components/coordinate-picker.tsx](../apps/agents/components/coordinate-picker.tsx) | Places autocomplete + draggable pin for listing creation |
| [apps/api/src/routes/properties.ts](../apps/api/src/routes/properties.ts) | Property API — `latitude`, `longitude` fields + bbox filter |
| [supabase/migrations/007_tier1_features.sql](../supabase/migrations/007_tier1_features.sql) | DB schema for coordinate columns |
| [scripts/backfill-coords.mjs](../scripts/backfill-coords.mjs) | Geocode missing coordinates for existing listings |
