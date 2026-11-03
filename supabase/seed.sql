-- ROVEO Sample Destination Data
-- Run this after schema.sql

INSERT INTO public.destinations (
  name, location, country, continent, description, long_description,
  category, image_url, highlights, recommended_activities,
  suggested_duration_min, suggested_duration_max,
  budget_min, budget_max, best_time_to_visit, latitude, longitude,
  rating, is_featured, is_active
) VALUES
(
  'Santorini', 'Cyclades', 'Greece', 'Europe',
  'The iconic Greek island with whitewashed buildings, blue-domed churches, and spectacular sunsets over the caldera.',
  'Santorini is one of the most photographed islands in the world, famous for its dramatic views, volcanic beaches, and charming villages of Oia and Fira. The island sits atop an ancient volcanic caldera, offering breathtaking panoramic views of the Aegean Sea.',
  ARRAY['beach', 'culture', 'romantic', 'photography'],
  'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
  ARRAY['Oia Sunset', 'Caldera Views', 'Wine Tasting', 'Black Sand Beaches', 'Akrotiri Archaeological Site'],
  ARRAY['Watch the sunset in Oia', 'Explore Fira town', 'Visit Red Beach', 'Take a catamaran cruise', 'Visit Akrotiri ruins'],
  5, 10, 150, 400, 'April to November', 36.3932, 25.4615, 4.8, TRUE, TRUE
),
(
  'Kyoto', 'Kansai', 'Japan', 'Asia',
  'Japan''s ancient capital, home to thousands of temples, traditional geisha culture, bamboo groves, and stunning seasonal beauty.',
  'Kyoto was Japan''s imperial capital for over a thousand years and remains the country''s cultural heart. With over 1,600 Buddhist temples and 400 Shinto shrines, the city offers an unparalleled window into Japanese history and tradition.',
  ARRAY['culture', 'historical', 'nature', 'food'],
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  ARRAY['Arashiyama Bamboo Grove', 'Fushimi Inari Shrine', 'Geisha District Gion', 'Kinkaku-ji Golden Pavilion', 'Traditional Tea Ceremony'],
  ARRAY['Walk through Arashiyama Bamboo Grove', 'Visit Fushimi Inari at sunrise', 'Experience a tea ceremony', 'Explore Nishiki Market', 'Watch geishas in Gion'],
  5, 10, 100, 300, 'March-May or October-November', 35.0116, 135.7681, 4.9, TRUE, TRUE
),
(
  'Bali', 'Ubud & Seminyak', 'Indonesia', 'Asia',
  'The Island of Gods, offering a magical blend of rice terraces, ancient temples, spiritual culture, and world-class beaches.',
  'Bali captivates visitors with its extraordinary combination of volcanic mountains, lush rice paddies, pristine beaches, and a deeply spiritual Hindu culture. From the artistic hub of Ubud to the surf paradise of Canggu, every corner of Bali offers something unique.',
  ARRAY['beach', 'culture', 'nature', 'adventure', 'spiritual'],
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  ARRAY['Tegallalang Rice Terraces', 'Tanah Lot Temple', 'Mount Batur Sunrise Trek', 'Seminyak Beach', 'Ubud Monkey Forest'],
  ARRAY['Trek Mount Batur at sunrise', 'Visit Tanah Lot temple', 'Explore Ubud art market', 'Take a surf lesson', 'Get a traditional massage'],
  7, 14, 50, 200, 'April to October', -8.4095, 115.1889, 4.7, TRUE, TRUE
),
(
  'Paris', 'Île-de-France', 'France', 'Europe',
  'The City of Light, an eternal hub of art, fashion, gastronomy, and romance, centered around the iconic Eiffel Tower.',
  'Paris has been enchanting visitors for centuries with its magnificent architecture, world-class museums, legendary cuisine, and undeniable romantic atmosphere. From the Louvre''s timeless art collection to the charming cafés of Montmartre, Paris delivers an experience like no other.',
  ARRAY['culture', 'city', 'food', 'historical', 'romantic'],
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  ARRAY['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise', 'Versailles Palace'],
  ARRAY['Visit the Eiffel Tower at night', 'Explore the Louvre', 'Stroll along Champs-Élysées', 'Take a Seine River cruise', 'Visit Montmartre'],
  5, 10, 150, 500, 'April to June or September to October', 48.8566, 2.3522, 4.8, TRUE, TRUE
),
(
  'Maldives', 'Indian Ocean', 'Maldives', 'Asia',
  'A tropical paradise of crystal-clear lagoons, overwater bungalows, and the world''s most spectacular coral reefs.',
  'The Maldives is the ultimate luxury escape, featuring 1,200 coral islands scattered across the Indian Ocean. Known for its turquoise waters, abundant marine life, and overwater bungalows, it''s one of the world''s most sought-after honeymoon destinations.',
  ARRAY['beach', 'romantic', 'luxury', 'diving'],
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
  ARRAY['Overwater Bungalows', 'Coral Reef Snorkeling', 'Dolphin Watching', 'Underwater Restaurant', 'Sunset Fishing'],
  ARRAY['Stay in an overwater bungalow', 'Snorkel with manta rays', 'Go on a dolphin cruise', 'Dine underwater', 'Explore local islands'],
  5, 10, 300, 1000, 'November to April', 3.2028, 73.2207, 4.9, TRUE, TRUE
),
(
  'Iceland', 'Reykjavik & Golden Circle', 'Iceland', 'Europe',
  'Land of fire and ice, where you can witness the Northern Lights, geysers, waterfalls, and volcanic landscapes.',
  'Iceland is a land of dramatic contrasts where volcanic activity meets ancient glaciers. The country offers unique experiences including the Northern Lights (Aurora Borealis) in winter, midnight sun in summer, powerful geysers, spectacular waterfalls, and one of the world''s most dramatic landscapes.',
  ARRAY['adventure', 'nature', 'photography', 'northern-lights'],
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80',
  ARRAY['Northern Lights', 'Golden Circle', 'Blue Lagoon', 'Glacier Hiking', 'Whale Watching'],
  ARRAY['Chase the Northern Lights', 'Visit the Blue Lagoon', 'Hike on Vatnajökull glacier', 'See Seljalandsfoss waterfall', 'Drive the Ring Road'],
  7, 14, 150, 400, 'September to March (Northern Lights)', 64.9631, -19.0208, 4.8, TRUE, TRUE
),
(
  'Machu Picchu', 'Cusco Region', 'Peru', 'South America',
  'The ancient Incan citadel set high in the Andes Mountains, one of the world''s most remarkable archaeological sites.',
  'Machu Picchu, the 15th-century Incan citadel perched at 2,430 meters above sea level, is one of humanity''s greatest architectural achievements. This UNESCO World Heritage Site offers an unparalleled combination of historical mystery, stunning mountain scenery, and Incan engineering brilliance.',
  ARRAY['historical', 'adventure', 'nature', 'culture'],
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
  ARRAY['Machu Picchu Citadel', 'Inca Trail Trek', 'Sun Gate (Inti Punku)', 'Huayna Picchu Mountain', 'Sacred Valley'],
  ARRAY['Hike the Inca Trail', 'Visit Machu Picchu at sunrise', 'Explore Sacred Valley', 'Visit Cusco', 'See the agricultural terraces'],
  5, 10, 80, 250, 'May to September', -13.1631, -72.5450, 4.9, TRUE, TRUE
),
(
  'Safari in Kenya', 'Maasai Mara', 'Kenya', 'Africa',
  'Experience the greatest wildlife spectacle on Earth — the Great Migration and Big Five in their natural African habitat.',
  'Kenya''s Maasai Mara National Reserve is home to one of nature''s most spectacular events — the Great Wildebeest Migration, where over 1.5 million wildebeest cross the Mara River. The Mara also offers exceptional Big Five game viewing year-round.',
  ARRAY['adventure', 'nature', 'wildlife', 'photography'],
  'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
  ARRAY['Great Migration', 'Big Five Safari', 'Hot Air Balloon Safari', 'Maasai Village Visit', 'Night Game Drive'],
  ARRAY['Game drive at sunrise', 'See the Great Migration river crossing', 'Hot air balloon over Mara', 'Visit a Maasai village', 'Spot the Big Five'],
  7, 14, 200, 600, 'July to October (Great Migration)', -1.5065, 35.1443, 4.9, TRUE, TRUE
),
(
  'Amalfi Coast', 'Campania', 'Italy', 'Europe',
  'A stunning stretch of Mediterranean coastline with colorful fishing villages, dramatic cliffs, and azure waters.',
  'The Amalfi Coast is a UNESCO World Heritage Site stretching along the southern edge of the Sorrentine Peninsula. Dramatic cliffs dotted with colorful villages — Positano, Amalfi, Ravello — plunge into the crystal-clear Tyrrhenian Sea, creating one of Italy''s most breathtaking landscapes.',
  ARRAY['beach', 'culture', 'food', 'scenic', 'romantic'],
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&q=80',
  ARRAY['Positano Village', 'Ravello Gardens', 'Emerald Grotto', 'Limoncello Tasting', 'Boat Tour'],
  ARRAY['Explore Positano on foot', 'Take a boat tour along the coast', 'Visit Villa Rufolo in Ravello', 'Try fresh seafood', 'Hike the Path of the Gods'],
  5, 9, 150, 450, 'April to October', 40.6333, 14.6020, 4.8, TRUE, TRUE
),
(
  'New York City', 'New York', 'USA', 'North America',
  'The city that never sleeps — a global metropolis of iconic skylines, world-class culture, diverse neighborhoods, and endless energy.',
  'New York City is a place of extraordinary diversity and vitality. From the bright lights of Times Square to the tranquility of Central Park, from world-class museums on the Upper East Side to the trendy galleries of Chelsea, NYC offers experiences that satisfy every curiosity.',
  ARRAY['city', 'culture', 'food', 'shopping', 'entertainment'],
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  ARRAY['Central Park', 'Times Square', 'Metropolitan Museum', 'Brooklyn Bridge', 'Statue of Liberty'],
  ARRAY['Walk across Brooklyn Bridge', 'Visit the Met Museum', 'See a Broadway show', 'Explore Central Park', 'Visit the 9/11 Memorial'],
  5, 10, 200, 600, 'April to June or September to November', 40.7128, -74.0060, 4.7, TRUE, TRUE
),
(
  'Bangkok', 'Central Thailand', 'Thailand', 'Asia',
  'A city of contrasts — ancient temples and palaces beside modern skyscrapers, street food culture and luxury rooftop bars.',
  'Bangkok is one of Asia''s most vibrant cities, where ancient Buddhist temples stand alongside ultramodern skyscrapers. The city''s incredible street food scene, energetic night markets, ornate palaces, and friendly locals make it one of the world''s most visited destinations.',
  ARRAY['city', 'culture', 'food', 'historical', 'nightlife'],
  'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
  ARRAY['Grand Palace', 'Wat Pho Temple', 'Chatuchak Weekend Market', 'Chao Phraya River', 'Khao San Road'],
  ARRAY['Visit the Grand Palace', 'Explore Chatuchak Market', 'Take a longtail boat on Chao Phraya', 'Sample street food at night markets', 'Visit Wat Arun at sunset'],
  5, 10, 50, 150, 'November to February', 13.7563, 100.5018, 4.6, FALSE, TRUE
),
(
  'New Zealand South Island', 'Queenstown & Fiordland', 'New Zealand', 'Oceania',
  'Adventure capital of the world meets pristine wilderness — fjords, glaciers, bungee jumping, and Lord of the Rings landscapes.',
  'New Zealand''s South Island is one of the world''s most spectacular destinations for adventure seekers and nature lovers alike. From the dramatic fjords of Milford Sound to the adrenaline hub of Queenstown, the glacier explorations of Franz Josef to the golden beaches of Abel Tasman, the South Island offers extraordinary diversity.',
  ARRAY['adventure', 'nature', 'scenic', 'outdoor'],
  'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',
  ARRAY['Milford Sound', 'Queenstown Adventures', 'Franz Josef Glacier', 'Abel Tasman', 'Mount Cook'],
  ARRAY['Cruise Milford Sound', 'Bungee jump in Queenstown', 'Hike the Routeburn Track', 'Explore Abel Tasman', 'Helicopter to Mt Cook glaciers'],
  10, 21, 100, 300, 'October to April', -45.0312, 168.6626, 4.9, TRUE, TRUE
),
(
  'Patagonia', 'Southern Argentina & Chile', 'Argentina', 'South America',
  'The end of the world — raw wilderness of glaciers, granite towers, and wind-swept steppes at the tip of South America.',
  'Patagonia is one of the last great wilderness areas on Earth, a land of superlatives at the southern tip of South America. The region features the Perito Moreno Glacier, the spires of Torres del Paine, Fitz Roy mountain, and vast empty steppes roamed by guanacos and condors.',
  ARRAY['adventure', 'nature', 'wilderness', 'hiking', 'photography'],
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
  ARRAY['Perito Moreno Glacier', 'Torres del Paine Trek', 'Fitz Roy Mountain', 'Los Glaciares National Park', 'Tierra del Fuego'],
  ARRAY['Trek Torres del Paine W Circuit', 'Watch Perito Moreno glacier calve', 'Hike to Fitz Roy base', 'See Tierra del Fuego', 'Boat through fjords'],
  10, 21, 80, 200, 'November to March', -50.9423, -73.4068, 4.9, FALSE, TRUE
),
(
  'Dubai', 'Emirate of Dubai', 'UAE', 'Asia',
  'A futuristic city of superlatives — tallest buildings, largest malls, and a spectacular desert landscape just beyond the city.',
  'Dubai has transformed from a small fishing village into one of the world''s most dynamic cities in just a few decades. The city is famous for its ultra-modern architecture, luxury shopping, lively nightlife, and stunning desert adventures just minutes from the glittering skyline.',
  ARRAY['city', 'luxury', 'adventure', 'shopping', 'nightlife'],
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  ARRAY['Burj Khalifa', 'Palm Jumeirah', 'Desert Safari', 'Dubai Mall', 'Gold Souk'],
  ARRAY['Visit Burj Khalifa observation deck', 'Desert safari with dune bashing', 'Shop at Dubai Mall', 'Explore Gold and Spice Souks', 'Cruise Dubai Creek'],
  4, 8, 150, 500, 'October to April', 25.2048, 55.2708, 4.6, TRUE, TRUE
),
(
  'Prague', 'Bohemia', 'Czech Republic', 'Europe',
  'A fairy-tale city of medieval architecture, cobblestone streets, astronomical clocks, and excellent Czech beer culture.',
  'Prague is one of Europe''s most beautifully preserved medieval cities. The Czech capital boasts an extraordinary collection of Gothic, Baroque, and Art Nouveau architecture, including the magnificent Prague Castle, the famous Charles Bridge, and the charming Old Town Square with its astronomical clock.',
  ARRAY['culture', 'historical', 'city', 'nightlife', 'food'],
  'https://images.unsplash.com/photo-1509870641843-fbce37ad6da8?w=800&q=80',
  ARRAY['Prague Castle', 'Charles Bridge', 'Old Town Square', 'Astronomical Clock', 'Josefov Jewish Quarter'],
  ARRAY['Walk Charles Bridge at dawn', 'Explore Prague Castle', 'Watch the Astronomical Clock', 'Try svíčková in a local pub', 'Day trip to Cesky Krumlov'],
  4, 7, 60, 150, 'March to May or September to November', 50.0755, 14.4378, 4.7, FALSE, TRUE
),
(
  'Marrakech', 'Haouz', 'Morocco', 'Africa',
  'A sensory explosion of souks, spice markets, ornate palaces, traditional riads, and the magical Djemaa el-Fna square.',
  'Marrakech is Morocco''s most vibrant city, a medieval medina city that assaults the senses in the most wonderful way. The famous Djemaa el-Fna square transforms from a daytime market to a nighttime circus of storytellers, musicians, and food stalls. The narrow souks offer everything from hand-hammered copper lanterns to handwoven carpets.',
  ARRAY['culture', 'historical', 'food', 'shopping', 'adventure'],
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
  ARRAY['Djemaa el-Fna Square', 'Majorelle Garden', 'Bahia Palace', 'Medina Souks', 'Atlas Mountains Day Trip'],
  ARRAY['Get lost in the medina souks', 'Visit Jardin Majorelle', 'Watch sunset over Djemaa el-Fna', 'Take a cooking class', 'Day trip to Atlas Mountains'],
  4, 8, 50, 150, 'March to May or September to November', 31.6295, -7.9811, 4.6, FALSE, TRUE
),
(
  'Costa Rica', 'Guanacaste & Arenal', 'Costa Rica', 'North America',
  'Pura Vida in nature''s paradise — rainforests, volcanoes, wildlife, and two coastlines of extraordinary biodiversity.',
  'Costa Rica is a biodiversity hotspot where adventure and nature intertwine seamlessly. The country packs an extraordinary range of ecosystems — cloud forests, mangroves, rainforests, and volcanoes — into a relatively small area. Home to 5% of the world''s biodiversity, Costa Rica offers incredible wildlife experiences alongside thrilling adventure activities.',
  ARRAY['nature', 'adventure', 'wildlife', 'beach', 'eco-tourism'],
  'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80',
  ARRAY['Arenal Volcano', 'Manuel Antonio Beach', 'Monteverde Cloud Forest', 'Tortuguero National Park', 'Zip-lining'],
  ARRAY['Zip-line through rainforest canopy', 'Soak in Arenal hot springs', 'Spot wildlife at Tortuguero', 'Surf on Pacific coast', 'Watch sea turtles nest'],
  8, 14, 80, 200, 'December to April (dry season)', 9.7489, -83.7534, 4.7, FALSE, TRUE
),
(
  'Swiss Alps', 'Bernese Oberland', 'Switzerland', 'Europe',
  'The iconic alpine landscape of snow-capped peaks, crystal-clear lakes, charming villages, and world-class skiing and hiking.',
  'The Swiss Alps represent the quintessential mountain experience, with soaring peaks including the Matterhorn, Eiger, and Jungfrau creating one of Europe''s most dramatic landscapes. Whether you''re skiing in Zermatt, hiking in Grindelwald, or sailing on Lake Lucerne, Switzerland delivers picture-perfect alpine scenery at every turn.',
  ARRAY['mountain', 'adventure', 'nature', 'skiing', 'scenic'],
  'https://images.unsplash.com/photo-1531210483974-4f8c1f33fd35?w=800&q=80',
  ARRAY['Jungfraujoch', 'Matterhorn Views', 'Grindelwald Hiking', 'Lake Lucerne', 'Zermatt Village'],
  ARRAY['Take cogwheel train to Jungfraujoch', 'Ski Zermatt under Matterhorn', 'Hike Bernese Oberland trails', 'Boat on Lake Lucerne', 'Visit Grindelwald First'],
  7, 14, 200, 600, 'December to March (skiing), June to September (hiking)', 46.5584, 7.9080, 4.8, TRUE, TRUE
),
(
  'Rio de Janeiro', 'Rio de Janeiro State', 'Brazil', 'South America',
  'The Marvelous City — spectacular beaches, samba rhythms, Christ the Redeemer, and breathtaking Sugarloaf Mountain.',
  'Rio de Janeiro is one of the world''s most visually stunning cities, where dramatic mountains meet golden beaches along an extraordinary 90km of Atlantic coastline. The city pulses with energy through its famous samba culture, dazzling Carnival celebration, and the legendary beaches of Copacabana and Ipanema.',
  ARRAY['beach', 'culture', 'city', 'nightlife', 'scenic'],
  'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  ARRAY['Christ the Redeemer', 'Sugarloaf Mountain', 'Copacabana Beach', 'Carnival (February)', 'Santa Teresa Neighborhood'],
  ARRAY['Take cable car to Sugarloaf', 'Visit Christ the Redeemer at sunset', 'Relax at Ipanema beach', 'Explore Lapa arches', 'Take a favela community tour'],
  5, 10, 60, 200, 'December to March (Carnival season)', -22.9068, -43.1729, 4.7, FALSE, TRUE
),
(
  'Singapore', 'Singapore Island', 'Singapore', 'Asia',
  'A futuristic garden city that blends cutting-edge architecture with lush greenery, incredible food, and seamless efficiency.',
  'Singapore is a remarkable city-state that has transformed itself into one of Asia''s most sophisticated destinations. The city seamlessly blends futuristic architecture like the Gardens by the Bay supertrees with traditional neighborhoods like Chinatown and Little India, all connected by one of the world''s best public transport systems.',
  ARRAY['city', 'food', 'culture', 'shopping', 'modern'],
  'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  ARRAY['Gardens by the Bay', 'Marina Bay Sands', 'Hawker Centers', 'Sentosa Island', 'Clarke Quay'],
  ARRAY['Visit Gardens by the Bay at night', 'Sample hawker center food', 'Universal Studios Sentosa', 'Explore Chinatown', 'Watch F1 night race (if in season)'],
  4, 7, 100, 300, 'February to April', 1.3521, 103.8198, 4.7, FALSE, TRUE
);

