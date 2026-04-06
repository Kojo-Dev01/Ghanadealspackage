-- ============================================================
-- Seed 30 additional property listings with real images,
-- floor plans, and accurate Ghana coordinates.
-- ============================================================

INSERT INTO properties (
  id, agent_id, title, listing_type, price, price_label, region, location, type,
  beds, baths, area, description, image, image_lg, gallery, badges, photos,
  amenities, ref, furnishing, parking, featured, moderation_status,
  latitude, longitude, floor_plans, created_at
) VALUES

-- ============================================================
-- 1. Elegant 4-Bed Townhouse, East Legon Hills
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Elegant 4-Bedroom Townhouse in East Legon Hills',
  'sale', 950000, NULL, 'Greater Accra', 'East Legon Hills, Accra', 'Townhouse',
  4, 4, 320,
  'A beautifully designed 4-bedroom townhouse in East Legon Hills with contemporary architecture, spacious living areas, and a private garden. Features include a fitted kitchen, en-suite bathrooms, and 24-hour security.',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','CCTV','Garden','Parking','Fitted Kitchen'],
  'GD-TH-010', 'Semi-Furnished', '2 Covered', false, 'approved',
  5.6505, -0.1553,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-01'
),

-- ============================================================
-- 2. Modern Studio Apartment, Osu
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000005',
  'Chic Studio Apartment in Osu',
  'rent', 3200, '/month', 'Greater Accra', 'Osu, Accra', 'Apartment',
  1, 1, 55,
  'A stylish studio apartment in the heart of Osu, perfect for young professionals. Walking distance to Oxford Street, restaurants, and nightlife. Fully furnished with modern appliances.',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','WiFi','Air Conditioning','Fitted Kitchen','Water Heater'],
  'GD-ST-011', 'Furnished', 'Street Parking', false, 'approved',
  5.5560, -0.1820,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-02'
),

-- ============================================================
-- 3. Luxury 5-Bed House, Airport Residential
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000002',
  'Luxury 5-Bedroom House in Airport Residential',
  'sale', 3200000, NULL, 'Greater Accra', 'Airport Residential, Accra', 'House',
  5, 5, 520,
  'An exquisite 5-bedroom house in the prestigious Airport Residential Area. Features a swimming pool, home cinema, staff quarters, and mature garden. Premium finishes throughout.',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop'
  ],
  ARRAY['premium','verified'], 6,
  ARRAY['Pool','Cinema','Garden','Security','Generator','Staff Quarters','CCTV','Parking'],
  'GD-HS-012', 'Furnished', '4 Covered', true, 'approved',
  5.6050, -0.1750,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-03'
),

-- ============================================================
-- 4. Cozy 2-Bed Apartment, Labone
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'Cozy 2-Bedroom Apartment in Labone',
  'rent', 5500, '/month', 'Greater Accra', 'Labone, Accra', 'Apartment',
  2, 2, 130,
  'A well-maintained 2-bedroom apartment in Labone with modern finishes. Close to shopping malls, restaurants, and the beach. Ideal for couples or small families.',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Air Conditioning','Water Heater','Parking'],
  'GD-AP-013', 'Furnished', '1 Covered', false, 'approved',
  5.5590, -0.1760,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-04'
),

-- ============================================================
-- 5. New Development – Cantonments Residences
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000003',
  'Cantonments Residences – Off-Plan 3-Bed Units',
  'new', 680000, NULL, 'Greater Accra', 'Cantonments, Accra', 'Apartment',
  3, 3, 175,
  'Brand new off-plan development in Cantonments. Modern 3-bedroom apartments with high-end finishes, communal pool, gym, and landscaped grounds. Expected completion Q4 2026.',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop'
  ],
  ARRAY['new','premium'], 6,
  ARRAY['Pool','Gym','Security','Elevator','Parking','Landscaped Garden'],
  'GD-NW-014', 'Unfurnished', '1 Covered', true, 'approved',
  5.5620, -0.1740,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-05'
),

-- ============================================================
-- 6. Office Space, Ridge
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000006',
  'Premium Office Space in Ridge',
  'rent', 12000, '/month', 'Greater Accra', 'Ridge, Accra', 'Commercial',
  0, 2, 280,
  'A premium open-plan office space in the Ridge business district. Features high-speed internet readiness, conference rooms, and ample parking. Ideal for corporate tenants.',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Parking','Security','Elevator','Air Conditioning','Conference Room','Generator'],
  'GD-CM-015', 'Unfurnished', '6 Covered', false, 'approved',
  5.5682, -0.1898,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-05'
),

-- ============================================================
-- 7. Land Plot, Prampram
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Beachfront Land – 2 Acres in Prampram',
  'sale', 1200000, NULL, 'Greater Accra', 'Prampram, Greater Accra', 'Land',
  0, 0, 8094,
  'Two acres of prime beachfront land in Prampram with clear title documentation. Ideal for resort or residential development. Road access and electricity nearby.',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1605283176568-9b41fde3672e?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Beachfront','Road Access','Electricity Nearby','Clear Title'],
  'GD-LD-016', '', '', false, 'approved',
  5.7230, -0.0560,
  ARRAY[]::text[],
  '2026-03-06'
),

-- ============================================================
-- 8. Serviced 1-Bed, Cantonments
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000003',
  'Serviced 1-Bedroom Apartment, Cantonments',
  'rent', 4000, '/month', 'Greater Accra', 'Cantonments, Accra', 'Apartment',
  1, 1, 75,
  'A fully serviced 1-bedroom apartment in Cantonments with weekly housekeeping, WiFi, and utilities included. Perfect for expatriates and business travelers.',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['WiFi','Housekeeping','Security','Air Conditioning','Generator','Water Heater'],
  'GD-SV-017', 'Furnished', '1 Covered', false, 'approved',
  5.5630, -0.1730,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-07'
),

-- ============================================================
-- 9. 3-Bed Semi-Detached, Spintex
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000004',
  '3-Bedroom Semi-Detached House in Spintex',
  'sale', 480000, NULL, 'Greater Accra', 'Spintex Road, Accra', 'House',
  3, 3, 210,
  'A modern 3-bedroom semi-detached house along Spintex Road. Features a spacious compound, boys quarters, and is located within a gated community with 24-hour security.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Borehole','Garden','Boys Quarters','Parking'],
  'GD-HS-018', 'Semi-Furnished', '2 Covered', false, 'approved',
  5.6350, -0.1180,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-08'
),

-- ============================================================
-- 10. 6-Bed Mansion, Trassaco Valley
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000010',
  'a1000000-0000-0000-0000-000000000004',
  'Grand 6-Bedroom Mansion in Trasacco Valley',
  'sale', 7500000, NULL, 'Greater Accra', 'Trasacco Valley, Accra', 'Villa',
  6, 7, 850,
  'An iconic 6-bedroom mansion in Trasacco Valley with Italian marble floors, infinity pool, wine cellar, and smart home technology. The epitome of luxury living in Accra.',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop'
  ],
  ARRAY['premium','verified'], 6,
  ARRAY['Pool','Wine Cellar','Smart Home','Cinema','Gym','Staff Quarters','Generator','CCTV','Garden'],
  'GD-VL-019', 'Furnished', '6 Covered', true, 'approved',
  5.6180, -0.1490,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-09'
),

-- ============================================================
-- 11. 4-Bed House, Ahodwo – Kumasi
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000007',
  '4-Bedroom Executive House in Ahodwo, Kumasi',
  'sale', 620000, NULL, 'Ashanti', 'Ahodwo, Kumasi', 'House',
  4, 4, 340,
  'A tastefully built 4-bedroom executive house in Ahodwo, Kumasi. Features a large living area, modern kitchen, boys quarters, and is situated in a serene neighborhood.',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Borehole','Garden','Boys Quarters','Parking'],
  'GD-HS-020', 'Semi-Furnished', '2 Covered', false, 'approved',
  6.6880, -1.6244,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-10'
),

-- ============================================================
-- 12. 2-Bed Apartment, Nhyiaeso – Kumasi
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000007',
  '2-Bedroom Apartment in Nhyiaeso, Kumasi',
  'rent', 2800, '/month', 'Ashanti', 'Nhyiaeso, Kumasi', 'Apartment',
  2, 2, 110,
  'A modern 2-bedroom apartment in the upscale Nhyiaeso area of Kumasi. Close to Kumasi City Mall and major amenities. Features tiled floors, fitted kitchen, and secure parking.',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Water Heater','Parking','Fitted Kitchen'],
  'GD-AP-021', 'Semi-Furnished', '1 Covered', false, 'approved',
  6.6750, -1.6160,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-11'
),

-- ============================================================
-- 13. Warehouse, Tema Industrial Area
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000013',
  'a1000000-0000-0000-0000-000000000001',
  'Industrial Warehouse in Tema',
  'sale', 1800000, NULL, 'Greater Accra', 'Tema Industrial Area, Tema', 'Commercial',
  0, 2, 2000,
  'A large industrial warehouse in the Tema Industrial Area with loading docks, high ceilings, and office space. Ideal for manufacturing, logistics, or storage operations.',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Loading Docks','Office Space','Security','Generator','Parking','Fire Safety'],
  'GD-CM-022', '', '10 Open', false, 'approved',
  5.6390, -0.0100,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-12'
),

-- ============================================================
-- 14. 3-Bed House, Tema Community 25
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000014',
  'a1000000-0000-0000-0000-000000000001',
  '3-Bedroom House in Tema Community 25',
  'sale', 380000, NULL, 'Greater Accra', 'Community 25, Tema', 'House',
  3, 3, 200,
  'A newly built 3-bedroom house in Tema Community 25. Features a modern design with spacious rooms, fitted wardrobes, and a walled compound. Close to schools and shopping.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Borehole','Garden','Parking','Fitted Wardrobes'],
  'GD-HS-023', 'Unfurnished', '2 Covered', false, 'approved',
  5.6650, -0.0350,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-13'
),

-- ============================================================
-- 15. Penthouse, East Legon
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000015',
  'a1000000-0000-0000-0000-000000000003',
  'Luxury Penthouse in East Legon',
  'sale', 1500000, NULL, 'Greater Accra', 'East Legon, Accra', 'Apartment',
  4, 4, 350,
  'A breathtaking penthouse in East Legon with panoramic city views, rooftop terrace, private elevator, and premium finishes. Smart home features and concierge service included.',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop'
  ],
  ARRAY['premium','verified'], 6,
  ARRAY['Rooftop Terrace','Private Elevator','Smart Home','Concierge','Pool','Gym','CCTV'],
  'GD-PH-024', 'Furnished', '2 Covered', true, 'approved',
  5.6370, -0.1570,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-14'
),

-- ============================================================
-- 16. 3-Bed Rental, Dzorwulu
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000016',
  'a1000000-0000-0000-0000-000000000006',
  '3-Bedroom House for Rent in Dzorwulu',
  'rent', 6500, '/month', 'Greater Accra', 'Dzorwulu, Accra', 'House',
  3, 3, 220,
  'A charming 3-bedroom detached house in the quiet Dzorwulu neighborhood. Lush garden, spacious compound, and close to the Dzorwulu Highway for easy access.',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Garden','Security','Generator','Boys Quarters','Parking'],
  'GD-RT-025', 'Semi-Furnished', '2 Covered', false, 'approved',
  5.5920, -0.2010,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-15'
),

-- ============================================================
-- 17. Land, Aburi Hills
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000017',
  'a1000000-0000-0000-0000-000000000003',
  'Scenic Hilltop Land in Aburi',
  'sale', 350000, NULL, 'Eastern', 'Aburi, Eastern Region', 'Land',
  0, 0, 4047,
  'One acre of scenic hilltop land in Aburi with breathtaking mountain views. Perfect for a holiday retreat or eco-lodge. Paved road access and water supply available.',
  'https://images.unsplash.com/photo-1605283176568-9b41fde3672e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1605283176568-9b41fde3672e?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1605283176568-9b41fde3672e?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Mountain Views','Road Access','Water Supply','Clear Title'],
  'GD-LD-026', '', '', false, 'approved',
  5.8510, -0.1740,
  ARRAY[]::text[],
  '2026-03-16'
),

-- ============================================================
-- 18. New Development – Tema Harbour View
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000018',
  'a1000000-0000-0000-0000-000000000002',
  'Tema Harbour View – New 2-Bed Apartments',
  'new', 320000, NULL, 'Greater Accra', 'Tema, Greater Accra', 'Apartment',
  2, 2, 110,
  'Brand new waterfront apartments near Tema Harbour. Contemporary design with open-plan living, balcony views, communal rooftop, and secure underground parking. Move-in ready.',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop'
  ],
  ARRAY['new'], 6,
  ARRAY['Balcony','Rooftop Access','Underground Parking','Security','Elevator','Gym'],
  'GD-NW-027', 'Unfurnished', '1 Underground', false, 'approved',
  5.6270, 0.0030,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-17'
),

-- ============================================================
-- 19. 4-Bed House, Sakumono
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000019',
  'a1000000-0000-0000-0000-000000000004',
  '4-Bedroom Detached House in Sakumono',
  'sale', 520000, NULL, 'Greater Accra', 'Sakumono, Tema', 'House',
  4, 3, 280,
  'A well-built 4-bedroom detached house in the Sakumono Estates. Features include a large living/dining area, fitted kitchen, tiled compound, and boys quarters.',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Borehole','Boys Quarters','Garden','Parking'],
  'GD-HS-028', 'Semi-Furnished', '2 Covered', false, 'approved',
  5.6310, -0.0560,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-18'
),

-- ============================================================
-- 20. Retail Shop, Osu Oxford Street
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000020',
  'a1000000-0000-0000-0000-000000000005',
  'Prime Retail Space on Oxford Street, Osu',
  'rent', 8500, '/month', 'Greater Accra', 'Oxford Street, Osu, Accra', 'Commercial',
  0, 1, 150,
  'A high-visibility retail space on the bustling Oxford Street in Osu. Perfect for fashion, F&B, or lifestyle brands. High foot traffic, air conditioned, and ready for fit-out.',
  'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Air Conditioning','Display Window','Storage','Parking Nearby'],
  'GD-CM-029', 'Unfurnished', 'Street Parking', false, 'approved',
  5.5565, -0.1810,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-19'
),

-- ============================================================
-- 21. 5-Bed House, Adjiringanor
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000021',
  'a1000000-0000-0000-0000-000000000001',
  '5-Bedroom House in Adjiringanor',
  'sale', 750000, NULL, 'Greater Accra', 'Adjiringanor, Accra', 'House',
  5, 5, 400,
  'A spacious 5-bedroom house in Adjiringanor within a gated community. Features large bedrooms, modern kitchen, landscaped garden, and staff quarters. Close to the American International School.',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Borehole','Garden','Staff Quarters','CCTV','Parking'],
  'GD-HS-030', 'Semi-Furnished', '3 Covered', false, 'approved',
  5.6480, -0.1410,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-20'
),

-- ============================================================
-- 22. 1-Bed Apartment, Achimota
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000022',
  'a1000000-0000-0000-0000-000000000006',
  '1-Bedroom Apartment in Achimota',
  'rent', 2200, '/month', 'Greater Accra', 'Achimota, Accra', 'Apartment',
  1, 1, 65,
  'An affordable 1-bedroom apartment in Achimota with tiled floors, security, and proximity to Achimota Mall. Ideal for singles or couples looking for value in a good location.',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop'
  ],
  ARRAY[]::text[], 6,
  ARRAY['Security','Water Heater','Parking'],
  'GD-AP-031', 'Unfurnished', 'Street Parking', false, 'approved',
  5.6140, -0.2270,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-21'
),

-- ============================================================
-- 23. Beach Villa, Ada Foah
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000023',
  'a1000000-0000-0000-0000-000000000002',
  'Beach Villa in Ada Foah',
  'sale', 890000, NULL, 'Greater Accra', 'Ada Foah, Greater Accra', 'Villa',
  3, 3, 250,
  'A stunning beachfront villa in Ada Foah with direct access to the Volta River estuary. Features an infinity pool, outdoor deck, open-plan kitchen, and tropical gardens.',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop'
  ],
  ARRAY['premium','verified'], 6,
  ARRAY['Pool','Beachfront','Garden','Generator','Security','Outdoor Deck'],
  'GD-VL-032', 'Furnished', '2 Covered', true, 'approved',
  5.7860, 0.6330,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-22'
),

-- ============================================================
-- 24. 3-Bed House, Takoradi
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000024',
  'a1000000-0000-0000-0000-000000000007',
  '3-Bedroom House in Takoradi',
  'sale', 290000, NULL, 'Western', 'Takoradi, Western Region', 'House',
  3, 2, 180,
  'A solid 3-bedroom house in Takoradi with modern amenities. Close to the Takoradi Market Circle and the harbour. Features include a walled compound, borehole, and boys quarters.',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Borehole','Boys Quarters','Garden','Parking'],
  'GD-HS-033', 'Semi-Furnished', '1 Covered', false, 'approved',
  4.8960, -1.7554,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-23'
),

-- ============================================================
-- 25. New Dev – Kumasi Royal Gardens
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000025',
  'a1000000-0000-0000-0000-000000000007',
  'Kumasi Royal Gardens – New 3-Bed Villas',
  'new', 450000, NULL, 'Ashanti', 'Ahodwo, Kumasi', 'Villa',
  3, 4, 260,
  'Off-plan luxury villas in the new Kumasi Royal Gardens estate. Each unit features modern Ghanaian-inspired architecture, private garden, carport, and community clubhouse access.',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop'
  ],
  ARRAY['new','verified'], 6,
  ARRAY['Garden','Clubhouse','Security','Parking','Borehole','Playground'],
  'GD-NW-034', 'Unfurnished', '1 Covered', true, 'approved',
  6.6920, -1.6290,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-24'
),

-- ============================================================
-- 26. 2-Bed House, Kasoa
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000026',
  'a1000000-0000-0000-0000-000000000004',
  '2-Bedroom House in Kasoa',
  'sale', 180000, NULL, 'Central', 'Kasoa, Central Region', 'House',
  2, 2, 120,
  'An affordable 2-bedroom house in Kasoa with modern tiling, fitted kitchen, and a secure compound. Located along the main Kasoa-Accra highway for easy commute.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop'
  ],
  ARRAY[]::text[], 6,
  ARRAY['Security','Fitted Kitchen','Parking'],
  'GD-HS-035', 'Unfurnished', '1 Open', false, 'approved',
  5.5340, -0.4180,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-25'
),

-- ============================================================
-- 27. 4-Bed Townhouse, Haatso
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000027',
  'a1000000-0000-0000-0000-000000000006',
  '4-Bedroom Townhouse in Haatso',
  'sale', 420000, NULL, 'Greater Accra', 'Haatso, Accra', 'Townhouse',
  4, 3, 250,
  'A modern 4-bedroom townhouse in Haatso within a gated community. Features open-plan living, rooftop terrace, and communal garden. Close to major roads and schools.',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Rooftop Terrace','Communal Garden','Parking'],
  'GD-TH-036', 'Semi-Furnished', '1 Covered', false, 'approved',
  5.6460, -0.2130,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-26'
),

-- ============================================================
-- 28. 3-Bed Apartment, Roman Ridge
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000028',
  'a1000000-0000-0000-0000-000000000002',
  'Spacious 3-Bed Apartment in Roman Ridge',
  'rent', 7000, '/month', 'Greater Accra', 'Roman Ridge, Accra', 'Apartment',
  3, 3, 200,
  'A spacious 3-bedroom apartment in the upscale Roman Ridge neighborhood. Features a large balcony, fitted kitchen, and en-suite master bedroom. Walking distance to embassies and fine dining.',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f736a1b17023?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Security','Generator','Balcony','Air Conditioning','Elevator','Parking'],
  'GD-AP-037', 'Semi-Furnished', '2 Covered', false, 'approved',
  5.5750, -0.1870,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop'],
  '2026-03-27'
),

-- ============================================================
-- 29. Land, Dodowa
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000029',
  'a1000000-0000-0000-0000-000000000003',
  'Residential Land in Dodowa – 1.5 Acres',
  'sale', 220000, NULL, 'Greater Accra', 'Dodowa, Greater Accra', 'Land',
  0, 0, 6070,
  'A 1.5-acre plot of serviced residential land in Dodowa with road access, electricity, and piped water. Gated community with demarcated plots. Documentation complete and ready for development.',
  'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1605283176568-9b41fde3672e?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop'
  ],
  ARRAY['verified'], 6,
  ARRAY['Road Access','Electricity','Piped Water','Clear Title','Gated Community'],
  'GD-LD-038', '', '', false, 'approved',
  5.8850, -0.0970,
  ARRAY[]::text[],
  '2026-03-28'
),

-- ============================================================
-- 30. New Dev – Accra Atlantic Towers
-- ============================================================
(
  'c1000000-0000-0000-0000-000000000030',
  'a1000000-0000-0000-0000-000000000002',
  'Accra Atlantic Towers – Luxury 2 & 3-Bed Units',
  'new', 550000, NULL, 'Greater Accra', 'Airport City, Accra', 'Apartment',
  3, 3, 190,
  'Premium high-rise apartments in Airport City with stunning views of Accra. Features include floor-to-ceiling windows, rooftop infinity pool, co-working space, and 24/7 concierge. Completion Q2 2027.',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop',
  ARRAY[
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop'
  ],
  ARRAY['new','premium'], 6,
  ARRAY['Pool','Co-Working','Concierge','Gym','Elevator','Smart Home','CCTV','Underground Parking'],
  'GD-NW-039', 'Unfurnished', '1 Underground', true, 'approved',
  5.5955, -0.1720,
  ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
  '2026-03-29'
);
