/* ============================================
   GHANADEALS V2 — APP.JS
   Complete SPA Application Logic
   ============================================ */

// ============ STATE ============
let currentUser = null;
let currentTheme = 'light';
let savedProperties = new Set();
let currentView = 'list'; // list or grid — default is list (horizontal cards)
let adminAuthenticated = false;
let currentAdminSection = 'dashboard';
let adminChartsInitialized = false;
let accountType = 'buyer';

// ============ PROPERTY DATA ============
const properties = [
  {
    id: 1,
    title: "Luxury 4-Bedroom Villa in East Legon",
    image: "./assets/properties/property-villa-1.jpg",
    imageLg: "./assets/properties/large_property-villa-1.jpg",
    gallery: ["./assets/properties/large_property-villa-1.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg","./assets/properties/large_property-kitchen-1.jpg"],
    price: 2800000,
    priceFormatted: "₵2,800,000",
    category: "sale",
    type: "Villa",
    beds: 4, baths: 4, area: 450,
    location: "East Legon, Accra",
    region: "Greater Accra",
    agent: { name: "Kwame Asante", company: "Asante Premier Properties", phone: "+233241234567", color: "#E63946" },
    badges: ["verified", "premium"],
    furnishing: "Furnished",
    parking: "2 Covered",
    description: "This stunning 4-bedroom villa in the prestigious East Legon area features a modern architectural design with premium finishes throughout. The property boasts a spacious open-plan living area, state-of-the-art kitchen, luxurious master suite with walk-in closet, and a spectacular infinity pool overlooking manicured gardens. Perfect for families seeking luxury living in Accra's most sought-after neighborhood.",
    amenities: ["Pool", "Garden", "Security", "Generator", "Borehole", "Boys Quarters", "CCTV", "Parking", "Fitted Kitchen", "Water Tank"],
    photos: 24,
    ref: "GD-VL-001",
    added: "2026-02-15"
  },
  {
    id: 2,
    title: "Modern 3-Bedroom Apartment, Airport Residential",
    image: "./assets/properties/property-apartment-1.jpg",
    imageLg: "./assets/properties/large_property-apartment-1.jpg",
    gallery: ["./assets/properties/large_property-apartment-1.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-kitchen-1.jpg"],
    price: 850000,
    priceFormatted: "₵850,000",
    category: "sale",
    type: "Apartment",
    beds: 3, baths: 2, area: 185,
    location: "Airport Residential, Accra",
    region: "Greater Accra",
    agent: { name: "Ama Mensah", company: "Mensah Realty", phone: "+233242345678", color: "#3B82F6" },
    badges: ["verified"],
    furnishing: "Semi-Furnished",
    parking: "1 Covered",
    description: "A beautifully designed 3-bedroom apartment in the heart of Airport Residential Area. This modern unit features floor-to-ceiling windows flooding the space with natural light, high-quality Italian marble flooring, a fully equipped kitchen with German appliances, and a spacious balcony with panoramic city views. The building offers 24/7 security, a communal gym, and dedicated parking.",
    amenities: ["Security", "Generator", "CCTV", "Parking", "Gym", "Elevator", "Fitted Kitchen"],
    photos: 18,
    ref: "GD-AP-002",
    added: "2026-02-18"
  },
  {
    id: 3,
    title: "Contemporary Townhouse in Cantonments",
    image: "./assets/properties/property-townhouse-1.jpg",
    imageLg: "./assets/properties/large_property-townhouse-1.jpg",
    gallery: ["./assets/properties/large_property-townhouse-1.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg"],
    price: 1200000,
    priceFormatted: "₵1,200,000",
    category: "sale",
    type: "Townhouse",
    beds: 4, baths: 3, area: 280,
    location: "Cantonments, Accra",
    region: "Greater Accra",
    agent: { name: "Kofi Adjei", company: "Adjei Real Estate", phone: "+233243456789", color: "#10B981" },
    badges: ["verified"],
    furnishing: "Unfurnished",
    parking: "2 Covered",
    description: "This contemporary townhouse in the exclusive Cantonments neighborhood offers sophisticated urban living. Spread across three levels, the home features an open-concept living and dining area, a modern kitchen with breakfast bar, four generously-sized bedrooms, and a rooftop terrace with breathtaking views. The gated community provides round-the-clock security and beautifully maintained communal gardens.",
    amenities: ["Garden", "Security", "Generator", "Parking", "Fitted Kitchen", "Water Tank"],
    photos: 15,
    ref: "GD-TH-003",
    added: "2026-02-10"
  },
  {
    id: 4,
    title: "Executive 5-Bedroom Mansion, Trasacco Valley",
    image: "./assets/properties/property-house-2.jpg",
    imageLg: "./assets/properties/large_property-house-2.jpg",
    gallery: ["./assets/properties/large_property-house-2.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg","./assets/properties/large_property-kitchen-1.jpg"],
    price: 5500000,
    priceFormatted: "₵5,500,000",
    category: "sale",
    type: "House",
    beds: 5, baths: 6, area: 650,
    location: "Trasacco Valley, Accra",
    region: "Greater Accra",
    agent: { name: "Abena Osei", company: "Prestige Ghana", phone: "+233244567890", color: "#8B5CF6" },
    badges: ["premium", "verified"],
    furnishing: "Furnished",
    parking: "4 Covered",
    description: "An exceptional 5-bedroom executive mansion in the prestigious Trasacco Valley estate. This grand residence features a marble-clad entrance foyer, formal living and dining rooms, a state-of-the-art cinema room, fully equipped gym, and a resort-style outdoor area with heated pool and jacuzzi. The property sits on a large plot with mature landscaping and offers unparalleled privacy and luxury.",
    amenities: ["Pool", "Garden", "Security", "Generator", "Borehole", "Boys Quarters", "CCTV", "Parking", "Gym", "Fitted Kitchen", "Water Tank"],
    photos: 32,
    ref: "GD-HS-004",
    added: "2026-01-28"
  },
  {
    id: 5,
    title: "Beachfront Villa with Infinity Pool",
    image: "./assets/properties/property-villa-2.jpg",
    imageLg: "./assets/properties/large_property-villa-2.jpg",
    gallery: ["./assets/properties/large_property-villa-2.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg"],
    price: 3200000,
    priceFormatted: "₵3,200,000",
    category: "sale",
    type: "Villa",
    beds: 5, baths: 4, area: 480,
    location: "Takoradi Beach, Western",
    region: "Western",
    agent: { name: "Kojo Amponsah", company: "Western Gold Properties", phone: "+233245678901", color: "#F59E0B" },
    badges: ["premium"],
    furnishing: "Furnished",
    parking: "3 Covered",
    description: "A breathtaking beachfront villa on the pristine shores of Takoradi. Wake up to the sound of waves and stunning ocean sunsets. This 5-bedroom property features an infinity pool that merges with the horizon, outdoor entertainment areas, a fully fitted modern kitchen, and luxurious bedrooms each with en-suite bathrooms. A true tropical paradise.",
    amenities: ["Pool", "Garden", "Security", "Generator", "Borehole", "Parking", "Fitted Kitchen", "Water Tank"],
    photos: 28,
    ref: "GD-VL-005",
    added: "2026-02-05"
  },
  {
    id: 6,
    title: "2-Bedroom Apartment in Osu",
    image: "./assets/properties/property-interior-1.jpg",
    imageLg: "./assets/properties/large_property-interior-1.jpg",
    gallery: ["./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg","./assets/properties/large_property-kitchen-1.jpg"],
    price: 4500,
    priceFormatted: "₵4,500",
    priceLabel: "/month",
    category: "rent",
    type: "Apartment",
    beds: 2, baths: 2, area: 120,
    location: "Osu, Accra",
    region: "Greater Accra",
    agent: { name: "Efua Asiedu", company: "Asiedu Rentals", phone: "+233246789012", color: "#EC4899" },
    badges: ["verified"],
    furnishing: "Furnished",
    parking: "1 Covered",
    description: "A stylish fully-furnished 2-bedroom apartment in vibrant Osu, one of Accra's most exciting neighborhoods. The apartment features a contemporary open-plan design, high-quality furnishings, a modern kitchen with all appliances, and a private balcony. Walking distance to Oxford Street's shops, restaurants, and nightlife.",
    amenities: ["Security", "Generator", "CCTV", "Parking", "Fitted Kitchen"],
    photos: 14,
    ref: "GD-AP-006",
    added: "2026-02-20"
  },
  {
    id: 7,
    title: "Luxury Penthouse, Ridge",
    image: "./assets/properties/property-apartment-2.jpg",
    imageLg: "./assets/properties/large_property-apartment-2.jpg",
    gallery: ["./assets/properties/large_property-apartment-2.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-kitchen-1.jpg","./assets/properties/large_property-bedroom-1.jpg"],
    price: 8000,
    priceFormatted: "₵8,000",
    priceLabel: "/month",
    category: "rent",
    type: "Apartment",
    beds: 3, baths: 3, area: 250,
    location: "Ridge, Accra",
    region: "Greater Accra",
    agent: { name: "Yaw Darko", company: "Darko Luxury", phone: "+233247890123", color: "#6366F1" },
    badges: ["premium", "verified"],
    furnishing: "Furnished",
    parking: "2 Covered",
    description: "An extraordinary penthouse apartment in the exclusive Ridge area. Featuring panoramic 360-degree views of Accra's skyline, this triple-story penthouse offers 3 lavish bedrooms, a private rooftop terrace with jacuzzi, designer interiors throughout, and direct elevator access. The ultimate in urban luxury living.",
    amenities: ["Pool", "Security", "Generator", "CCTV", "Parking", "Gym", "Elevator", "Fitted Kitchen"],
    photos: 22,
    ref: "GD-AP-007",
    added: "2026-02-22"
  },
  {
    id: 8,
    title: "Master Bedroom Suite, Labone",
    image: "./assets/properties/property-bedroom-1.jpg",
    imageLg: "./assets/properties/large_property-bedroom-1.jpg",
    gallery: ["./assets/properties/large_property-bedroom-1.jpg","./assets/properties/large_property-interior-1.jpg"],
    price: 3500,
    priceFormatted: "₵3,500",
    priceLabel: "/month",
    category: "rent",
    type: "Apartment",
    beds: 1, baths: 1, area: 65,
    location: "Labone, Accra",
    region: "Greater Accra",
    agent: { name: "Akua Boateng", company: "Boateng & Co", phone: "+233248901234", color: "#14B8A6" },
    badges: ["verified"],
    furnishing: "Furnished",
    parking: "1 Open",
    description: "A beautifully appointed master bedroom suite in the heart of Labone. This self-contained unit features a spacious bedroom with premium king-size bed, a modern en-suite bathroom with walk-in shower, a compact kitchenette, and access to shared communal amenities. Ideal for young professionals.",
    amenities: ["Security", "Parking", "Fitted Kitchen"],
    photos: 10,
    ref: "GD-AP-008",
    added: "2026-02-24"
  },
  {
    id: 9,
    title: "Modern Kitchen Apartment, Dzorwulu",
    image: "./assets/properties/property-kitchen-1.jpg",
    imageLg: "./assets/properties/large_property-kitchen-1.jpg",
    gallery: ["./assets/properties/large_property-kitchen-1.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg"],
    price: 5200,
    priceFormatted: "₵5,200",
    priceLabel: "/month",
    category: "rent",
    type: "Apartment",
    beds: 2, baths: 2, area: 140,
    location: "Dzorwulu, Accra",
    region: "Greater Accra",
    agent: { name: "Kwame Asante", company: "Asante Premier", phone: "+233241234567", color: "#E63946" },
    badges: ["verified"],
    furnishing: "Semi-Furnished",
    parking: "1 Covered",
    description: "A modern 2-bedroom apartment in the desirable Dzorwulu neighborhood featuring a stunning designer kitchen with top-of-the-line appliances, quartz countertops, and custom cabinetry. The open-plan layout creates a perfect flow between the kitchen, living, and dining areas. Both bedrooms are ensuite with contemporary fixtures.",
    amenities: ["Security", "Generator", "CCTV", "Parking", "Fitted Kitchen", "Water Tank"],
    photos: 16,
    ref: "GD-AP-009",
    added: "2026-02-12"
  },
  {
    id: 10,
    title: "Premium Office Space, Airport City",
    image: "./assets/properties/property-commercial-1.jpg",
    imageLg: "./assets/properties/large_property-commercial-1.jpg",
    gallery: ["./assets/properties/large_property-commercial-1.jpg"],
    price: 15000,
    priceFormatted: "₵15,000",
    priceLabel: "/month",
    category: "rent",
    type: "Commercial",
    beds: 0, baths: 0, area: 500,
    location: "Airport City, Accra",
    region: "Greater Accra",
    agent: { name: "Ama Mensah", company: "Mensah Realty", phone: "+233242345678", color: "#3B82F6" },
    badges: ["premium"],
    furnishing: "Unfurnished",
    parking: "10 Covered",
    description: "A premium grade-A office space in Airport City, Accra's premier business district. This 500 sqm open-plan office features floor-to-ceiling glass walls with panoramic views, central air conditioning, raised flooring for cabling, high-speed elevator access, and dedicated parking for 10 vehicles. Ideal for corporate headquarters or multinational branch offices.",
    amenities: ["Security", "Generator", "CCTV", "Parking", "Elevator"],
    photos: 12,
    ref: "GD-CM-010",
    added: "2026-02-08"
  },
  {
    id: 11,
    title: "Residential Plot in East Legon Hills",
    image: "./assets/properties/property-land-1.jpg",
    imageLg: "./assets/properties/large_property-land-1.jpg",
    gallery: ["./assets/properties/large_property-land-1.jpg"],
    price: 350000,
    priceFormatted: "₵350,000",
    category: "sale",
    type: "Land",
    beds: 0, baths: 0, area: 1200,
    location: "East Legon Hills, Accra",
    region: "Greater Accra",
    agent: { name: "Kofi Adjei", company: "Adjei Real Estate", phone: "+233243456789", color: "#10B981" },
    badges: [],
    furnishing: "N/A",
    parking: "N/A",
    description: "A prime residential plot in the fast-developing East Legon Hills community. This 1,200 sqm plot is serviced with roads, water, and electricity connections. Located within a gated community with 24-hour security. Perfect for building your dream home in one of Accra's most desirable emerging neighborhoods. Title documentation is clean and ready for transfer.",
    amenities: ["Security"],
    photos: 6,
    ref: "GD-LD-011",
    added: "2026-02-01"
  },
  {
    id: 12,
    title: "Furnished 2-Bed Apartment, Kumasi",
    image: "./assets/properties/property-apartment-1.jpg",
    imageLg: "./assets/properties/large_property-apartment-1.jpg",
    gallery: ["./assets/properties/large_property-apartment-1.jpg","./assets/properties/large_property-interior-1.jpg","./assets/properties/large_property-bedroom-1.jpg"],
    price: 2500,
    priceFormatted: "₵2,500",
    priceLabel: "/month",
    category: "rent",
    type: "Apartment",
    beds: 2, baths: 1, area: 95,
    location: "Nhyiaeso, Kumasi",
    region: "Ashanti",
    agent: { name: "Yaw Darko", company: "Darko Properties", phone: "+233247890123", color: "#6366F1" },
    badges: [],
    furnishing: "Furnished",
    parking: "1 Open",
    description: "A well-furnished 2-bedroom apartment in the vibrant Nhyiaeso area of Kumasi. Close to Kumasi City Mall and major amenities, this apartment offers comfortable living with modern furnishings, a fully equipped kitchen, and a pleasant neighborhood. Perfect for professionals working in the Ashanti region.",
    amenities: ["Security", "Parking", "Fitted Kitchen"],
    photos: 11,
    ref: "GD-AP-012",
    added: "2026-02-25"
  }
];

// ============ AGENTS DATA ============
const agents = [
  { id: 1, name: "Kwame Asante", company: "Asante Premier Properties", rating: 4.9, areas: ["East Legon", "Cantonments", "Airport"], listings: 45, years: 12, color: "#E63946", phone: "+233241234567" },
  { id: 2, name: "Ama Mensah", company: "Mensah Realty", rating: 4.8, areas: ["Airport Residential", "Ridge", "Osu"], listings: 38, years: 8, color: "#3B82F6", phone: "+233242345678" },
  { id: 3, name: "Kofi Adjei", company: "Adjei Real Estate", rating: 4.7, areas: ["Cantonments", "East Legon Hills"], listings: 32, years: 10, color: "#10B981", phone: "+233243456789" },
  { id: 4, name: "Abena Osei", company: "Prestige Ghana", rating: 4.9, areas: ["Trasacco", "East Legon"], listings: 28, years: 15, color: "#8B5CF6", phone: "+233244567890" },
  { id: 5, name: "Kojo Amponsah", company: "Western Gold Properties", rating: 4.6, areas: ["Takoradi", "Sekondi"], listings: 21, years: 7, color: "#F59E0B", phone: "+233245678901" },
  { id: 6, name: "Efua Asiedu", company: "Asiedu Rentals", rating: 4.8, areas: ["Osu", "Labone", "Dzorwulu"], listings: 56, years: 9, color: "#EC4899", phone: "+233246789012" },
  { id: 7, name: "Yaw Darko", company: "Darko Luxury Properties", rating: 4.7, areas: ["Ridge", "Airport City", "Kumasi"], listings: 34, years: 11, color: "#6366F1", phone: "+233247890123" },
  { id: 8, name: "Akua Boateng", company: "Boateng & Co Real Estate", rating: 4.5, areas: ["Labone", "Osu", "Tesano"], listings: 29, years: 6, color: "#14B8A6", phone: "+233248901234" }
];

// ============ LOCATIONS DATA ============
const locations = [
  { name: "Greater Accra", count: 4250, image: "./assets/properties/property-villa-1.jpg" },
  { name: "Ashanti", count: 1820, image: "./assets/properties/property-apartment-1.jpg" },
  { name: "Western", count: 960, image: "./assets/properties/property-villa-2.jpg" },
  { name: "Eastern", count: 740, image: "./assets/properties/property-townhouse-1.jpg" },
  { name: "Central", count: 580, image: "./assets/properties/property-house-2.jpg" },
  { name: "Volta", count: 420, image: "./assets/properties/property-interior-1.jpg" },
  { name: "Northern", count: 350, image: "./assets/properties/property-land-1.jpg" },
  { name: "Brong-Ahafo", count: 280, image: "./assets/properties/property-commercial-1.jpg" }
];

// ============ DEVELOPMENTS DATA ============
const developments = [
  { name: "Trassacco Valley", location: "East Legon, Accra", price: "From ₵2.5M", image: "./assets/properties/property-villa-1.jpg", label: "NEW PHASE" },
  { name: "Villagio Vista", location: "Airport Hills, Accra", price: "From ₵850K", image: "./assets/properties/property-apartment-2.jpg", label: "SELLING FAST" },
  { name: "Devtraco Courts", location: "Community 25, Tema", price: "From ₵650K", image: "./assets/properties/property-townhouse-1.jpg", label: "READY TO MOVE" },
  { name: "Regimanuel Estates", location: "Spintex Road, Accra", price: "From ₵450K", image: "./assets/properties/property-house-2.jpg", label: "PRE-LAUNCH" }
];

// ============ PROPERTY TYPE DATA ============
const propertyTypes = [
  { name: "Apartments", count: 3240, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V6M15 22V6M4 6h16M4 10h5M15 10h5M4 14h5M15 14h5M4 18h5M15 18h5"/></svg>' },
  { name: "Houses", count: 2180, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { name: "Villas", count: 890, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/><path d="M2 9h20"/></svg>' },
  { name: "Townhouses", count: 640, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 22V8l5-5 5 5v14"/><path d="M13 22V8l5-5 5 5v14"/><path d="M6 12h1M6 16h1M18 12h1M18 16h1"/></svg>' },
  { name: "Commercial", count: 520, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>' },
  { name: "Land", count: 1450, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 22L12 2l10 20H2z"/><path d="M12 18v-8"/><path d="M8 18l4-4 4 4"/></svg>' },
  { name: "Warehouses", count: 180, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12H2l10-8 10 8z"/><rect x="4" y="12" width="16" height="10"/><path d="M9 22v-6h6v6"/></svg>' },
  { name: "Office Spaces", count: 310, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>' }
];

// ============ SVG ICONS ============
const icons = {
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 012 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>',
  bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><path d="M6 20v2M18 20v2"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  heartFilled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  images: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  renderHomePage();
  initScrollEffects();
  initHeaderScroll();
  initPillGroups();
  initFilterToggles();
});

// ============ ROUTER ============
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  const parts = hash.split('/');
  const page = parts[0].replace('#', '');
  const param = parts[1];

  // Hide header/footer for admin
  const header = document.getElementById('siteHeader');
  const footer = document.getElementById('siteFooter');
  const backToTop = document.getElementById('backToTop');

  if (page === 'admin') {
    header.style.display = 'none';
    footer.style.display = 'none';
    backToTop.style.display = 'none';
  } else {
    header.style.display = '';
    footer.style.display = '';
    backToTop.style.display = '';
  }

  // Hide all pages
  document.querySelectorAll('.page, .admin-page').forEach(p => p.classList.remove('active'));

  switch (page) {
    case 'home':
    case '':
      document.getElementById('page-home').classList.add('active');
      break;
    case 'listings':
      document.getElementById('page-listings').classList.add('active');
      renderListings();
      break;
    case 'property':
      document.getElementById('page-property').classList.add('active');
      renderPropertyDetail(parseInt(param));
      break;
    case 'agents':
      document.getElementById('page-agents').classList.add('active');
      renderAgents();
      break;
    case 'admin':
      document.getElementById('page-admin').classList.add('active');
      if (!adminAuthenticated) {
        document.getElementById('adminPasswordOverlay').style.display = 'flex';
      } else {
        document.getElementById('adminPasswordOverlay').style.display = 'none';
        initAdminCharts();
      }
      break;
    default:
      document.getElementById('page-home').classList.add('active');
  }

  window.scrollTo({ top: 0 });
  updateActiveNav(page);
  initRevealObserver();
}

function navigateTo(page, param) {
  if (param) {
    window.location.hash = `#${page}/${param}`;
  } else {
    window.location.hash = `#${page}`;
  }
}

function updateActiveNav(page) {
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
  if (page === 'listings') {
    document.querySelector('.main-nav a[href="#listings"]')?.classList.add('active');
  } else if (page === 'agents') {
    document.querySelector('.main-nav a[href="#agents"]')?.classList.add('active');
  }
}

// ============ THEME ============
document.getElementById('themeToggle').addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
});

// ============ HEADER SCROLL ============
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    // Back to top
    const btn = document.getElementById('backToTop');
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
}

// ============ MOBILE NAV ============
function toggleMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileNavOverlay');
  hamburger.classList.toggle('open');
  nav.classList.toggle('open');
  overlay.classList.toggle('open');
}

// ============ MODALS ============
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });
});

// ============ AUTH ============
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  currentUser = { name, email, type: 'buyer' };
  closeModal('loginModal');
  updateAuthUI();
  showToast(`Welcome back, ${currentUser.name}!`, 'success');
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const pass = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;

  if (pass !== confirm) {
    showToast('Passwords do not match', 'error');
    return;
  }

  currentUser = { name, email, type: accountType };
  closeModal('signupModal');
  updateAuthUI();
  showToast(`Welcome to GhanaDeals, ${name}!`, 'success');
}

function setAccountType(btn, type) {
  accountType = type;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function logoutUser() {
  currentUser = null;
  savedProperties.clear();
  updateAuthUI();
  closeUserDropdown();
  showToast('You have been logged out', 'info');
  // Re-render if on listings
  if (window.location.hash.startsWith('#listings')) renderListings();
}

function updateAuthUI() {
  const authBtns = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  if (currentUser) {
    authBtns.style.display = 'none';
    userMenu.style.display = 'block';
    document.getElementById('userAvatarBtn').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('dropdownName').textContent = currentUser.name;
    document.getElementById('dropdownEmail').textContent = currentUser.email;
  } else {
    authBtns.style.display = '';
    userMenu.style.display = 'none';
  }
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('open');
}

function closeUserDropdown() {
  document.getElementById('userDropdown').classList.remove('open');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#userMenu')) closeUserDropdown();
});

// ============ TOAST ============
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '';
  if (type === 'success') icon = icons.check;
  else if (type === 'error') icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
  else icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============ SCROLL REVEAL ============
function initScrollEffects() {
  initRevealObserver();
}

function initRevealObserver() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });
  els.forEach(el => obs.observe(el));
}

// ============ PILL GROUPS ============
function initPillGroups() {
  document.querySelectorAll('.pill-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
}

function initFilterToggles() {
  document.querySelectorAll('.filter-toggle-btns').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-toggle-btn');
      if (!btn) return;
      group.querySelectorAll('.filter-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ============ TOGGLE SAVE ============
function toggleSave(id, e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  if (!currentUser) {
    openModal('loginModal');
    return;
  }
  if (savedProperties.has(id)) {
    savedProperties.delete(id);
    showToast('Property removed from saved', 'info');
  } else {
    savedProperties.add(id);
    showToast('Property saved!', 'success');
  }
  // Update hearts
  document.querySelectorAll(`.card-heart[data-id="${id}"]`).forEach(btn => {
    if (savedProperties.has(id)) {
      btn.classList.add('saved');
      btn.innerHTML = icons.heartFilled;
    } else {
      btn.classList.remove('saved');
      btn.innerHTML = icons.heart;
    }
  });
}

// ============ RENDER: HOME PAGE ============
function renderHomePage() {
  renderFeaturedProperties();
  renderLocations();
  renderPropertyTypes();
  renderDevelopments();
  renderWhySection();

  // Search tabs
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

function renderFeaturedProperties() {
  const grid = document.getElementById('featuredGrid');
  const featured = properties.slice(0, 8);
  grid.innerHTML = featured.map(p => createVerticalCard(p)).join('');
}

function createVerticalCard(p) {
  const isSaved = savedProperties.has(p.id);
  const badges = p.badges.map(b => {
    if (b === 'verified') return '<span class="badge badge-verified">Verified</span>';
    if (b === 'premium') return '<span class="badge badge-premium">Premium</span>';
    return '';
  }).join('');

  return `
    <div class="property-card-v" onclick="navigateTo('property','${p.id}')">
      <div class="card-img">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <div class="card-badges">${badges}</div>
        <button class="card-heart ${isSaved ? 'saved' : ''}" data-id="${p.id}" onclick="toggleSave(${p.id},event)">
          ${isSaved ? icons.heartFilled : icons.heart}
        </button>
        <div class="card-photo-count">${icons.camera} ${p.photos}</div>
      </div>
      <div class="card-body">
        <div class="card-type">${p.type} for ${p.category === 'rent' ? 'Rent' : 'Sale'}</div>
        <div class="card-price">${p.priceFormatted}${p.priceLabel ? `<span class="price-period">${p.priceLabel}</span>` : ''}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-location">${icons.location} ${p.location}</div>
        <div class="card-specs">
          ${p.beds > 0 ? `<div class="spec">${icons.bed} ${p.beds} Beds</div>` : ''}
          ${p.baths > 0 ? `<div class="spec">${icons.bath} ${p.baths} Baths</div>` : ''}
          <div class="spec">${icons.area} ${p.area} sqm</div>
        </div>
      </div>
    </div>
  `;
}

function renderLocations() {
  const grid = document.getElementById('locationsGrid');
  grid.innerHTML = locations.map(loc => `
    <div class="location-card" onclick="navigateTo('listings')">
      <img class="loc-bg" src="${loc.image}" alt="${loc.name}" loading="lazy">
      <div class="loc-overlay"></div>
      <div class="loc-info">
        <div class="loc-name">${loc.name}</div>
        <div class="loc-count">${loc.count.toLocaleString()} properties</div>
      </div>
    </div>
  `).join('');
}

function renderPropertyTypes() {
  const grid = document.getElementById('ptypesGrid');
  grid.innerHTML = propertyTypes.map(pt => `
    <div class="ptype-card" onclick="navigateTo('listings')">
      <div class="ptype-icon">${pt.icon}</div>
      <div class="ptype-name">${pt.name}</div>
      <div class="ptype-count">${pt.count.toLocaleString()} listings</div>
    </div>
  `).join('');
}

function renderDevelopments() {
  const grid = document.getElementById('devGrid');
  grid.innerHTML = developments.map(d => `
    <div class="dev-card" onclick="navigateTo('listings')">
      <div class="dev-img"><img src="${d.image}" alt="${d.name}" loading="lazy"></div>
      <div class="dev-body">
        <span class="dev-label">${d.label}</span>
        <div class="dev-name">${d.name}</div>
        <div class="dev-location">${icons.location} ${d.location}</div>
        <div class="dev-price">${d.price}</div>
      </div>
    </div>
  `).join('');
}

function renderWhySection() {
  const grid = document.getElementById('whyGrid');
  const reasons = [
    { title: "Verified Listings", desc: "Every property is verified by our team to ensure accuracy and legitimacy. Browse with confidence.", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
    { title: "Trusted Agents", desc: "Connect with 850+ vetted real estate professionals across all 16 regions of Ghana.", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
    { title: "Nationwide Coverage", desc: "From Accra to Tamale, find properties in every corner of Ghana. The largest property database in the country.", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>' }
  ];
  grid.innerHTML = reasons.map(r => `
    <div class="why-card">
      <div class="why-icon">${r.icon}</div>
      <h3>${r.title}</h3>
      <p>${r.desc}</p>
    </div>
  `).join('');
}

// ============ RENDER: LISTINGS PAGE ============
function renderListings() {
  renderCategoryChips();
  renderListingsResults();
}

function renderCategoryChips() {
  const chips = document.getElementById('categoryChips');
  const types = ['All', 'Apartments', 'Houses', 'Villas', 'Townhouses', 'Commercial', 'Land'];
  const counts = {
    'All': properties.length,
    'Apartments': properties.filter(p => p.type === 'Apartment').length,
    'Houses': properties.filter(p => p.type === 'House').length,
    'Villas': properties.filter(p => p.type === 'Villa').length,
    'Townhouses': properties.filter(p => p.type === 'Townhouse').length,
    'Commercial': properties.filter(p => p.type === 'Commercial').length,
    'Land': properties.filter(p => p.type === 'Land').length
  };
  chips.innerHTML = types.map((t, i) => `
    <button class="category-chip ${i === 0 ? 'active' : ''}" onclick="filterByChip(this,'${t}')">${t} <span style="color:var(--text-tertiary)">(${counts[t]})</span></button>
  `).join('');
}

function filterByChip(btn, type) {
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderListingsResults(type === 'All' ? null : type.slice(0, -1)); // Remove trailing 's'
}

function getFilteredProperties(typeFilter) {
  let filtered = [...properties];

  const catFilter = document.getElementById('listingsCategoryFilter')?.value;
  if (catFilter && catFilter !== 'all') {
    filtered = filtered.filter(p => p.category === catFilter);
  }

  const topTypeFilter = document.getElementById('listingsTypeFilter')?.value;
  if (topTypeFilter && topTypeFilter !== 'all') {
    filtered = filtered.filter(p => p.type === topTypeFilter);
  }

  if (typeFilter) {
    // Map singular chips: "Apartment" -> "Apartment", "Townhouse" -> "Townhouse"
    filtered = filtered.filter(p => p.type === typeFilter);
  }

  return filtered;
}

function renderListingsResults(typeFilter) {
  const filtered = getFilteredProperties(typeFilter);
  const container = document.getElementById('listingsResults');
  const title = document.getElementById('resultsTitle');

  const catText = document.getElementById('listingsCategoryFilter')?.value;
  const catLabel = catText === 'rent' ? 'rent' : catText === 'sale' ? 'sale' : 'sale & rent';
  title.textContent = `${filtered.length} properties for ${catLabel} in Greater Accra`;

  if (currentView === 'grid') {
    container.className = 'listings-results grid-view';
  } else {
    container.className = 'listings-results';
  }

  container.innerHTML = filtered.map(p => createHorizontalCard(p)).join('');
  renderPagination(filtered.length);
}

function createHorizontalCard(p) {
  const isSaved = savedProperties.has(p.id);
  const badges = p.badges.map(b => {
    if (b === 'verified') return '<span class="badge badge-verified">Verified</span>';
    if (b === 'premium') return '<span class="badge badge-premium">Premium</span>';
    return '';
  }).join('');
  const initials = p.agent.name.split(' ').map(n => n[0]).join('');

  return `
    <div class="property-card-h" onclick="navigateTo('property','${p.id}')">
      <div class="card-img-h">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <div class="card-badges">${badges}</div>
        <button class="card-heart ${isSaved ? 'saved' : ''}" data-id="${p.id}" onclick="toggleSave(${p.id},event)">
          ${isSaved ? icons.heartFilled : icons.heart}
        </button>
        <div class="card-photo-count">${icons.camera} ${p.photos}</div>
        <div class="card-img-dots">
          <span class="active"></span><span></span><span></span><span></span>
        </div>
      </div>
      <div class="card-body-h">
        <div class="card-type">${p.type} for ${p.category === 'rent' ? 'Rent' : 'Sale'}</div>
        <div class="card-price">${p.priceFormatted}${p.priceLabel ? `<span class="price-period">${p.priceLabel}</span>` : ''}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-location">${icons.location} ${p.location}</div>
        <div class="card-specs">
          ${p.beds > 0 ? `<div class="spec">${icons.bed} ${p.beds} Beds</div>` : ''}
          ${p.baths > 0 ? `<div class="spec">${icons.bath} ${p.baths} Baths</div>` : ''}
          <div class="spec">${icons.area} ${p.area} sqm</div>
        </div>
        <hr class="card-divider">
        <div class="card-agent-row">
          <div class="agent-info">
            <div class="agent-avatar" style="background:${p.agent.color}15;color:${p.agent.color}">${initials}</div>
            <div>
              <div class="agent-name">${p.agent.name}</div>
              <div class="agent-company">${p.agent.company}</div>
            </div>
          </div>
          <div class="card-action-btns">
            <button class="btn-sm" onclick="event.stopPropagation();showToast('Call ${p.agent.name}','info')">
              ${icons.phone} Call
            </button>
            <button class="btn-sm" onclick="event.stopPropagation();showToast('Email sent to ${p.agent.name}','success')">
              ${icons.email} Email
            </button>
            <a class="btn-sm btn-wa" href="https://wa.me/${p.agent.phone.replace('+','')}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
              ${icons.whatsapp} WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPagination(total) {
  const container = document.getElementById('listingsPagination');
  const pages = Math.ceil(total / 12) || 1;
  let html = `<button disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === 1 ? 'active' : ''}" onclick="showToast('Page ${i}','info')">${i}</button>`;
  }
  html += `<button ${pages <= 1 ? 'disabled' : ''} onclick="showToast('Next page','info')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>`;
  container.innerHTML = html;
}

function setListView(view) {
  currentView = view;
  document.getElementById('viewList').classList.toggle('active', view === 'list');
  document.getElementById('viewGrid').classList.toggle('active', view === 'grid');
  renderListingsResults();
}

function applyListingsFilters() {
  renderListingsResults();
  showToast('Filters applied', 'success');
}

function clearFilters() {
  document.getElementById('listingsCategoryFilter').value = 'all';
  document.getElementById('listingsTypeFilter').value = 'all';
  document.getElementById('filterPriceMin').value = '';
  document.getElementById('filterPriceMax').value = '';
  document.querySelectorAll('.pill-group .pill').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
  renderListingsResults();
  showToast('Filters cleared', 'info');
}

function sortListings() {
  renderListingsResults();
}

// ============ RENDER: PROPERTY DETAIL ============
function renderPropertyDetail(id) {
  const p = properties.find(prop => prop.id === id);
  if (!p) {
    document.getElementById('propertyDetailContent').innerHTML = '<div style="text-align:center;padding:80px 0;"><h2>Property not found</h2><p>The property you are looking for does not exist.</p></div>';
    return;
  }

  const initials = p.agent.name.split(' ').map(n => n[0]).join('');

  const galleryImages = p.gallery || [p.imageLg];
  const secondImage = galleryImages[1] || galleryImages[0];
  const thirdImage = galleryImages[2] || galleryImages[0];

  const monthlyPayment = calculateMortgage(p.price, 20, 22, 20);

  document.getElementById('propertyDetailContent').innerHTML = `
    <!-- Gallery -->
    <div class="gallery-grid" style="margin-top:20px;">
      <div class="gallery-main">
        <img src="${galleryImages[0]}" alt="${p.title}">
        <div class="card-photo-count" style="position:absolute;bottom:12px;left:12px;">${icons.camera} ${p.photos} Photos</div>
      </div>
      <div class="gallery-side">
        <div class="gallery-side-img">
          <img src="${secondImage}" alt="Interior">
        </div>
        <div class="gallery-side-img">
          <img src="${thirdImage}" alt="View">
          <div class="gallery-view-all" onclick="showToast('Gallery view coming soon','info')">
            ${icons.images} View all ${p.photos} photos
          </div>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <a href="#home">Ghana</a> <span>›</span>
      <a href="#listings">${p.region}</a> <span>›</span>
      <a href="#listings">${p.location.split(',')[0]}</a> <span>›</span>
      <span>${p.type} for ${p.category === 'rent' ? 'Rent' : 'Sale'}</span>
    </div>

    <!-- Detail layout -->
    <div class="detail-layout">
      <!-- Main -->
      <div class="detail-main">
        <div class="detail-price-section">
          <div class="detail-price">${p.priceFormatted}${p.priceLabel || ''}</div>
          <div class="detail-key-features">
            <div class="kf">${icons.bed}<div><div class="kf-label">Bedrooms</div><div class="kf-value">${p.beds || 'N/A'}</div></div></div>
            <div class="kf">${icons.bath}<div><div class="kf-label">Bathrooms</div><div class="kf-value">${p.baths || 'N/A'}</div></div></div>
            <div class="kf">${icons.area}<div><div class="kf-label">Area</div><div class="kf-value">${p.area} sqm</div></div></div>
            <div class="kf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg><div><div class="kf-label">Type</div><div class="kf-value">${p.type}</div></div></div>
            <div class="kf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg><div><div class="kf-label">Furnishing</div><div class="kf-value">${p.furnishing}</div></div></div>
            <div class="kf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 5 20 16 16 13 16 8"/></svg><div><div class="kf-label">Parking</div><div class="kf-value">${p.parking}</div></div></div>
          </div>
          <h1 class="detail-title">${p.title}</h1>
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:14px;">${icons.location} ${p.location}</div>
        </div>

        <!-- Description -->
        <div class="detail-section">
          <h3 class="detail-section-title">Description</h3>
          <div class="detail-description" id="detailDescription">${p.description}</div>
        </div>

        <!-- Property Details -->
        <div class="detail-section">
          <h3 class="detail-section-title">Property Details</h3>
          <div class="details-table">
            <div class="dt-row"><span class="dt-label">Property Type</span><span class="dt-value">${p.type}</span></div>
            <div class="dt-row"><span class="dt-label">Purpose</span><span class="dt-value">For ${p.category === 'rent' ? 'Rent' : 'Sale'}</span></div>
            <div class="dt-row"><span class="dt-label">Reference</span><span class="dt-value">${p.ref}</span></div>
            <div class="dt-row"><span class="dt-label">Added</span><span class="dt-value">${formatDate(p.added)}</span></div>
            <div class="dt-row"><span class="dt-label">Furnishing</span><span class="dt-value">${p.furnishing}</span></div>
            <div class="dt-row"><span class="dt-label">Parking</span><span class="dt-value">${p.parking}</span></div>
            <div class="dt-row"><span class="dt-label">Bedrooms</span><span class="dt-value">${p.beds || 'N/A'}</span></div>
            <div class="dt-row"><span class="dt-label">Bathrooms</span><span class="dt-value">${p.baths || 'N/A'}</span></div>
            <div class="dt-row"><span class="dt-label">Area</span><span class="dt-value">${p.area} sqm</span></div>
            <div class="dt-row"><span class="dt-label">Region</span><span class="dt-value">${p.region}</span></div>
          </div>
        </div>

        <!-- Amenities -->
        <div class="detail-section">
          <h3 class="detail-section-title">Amenities & Features</h3>
          <div class="amenities-grid">
            ${p.amenities.map(a => `<div class="amenity-item">${icons.check} ${a}</div>`).join('')}
          </div>
        </div>

        <!-- Location -->
        <div class="detail-section">
          <h3 class="detail-section-title">Location & Nearby</h3>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px;">
            Located in ${p.location}, this property enjoys proximity to major amenities including shopping centers, international schools, hospitals, and recreational facilities. The area is well-connected with good road networks and is one of ${p.region}'s most sought-after neighborhoods.
          </p>
          <div style="background:var(--bg-secondary);border-radius:var(--radius-lg);padding:24px;display:flex;align-items:center;gap:14px;border:1px solid var(--border-primary);">
            <div style="width:44px;height:44px;border-radius:var(--radius-md);background:var(--red-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--red);">
              ${icons.location}
            </div>
            <div>
              <div style="font-weight:600;font-size:15px;color:var(--text-primary);">${p.location}</div>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">${p.region}, Ghana</div>
            </div>
          </div>
        </div>

        <!-- Regulatory -->
        <div class="detail-section" style="border-bottom:none;">
          <p style="font-size:12px;color:var(--text-tertiary);line-height:1.6;">
            <strong>Regulatory Information:</strong> Property listings on GhanaDeals are provided for informational purposes. Buyers are advised to conduct independent due diligence and verify all information with the listing agent. GhanaDeals does not guarantee the accuracy of listing details. Reference: ${p.ref}.
          </p>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="detail-sidebar">
        <div class="detail-sidebar-inner">
          <!-- Agent card -->
          <div class="agent-card-detail">
            <div class="agent-card-header">
              <div class="agent-avatar-lg" style="background:${p.agent.color}">${initials}</div>
              <div class="agent-details">
                <div class="agent-name-lg">${p.agent.name}</div>
                <div class="agent-company-lg">${p.agent.company}</div>
                ${p.badges.includes('premium') ? '<span class="super-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> SuperAgent</span>' : ''}
              </div>
            </div>
            <div class="agent-languages" style="margin-bottom:16px;">Languages: English, Twi, Ga</div>
            <div class="agent-btn-group">
              <button class="btn btn-outline" onclick="showToast('Calling ${p.agent.name}...','info')">
                ${icons.phone} Call Agent
              </button>
              <button class="btn btn-outline" onclick="showToast('Email sent to ${p.agent.name}','success')">
                ${icons.email} Email Agent
              </button>
              <a class="btn btn-whatsapp" href="https://wa.me/${p.agent.phone.replace('+','')}" target="_blank" rel="noopener noreferrer">
                ${icons.whatsapp} WhatsApp
              </a>
              <button style="color:var(--red);font-weight:600;font-size:14px;margin-top:4px;cursor:pointer;background:none;border:none;" onclick="showToast('Viewing request sent!','success')">Schedule a Viewing</button>
            </div>
          </div>

          <!-- Mortgage calc -->
          ${p.category === 'sale' ? `
          <div class="mortgage-card">
            <h3>Mortgage Calculator</h3>
            <div class="form-group">
              <label>Property Price (₵)</label>
              <input type="number" class="form-input" value="${p.price}" id="mortgagePrice" oninput="updateMortgage()">
            </div>
            <div class="form-group">
              <label>Down Payment (%)</label>
              <input type="range" min="5" max="50" value="20" id="mortgageDown" oninput="updateMortgage();document.getElementById('downLabel').textContent=this.value+'%'" style="width:100%">
              <span id="downLabel" style="font-size:13px;color:var(--text-secondary)">20%</span>
            </div>
            <div class="form-group">
              <label>Interest Rate (%)</label>
              <input type="number" class="form-input" value="22" step="0.5" id="mortgageRate" oninput="updateMortgage()">
            </div>
            <div class="form-group">
              <label>Loan Tenure (years)</label>
              <input type="number" class="form-input" value="20" id="mortgageTenure" oninput="updateMortgage()">
            </div>
            <div class="mortgage-result">
              <div class="monthly-label">Estimated Monthly Payment</div>
              <div class="monthly-amount" id="mortgageResult">₵${monthlyPayment.toLocaleString()}</div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Similar Properties -->
    <div style="margin-top:48px;">
      <h2 class="section-title" style="margin-bottom:20px;">Similar Properties</h2>
      <div class="similar-scroll">
        ${properties.filter(sp => sp.id !== p.id && sp.category === p.category).slice(0, 4).map(sp => createVerticalCard(sp)).join('')}
      </div>
    </div>
  `;
}

function calculateMortgage(price, downPercent, rate, years) {
  const principal = price * (1 - downPercent / 100);
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  if (monthlyRate === 0) return Math.round(principal / n);
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  return Math.round(payment);
}

function updateMortgage() {
  const price = parseFloat(document.getElementById('mortgagePrice')?.value) || 0;
  const down = parseFloat(document.getElementById('mortgageDown')?.value) || 20;
  const rate = parseFloat(document.getElementById('mortgageRate')?.value) || 22;
  const tenure = parseFloat(document.getElementById('mortgageTenure')?.value) || 20;
  const payment = calculateMortgage(price, down, rate, tenure);
  const el = document.getElementById('mortgageResult');
  if (el) el.textContent = `₵${payment.toLocaleString()}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ============ RENDER: AGENTS PAGE ============
function renderAgents(filtered) {
  const grid = document.getElementById('agentsGrid');
  const list = filtered || agents;
  grid.innerHTML = list.map(a => {
    const initials = a.name.split(' ').map(n => n[0]).join('');
    return `
      <div class="agent-card-grid">
        <div class="agent-avatar-grid" style="background:${a.color}">${initials}</div>
        <div class="agent-name-grid">${a.name}</div>
        <div class="agent-company-grid">${a.company}</div>
        <div class="agent-rating">
          ${icons.star} ${a.rating}
        </div>
        <div class="agent-areas">
          ${a.areas.map(ar => `<span class="area-tag">${ar}</span>`).join('')}
        </div>
        <div class="agent-stats">
          <div class="stat-item"><div class="stat-val">${a.listings}</div><div class="stat-label">Listings</div></div>
          <div class="stat-item"><div class="stat-val">${a.years}</div><div class="stat-label">Years Exp.</div></div>
          <div class="stat-item"><div class="stat-val">${a.rating}</div><div class="stat-label">Rating</div></div>
        </div>
        <div class="agent-btns">
          <button class="btn btn-outline btn-sm" onclick="showToast('Calling ${a.name}...','info')">${icons.phone} Call</button>
          <a class="btn btn-whatsapp btn-sm" href="https://wa.me/${a.phone.replace('+','')}" target="_blank" rel="noopener noreferrer">${icons.whatsapp} WhatsApp</a>
          <button class="btn btn-outline btn-sm" onclick="showToast('Email sent to ${a.name}','success')">${icons.email} Email</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterAgents() {
  const search = document.getElementById('agentSearchInput').value.toLowerCase();
  const area = document.getElementById('agentAreaFilter').value;
  let filtered = agents;
  if (search) {
    filtered = filtered.filter(a => a.name.toLowerCase().includes(search) || a.company.toLowerCase().includes(search));
  }
  if (area) {
    filtered = filtered.filter(a => a.areas.some(ar => ar.toLowerCase().includes(area.toLowerCase())));
  }
  renderAgents(filtered);
}

// ============ ADMIN ============
function checkAdminPassword() {
  const input = document.getElementById('adminPasswordInput');
  if (input.value === 'admin123') {
    adminAuthenticated = true;
    document.getElementById('adminPasswordOverlay').style.display = 'none';
    document.getElementById('adminError').style.display = 'none';
    initAdminCharts();
    renderAdminTables();
  } else {
    document.getElementById('adminError').style.display = 'block';
    input.value = '';
    input.focus();
  }
}

function showAdminSection(section, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${section}`).classList.add('active');
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentAdminSection = section;

  if (section === 'admin-analytics') {
    initAnalyticsCharts();
  }
}

function initAdminCharts() {
  if (adminChartsInitialized) return;
  adminChartsInitialized = true;

  // Line chart
  const lineCtx = document.getElementById('adminLineChart');
  if (lineCtx) {
    new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
        datasets: [{
          label: 'New Listings',
          data: [180, 220, 195, 240, 280, 310],
          borderColor: '#E63946',
          backgroundColor: 'rgba(230,57,70,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#E63946'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280' } }
        }
      }
    });
  }

  // Pie chart
  const pieCtx = document.getElementById('adminPieChart');
  if (pieCtx) {
    new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['Apartments', 'Houses', 'Villas', 'Commercial', 'Land', 'Other'],
        datasets: [{
          data: [35, 25, 15, 10, 10, 5],
          backgroundColor: ['#E63946', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9CA3AF', padding: 12, usePointStyle: true, pointStyleWidth: 10 }
          }
        }
      }
    });
  }

  renderAdminTables();
  initAnalyticsCharts();
}

function initAnalyticsCharts() {
  // Bar chart
  const barCtx = document.getElementById('adminBarChart');
  if (barCtx && !barCtx._chartInitialized) {
    barCtx._chartInitialized = true;
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Direct', 'Google', 'Social', 'Referral', 'Email', 'Other'],
        datasets: [{
          label: 'Visitors',
          data: [4200, 3800, 2100, 1600, 900, 400],
          backgroundColor: ['#E63946', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7280' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280' } }
        }
      }
    });
  }

  // Registration line
  const regCtx = document.getElementById('adminRegChart');
  if (regCtx && !regCtx._chartInitialized) {
    regCtx._chartInitialized = true;
    new Chart(regCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'New Users',
          data: [320, 450, 380, 520],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10B981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280' } }
        }
      }
    });
  }
}

function renderAdminTables() {
  // Recent listings
  const recentBody = document.getElementById('adminRecentTableBody');
  if (recentBody) {
    recentBody.innerHTML = properties.slice(0, 6).map(p => `
      <tr>
        <td><img class="table-img" src="${p.image}" alt=""></td>
        <td>${p.title}</td>
        <td>${p.priceFormatted}${p.priceLabel || ''}</td>
        <td>${p.type}</td>
        <td><span class="status-badge active">Active</span></td>
        <td>${formatDate(p.added)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="showToast('Edit ${p.title}','info')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-delete" onclick="showToast('Property deleted','error')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Properties admin table
  const propsBody = document.getElementById('adminPropertiesBody');
  if (propsBody) {
    propsBody.innerHTML = properties.map(p => `
      <tr>
        <td><img class="table-img" src="${p.image}" alt=""></td>
        <td>${p.title}</td>
        <td>${p.priceFormatted}${p.priceLabel || ''}</td>
        <td>${p.type}</td>
        <td>${p.location}</td>
        <td><span class="status-badge active">Active</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="showToast('Edit mode','info')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-delete" onclick="showToast('Property deleted','error')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Agents admin
  const agentsBody = document.getElementById('adminAgentsBody');
  if (agentsBody) {
    agentsBody.innerHTML = agents.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.company}</td>
        <td>${a.listings}</td>
        <td>${a.rating}</td>
        <td><span class="status-badge active">Active</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="showToast('Edit agent','info')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-delete" onclick="showToast('Agent removed','error')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Users admin
  const usersBody = document.getElementById('adminUsersBody');
  if (usersBody) {
    const users = [
      { name: "Kofi Mensah", email: "kofi@gmail.com", type: "Buyer", joined: "2026-01-15", status: "active" },
      { name: "Ama Serwaa", email: "ama@outlook.com", type: "Agent", joined: "2025-11-22", status: "active" },
      { name: "Kweku Darko", email: "kweku@yahoo.com", type: "Buyer", joined: "2026-02-01", status: "active" },
      { name: "Adwoa Poku", email: "adwoa@gmail.com", type: "Developer", joined: "2025-09-10", status: "active" },
      { name: "Yaw Mensah", email: "yaw@gmail.com", type: "Buyer", joined: "2026-02-20", status: "pending" }
    ];
    usersBody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.type}</td>
        <td>${formatDate(u.joined)}</td>
        <td><span class="status-badge ${u.status}">${u.status.charAt(0).toUpperCase() + u.status.slice(1)}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="showToast('Edit user','info')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-delete" onclick="showToast('User removed','error')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Inquiries admin
  const inquiriesBody = document.getElementById('adminInquiriesBody');
  if (inquiriesBody) {
    const inquiries = [
      { from: "John Smith", property: "Luxury 4-Bedroom Villa", type: "Viewing", date: "2026-02-27", status: "pending" },
      { from: "Sarah Mensah", property: "Modern 3-Bed Apartment", type: "Call Request", date: "2026-02-26", status: "active" },
      { from: "Mike Owusu", property: "Premium Office Space", type: "Email", date: "2026-02-25", status: "active" },
      { from: "Grace Asante", property: "Beachfront Villa", type: "Viewing", date: "2026-02-24", status: "pending" },
      { from: "Paul Darko", property: "Residential Plot", type: "Call Request", date: "2026-02-23", status: "inactive" }
    ];
    inquiriesBody.innerHTML = inquiries.map(inq => `
      <tr>
        <td><strong>${inq.from}</strong></td>
        <td>${inq.property}</td>
        <td>${inq.type}</td>
        <td>${formatDate(inq.date)}</td>
        <td><span class="status-badge ${inq.status}">${inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="showToast('Responding to inquiry','info')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

function openAdminModal(type) {
  document.getElementById('adminModalOverlay').classList.add('open');
  if (type === 'addProperty') {
    document.getElementById('adminModalTitle').textContent = 'Add Property';
    document.getElementById('adminPropertyForm').reset();
  }
}

function closeAdminModal() {
  document.getElementById('adminModalOverlay').classList.remove('open');
}

function saveAdminProperty(e) {
  e.preventDefault();
  closeAdminModal();
  showToast('Property saved successfully!', 'success');
}
