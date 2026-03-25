-- GhanaDeals — Seed data
-- Run after 001_initial_schema.sql to populate initial agents and properties.

-- ============================================================
-- AGENTS
-- ============================================================

INSERT INTO agents (id, name, company, phone, color, rating, areas, years, verified) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Kwame Asante', 'Asante Premier Properties', '+233241234567', '#E63946', 4.9, ARRAY['East Legon','Cantonments','Airport'], 12, true),
  ('a1000000-0000-0000-0000-000000000002', 'Ama Mensah', 'Mensah Realty', '+233242345678', '#3B82F6', 4.8, ARRAY['Airport Residential','Ridge','Osu'], 8, true),
  ('a1000000-0000-0000-0000-000000000003', 'Kofi Adjei', 'Adjei Real Estate', '+233243456789', '#10B981', 4.7, ARRAY['Cantonments','East Legon Hills'], 10, true),
  ('a1000000-0000-0000-0000-000000000004', 'Abena Osei', 'Prestige Ghana', '+233244567890', '#8B5CF6', 4.6, ARRAY['Trasacco Valley','East Legon'], 15, true),
  ('a1000000-0000-0000-0000-000000000005', 'Efua Asiedu', 'Asiedu Rentals', '+233246789012', '#EC4899', 4.5, ARRAY['Osu','Labone','Cantonments'], 6, true),
  ('a1000000-0000-0000-0000-000000000006', 'Yaw Darko', 'Darko Luxury', '+233247890123', '#6366F1', 4.4, ARRAY['Ridge','Airport Residential'], 9, true),
  ('a1000000-0000-0000-0000-000000000007', 'Akua Boateng', 'Boateng & Co', '+233248901234', '#14B8A6', 4.3, ARRAY['Nhyiaeso','Ahodwo','Kumasi'], 7, true);

-- ============================================================
-- PROPERTIES
-- ============================================================

INSERT INTO properties (id, agent_id, title, listing_type, price, region, location, type, beds, baths, area, image, image_lg, gallery, badges, photos, description, amenities, ref, furnishing, parking, featured, moderation_status, created_at) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Luxury 4-Bedroom Villa in East Legon',
  'sale', 2800000, 'Greater Accra', 'East Legon, Accra', 'Villa', 4, 4, 450,
  '/legacy/assets/properties/property-villa-1.jpg',
  '/legacy/assets/properties/large_property-villa-1.jpg',
  ARRAY['/legacy/assets/properties/large_property-villa-1.jpg','/legacy/assets/properties/large_property-interior-1.jpg','/legacy/assets/properties/large_property-bedroom-1.jpg'],
  ARRAY['verified','premium'], 24,
  'This stunning 4-bedroom villa in East Legon features premium finishes, a modern kitchen, private pool, and landscaped gardens.',
  ARRAY['Pool','Garden','Security','Generator','CCTV','Parking'],
  'GD-VL-001', 'Furnished', '2 Covered', true, 'approved', '2026-02-15'
),
(
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'Modern 3-Bedroom Apartment, Airport Residential',
  'sale', 850000, 'Greater Accra', 'Airport Residential, Accra', 'Apartment', 3, 2, 185,
  '/legacy/assets/properties/property-apartment-1.jpg',
  '/legacy/assets/properties/large_property-apartment-1.jpg',
  ARRAY['/legacy/assets/properties/large_property-apartment-1.jpg','/legacy/assets/properties/large_property-kitchen-1.jpg','/legacy/assets/properties/large_property-bedroom-1.jpg'],
  ARRAY['verified'], 18,
  'A beautifully designed 3-bedroom apartment in Airport Residential with premium fittings and excellent accessibility.',
  ARRAY['Security','Generator','CCTV','Parking','Elevator'],
  'GD-AP-002', 'Semi-Furnished', '1 Covered', false, 'approved', '2026-02-18'
),
(
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'Executive 5-Bedroom Mansion, Trasacco Valley',
  'sale', 5500000, 'Greater Accra', 'Trasacco Valley, Accra', 'House', 5, 6, 650,
  '/legacy/assets/properties/property-house-2.jpg',
  '/legacy/assets/properties/large_property-house-2.jpg',
  ARRAY['/legacy/assets/properties/large_property-house-2.jpg','/legacy/assets/properties/large_property-interior-1.jpg','/legacy/assets/properties/large_property-kitchen-1.jpg'],
  ARRAY['premium','verified'], 32,
  'An exceptional 5-bedroom executive mansion in Trasacco Valley with expansive spaces and luxury finishes.',
  ARRAY['Pool','Garden','Security','Gym','Borehole','Parking'],
  'GD-HS-003', 'Furnished', '4 Covered', true, 'approved', '2026-01-28'
),
(
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  '2-Bedroom Apartment in Osu',
  'rent', 4500, 'Greater Accra', 'Osu, Accra', 'Apartment', 2, 2, 120,
  '/legacy/assets/properties/property-interior-1.jpg',
  '/legacy/assets/properties/large_property-interior-1.jpg',
  ARRAY['/legacy/assets/properties/large_property-interior-1.jpg','/legacy/assets/properties/large_property-bedroom-1.jpg','/legacy/assets/properties/large_property-kitchen-1.jpg'],
  ARRAY['verified'], 14,
  'A stylish 2-bedroom rental in Osu with great access to restaurants, nightlife, and business districts.',
  ARRAY['Security','Generator','Parking','Fitted Kitchen'],
  'GD-RT-004', 'Furnished', '1 Covered', false, 'pending', '2026-02-20'
),
(
  'b1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000006',
  'Luxury Penthouse, Ridge',
  'rent', 8000, 'Greater Accra', 'Ridge, Accra', 'Apartment', 3, 3, 250,
  '/legacy/assets/properties/property-apartment-2.jpg',
  '/legacy/assets/properties/large_property-apartment-2.jpg',
  ARRAY['/legacy/assets/properties/large_property-apartment-2.jpg','/legacy/assets/properties/large_property-interior-1.jpg','/legacy/assets/properties/large_property-bedroom-1.jpg'],
  ARRAY['premium','verified'], 22,
  'An extraordinary penthouse in Ridge featuring panoramic views and premium finishing throughout.',
  ARRAY['Pool','Security','Generator','CCTV','Gym','Elevator'],
  'GD-RT-005', 'Furnished', '2 Covered', true, 'approved', '2026-02-22'
),
(
  'b1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007',
  'Furnished 2-Bed Apartment, Kumasi',
  'rent', 2500, 'Ashanti', 'Nhyiaeso, Kumasi', 'Apartment', 2, 1, 95,
  '/legacy/assets/properties/property-apartment-1.jpg',
  '/legacy/assets/properties/large_property-apartment-1.jpg',
  ARRAY['/legacy/assets/properties/large_property-apartment-1.jpg','/legacy/assets/properties/large_property-interior-1.jpg','/legacy/assets/properties/large_property-kitchen-1.jpg'],
  ARRAY[]::text[], 11,
  'A well-furnished 2-bedroom apartment in Nhyiaeso, Kumasi, suitable for professionals and families.',
  ARRAY['Security','Parking','Fitted Kitchen'],
  'GD-RT-006', 'Furnished', '1 Open', false, 'pending', '2026-02-25'
),
(
  'b1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000003',
  '3-Bedroom Townhouse, East Legon Hills',
  'sale', 1200000, 'Greater Accra', 'East Legon Hills, Accra', 'House', 3, 3, 280,
  '/legacy/assets/properties/property-house-2.jpg',
  '/legacy/assets/properties/large_property-house-2.jpg',
  ARRAY['/legacy/assets/properties/large_property-house-2.jpg','/legacy/assets/properties/large_property-bedroom-1.jpg'],
  ARRAY['verified'], 16,
  'A modern 3-bedroom townhouse in the growing East Legon Hills community with excellent amenities.',
  ARRAY['Garden','Security','Parking','Borehole'],
  'GD-HS-007', 'Semi-Furnished', '2 Covered', false, 'flagged', '2026-03-01'
),
(
  'b1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Premium 4-Bed Duplex, Cantonments',
  'sale', 3200000, 'Greater Accra', 'Cantonments, Accra', 'House', 4, 5, 520,
  '/legacy/assets/properties/property-villa-1.jpg',
  '/legacy/assets/properties/large_property-villa-1.jpg',
  ARRAY['/legacy/assets/properties/large_property-villa-1.jpg','/legacy/assets/properties/large_property-kitchen-1.jpg'],
  ARRAY['premium','verified'], 28,
  'A premium duplex in Cantonments with spacious interiors, modern design, and top-tier finishes.',
  ARRAY['Pool','Garden','Security','Generator','CCTV','Gym','Parking'],
  'GD-HS-008', 'Furnished', '3 Covered', true, 'approved', '2026-03-05'
);
