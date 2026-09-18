-- =====================================================================
-- Seed / test data for petory (ERD_V1_4_3.sql schema)
-- FOR TESTING ONLY: passwords below are stored in PLAIN TEXT as
-- instructed, and must be replaced with hashed values before this
-- data (or anything like it) is used against a real deployment.
-- Run this after ERD_V1_4_3.sql has created the schema.
-- =====================================================================

-- acc_reports: 4 report reasons
INSERT INTO "acc_reports" ("report") VALUES
('Harassment'),
('Spam'),
('Fake Account'),
('Inappropriate Behavior');

-- species: Dog, Cat
INSERT INTO "species" ("spec") VALUES
('Dog'),
('Cat');

-- sexes: Male, Female
INSERT INTO "sexes" ("sex") VALUES
('Male'),
('Female');

-- sizes: Small, Medium, Large
INSERT INTO "sizes" ("size") VALUES
('Small'),
('Medium'),
('Large');

-- cha: 5 pet characteristics
INSERT INTO "cha" ("cha") VALUES
('Playful'),
('Friendly'),
('Calm'),
('Energetic'),
('Shy');

-- x_post_topics: Recipe, Pet Friendly, Clinic
INSERT INTO "x_post_topics" ("topic") VALUES
('Recipe'),
('Pet Friendly'),
('Clinic');

-- provinces: all 77 provinces of Thailand, point = capital city
-- coordinates (approximate, WGS84 / SRID 4326), for distance-based matching
INSERT INTO "provinces" ("prov", "point") VALUES
('Bangkok', ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326)),
('Samut Prakan', ST_SetSRID(ST_MakePoint(100.5998, 13.5991), 4326)),
('Nonthaburi', ST_SetSRID(ST_MakePoint(100.5144, 13.8622), 4326)),
('Pathum Thani', ST_SetSRID(ST_MakePoint(100.525, 14.0208), 4326)),
('Phra Nakhon Si Ayutthaya', ST_SetSRID(ST_MakePoint(100.5648, 14.3532), 4326)),
('Ang Thong', ST_SetSRID(ST_MakePoint(100.4547, 14.5896), 4326)),
('Lop Buri', ST_SetSRID(ST_MakePoint(100.6534, 14.7995), 4326)),
('Sing Buri', ST_SetSRID(ST_MakePoint(100.3968, 14.8907), 4326)),
('Chai Nat', ST_SetSRID(ST_MakePoint(100.1251, 15.1851), 4326)),
('Saraburi', ST_SetSRID(ST_MakePoint(100.9101, 14.5289), 4326)),
('Chon Buri', ST_SetSRID(ST_MakePoint(100.9847, 13.3611), 4326)),
('Rayong', ST_SetSRID(ST_MakePoint(101.2372, 12.6833), 4326)),
('Chanthaburi', ST_SetSRID(ST_MakePoint(102.1038, 12.6112), 4326)),
('Trat', ST_SetSRID(ST_MakePoint(102.5178, 12.2428), 4326)),
('Chachoengsao', ST_SetSRID(ST_MakePoint(101.0779, 13.6904), 4326)),
('Prachin Buri', ST_SetSRID(ST_MakePoint(101.366, 14.0509), 4326)),
('Nakhon Nayok', ST_SetSRID(ST_MakePoint(101.213, 14.2069), 4326)),
('Sa Kaeo', ST_SetSRID(ST_MakePoint(102.0645, 13.8241), 4326)),
('Nakhon Ratchasima', ST_SetSRID(ST_MakePoint(102.0978, 14.9799), 4326)),
('Buri Ram', ST_SetSRID(ST_MakePoint(103.1029, 14.993), 4326)),
('Surin', ST_SetSRID(ST_MakePoint(103.4936, 14.8828), 4326)),
('Si Sa Ket', ST_SetSRID(ST_MakePoint(104.322, 15.1185), 4326)),
('Ubon Ratchathani', ST_SetSRID(ST_MakePoint(104.859, 15.2287), 4326)),
('Yasothon', ST_SetSRID(ST_MakePoint(104.145, 15.792), 4326)),
('Chaiyaphum', ST_SetSRID(ST_MakePoint(102.0316, 15.8068), 4326)),
('Amnat Charoen', ST_SetSRID(ST_MakePoint(104.6258, 15.8656), 4326)),
('Bueng Kan', ST_SetSRID(ST_MakePoint(103.6465, 18.3609), 4326)),
('Nong Bua Lam Phu', ST_SetSRID(ST_MakePoint(102.426, 17.2216), 4326)),
('Khon Kaen', ST_SetSRID(ST_MakePoint(102.836, 16.4419), 4326)),
('Udon Thani', ST_SetSRID(ST_MakePoint(102.7859, 17.4139), 4326)),
('Loei', ST_SetSRID(ST_MakePoint(101.7223, 17.486), 4326)),
('Nong Khai', ST_SetSRID(ST_MakePoint(102.742, 17.8783), 4326)),
('Maha Sarakham', ST_SetSRID(ST_MakePoint(103.3, 16.185), 4326)),
('Roi Et', ST_SetSRID(ST_MakePoint(103.652, 16.0566), 4326)),
('Kalasin', ST_SetSRID(ST_MakePoint(103.506, 16.4315), 4326)),
('Sakon Nakhon', ST_SetSRID(ST_MakePoint(104.1487, 17.1545), 4326)),
('Nakhon Phanom', ST_SetSRID(ST_MakePoint(104.7797, 17.4088), 4326)),
('Mukdahan', ST_SetSRID(ST_MakePoint(104.7233, 16.545), 4326)),
('Chiang Mai', ST_SetSRID(ST_MakePoint(98.9853, 18.7883), 4326)),
('Lamphun', ST_SetSRID(ST_MakePoint(99.0087, 18.5744), 4326)),
('Lampang', ST_SetSRID(ST_MakePoint(99.493, 18.2926), 4326)),
('Uttaradit', ST_SetSRID(ST_MakePoint(100.0993, 17.62), 4326)),
('Phrae', ST_SetSRID(ST_MakePoint(100.1403, 18.1445), 4326)),
('Nan', ST_SetSRID(ST_MakePoint(100.773, 18.7756), 4326)),
('Phayao', ST_SetSRID(ST_MakePoint(99.9018, 19.1664), 4326)),
('Chiang Rai', ST_SetSRID(ST_MakePoint(99.8406, 19.9105), 4326)),
('Mae Hong Son', ST_SetSRID(ST_MakePoint(97.9654, 19.302), 4326)),
('Nakhon Sawan', ST_SetSRID(ST_MakePoint(100.1372, 15.7047), 4326)),
('Uthai Thani', ST_SetSRID(ST_MakePoint(100.0248, 15.3835), 4326)),
('Kamphaeng Phet', ST_SetSRID(ST_MakePoint(99.5226, 16.4827), 4326)),
('Tak', ST_SetSRID(ST_MakePoint(99.1258, 16.884), 4326)),
('Sukhothai', ST_SetSRID(ST_MakePoint(99.8264, 17.0068), 4326)),
('Phitsanulok', ST_SetSRID(ST_MakePoint(100.2659, 16.8211), 4326)),
('Phichit', ST_SetSRID(ST_MakePoint(100.3487, 16.4382), 4326)),
('Phetchabun', ST_SetSRID(ST_MakePoint(101.1591, 16.4194), 4326)),
('Ratchaburi', ST_SetSRID(ST_MakePoint(99.8134, 13.5282), 4326)),
('Kanchanaburi', ST_SetSRID(ST_MakePoint(99.5328, 14.0022), 4326)),
('Suphan Buri', ST_SetSRID(ST_MakePoint(100.1177, 14.4744), 4326)),
('Nakhon Pathom', ST_SetSRID(ST_MakePoint(100.0623, 13.8199), 4326)),
('Samut Sakhon', ST_SetSRID(ST_MakePoint(100.2745, 13.5475), 4326)),
('Samut Songkhram', ST_SetSRID(ST_MakePoint(100.0022, 13.4098), 4326)),
('Phetchaburi', ST_SetSRID(ST_MakePoint(99.9391, 13.1111), 4326)),
('Prachuap Khiri Khan', ST_SetSRID(ST_MakePoint(99.7957, 11.8125), 4326)),
('Nakhon Si Thammarat', ST_SetSRID(ST_MakePoint(99.9631, 8.4304), 4326)),
('Krabi', ST_SetSRID(ST_MakePoint(98.9063, 8.0863), 4326)),
('Phang Nga', ST_SetSRID(ST_MakePoint(98.5296, 8.4509), 4326)),
('Phuket', ST_SetSRID(ST_MakePoint(98.3923, 7.8804), 4326)),
('Surat Thani', ST_SetSRID(ST_MakePoint(99.3215, 9.1382), 4326)),
('Ranong', ST_SetSRID(ST_MakePoint(98.6084, 9.9528), 4326)),
('Chumphon', ST_SetSRID(ST_MakePoint(99.18, 10.493), 4326)),
('Songkhla', ST_SetSRID(ST_MakePoint(100.5951, 7.1897), 4326)),
('Satun', ST_SetSRID(ST_MakePoint(100.0674, 6.6238), 4326)),
('Trang', ST_SetSRID(ST_MakePoint(99.6239, 7.5645), 4326)),
('Phatthalung', ST_SetSRID(ST_MakePoint(100.074, 7.6167), 4326)),
('Pattani', ST_SetSRID(ST_MakePoint(101.2504, 6.8697), 4326)),
('Yala', ST_SetSRID(ST_MakePoint(101.2801, 6.5411), 4326)),
('Narathiwat', ST_SetSRID(ST_MakePoint(101.8253, 6.4264), 4326));

-- breeds: at least 5 per species (spec_id 1 = Dog, 2 = Cat)
INSERT INTO "breeds" ("spec_id", "breed") VALUES
(1, 'Golden Retriever'),
(1, 'Labrador Retriever'),
(1, 'Poodle'),
(1, 'Shih Tzu'),
(1, 'Thai Bangkaew Dog'),
(2, 'Persian'),
(2, 'Siamese'),
(2, 'British Shorthair'),
(2, 'Scottish Fold'),
(2, 'Thai (Wichian Mat)');

-- acc: 5 test accounts
-- NOTE: pwd values are plain text placeholders for testing only, per instruction.
INSERT INTO "acc" ("name", "email", "pwd", "date", "pict", "phone", "prov_id", "about") VALUES
('Nina Suwannarat', 'nina.s@example.com', 'testpass1', '2025-01-10 09:15:00+07', 'https://cdn.petory.app/acc/1.jpg', '0891234501', 1, 'Cat mom based in Bangkok, loves weekend cafe hopping with my cat.'),
('Ekkarat Boonmee', 'ekkarat.b@example.com', 'testpass2', '2025-02-14 14:32:00+07', 'https://cdn.petory.app/acc/2.jpg', '0891234502', 39, 'Dog owner in Chiang Mai, into hiking trails with pets.'),
('Patcharin Wongsakul', 'patcharin.w@example.com', 'testpass3', '2025-03-02 11:05:00+07', 'https://cdn.petory.app/acc/3.jpg', '0891234503', 11, 'Living in Chon Buri, run a small pet-sitting side gig.'),
('Thanawat Chaisiri', 'thanawat.c@example.com', 'testpass4', '2025-04-20 18:47:00+07', 'https://cdn.petory.app/acc/4.jpg', '0891234504', 67, 'Phuket-based, two rescue dogs, always posting recipe ideas.'),
('Sirinya Kittikorn', 'sirinya.k@example.com', 'testpass5', '2025-05-05 08:00:00+07', 'https://cdn.petory.app/acc/5.jpg', '0891234505', 71, 'Songkhla, cat breeder, active in the community for clinic recommendations.');

-- pet_pro: 3 pet profiles
INSERT INTO "pet_pro" ("pict", "name", "spec_id", "sex_id", "size_id", "breed_id", "age", "about", "acc_id") VALUES
('https://cdn.petory.app/pets/1.jpg', 'Mochi', 2, 2, 1, 8, 2, 'A curious Scottish Fold who loves sunbathing on the balcony.', 1),
('https://cdn.petory.app/pets/2.jpg', 'Rocky', 1, 1, 2, 1, 3, 'Energetic Golden Retriever, loves trail walks in Chiang Mai.', 2),
('https://cdn.petory.app/pets/3.jpg', 'Luna', 1, 2, 3, 5, 4, 'Gentle Thai Bangkaew Dog, great with kids.', 4);

-- pet_cha: 5 characteristic tags across the 3 pets
INSERT INTO "pet_cha" ("pet_id", "cha_id") VALUES
(1, 3),
(1, 5),
(2, 1),
(2, 4),
(3, 2);

-- h_post: 5 home-page posts
INSERT INTO "h_post" ("pict", "cont", "pet_id", "acc_id", "date") VALUES
('https://cdn.petory.app/h_post/1.jpg', 'Mochi discovered the sunniest spot on the balcony today.', 1, 1, '2025-06-01 10:20:00+07'),
('https://cdn.petory.app/h_post/2.jpg', 'Rocky finished his first 5km trail run like a champ!', 2, 2, '2025-06-03 07:45:00+07'),
('https://cdn.petory.app/h_post/3.jpg', 'Quiet Sunday morning with coffee and my cat.', NULL, 3, '2025-06-05 09:00:00+07'),
('https://cdn.petory.app/h_post/4.jpg', 'Luna made a new friend at the dog park today.', 3, 4, '2025-06-07 16:30:00+07'),
('https://cdn.petory.app/h_post/5.jpg', 'Just adopted a new kitten, meet the newest member of the family soon!', NULL, 5, '2025-06-09 12:10:00+07');

-- x_post: 5 explore-page posts
INSERT INTO "x_post" ("pict", "title", "cont", "pet_id", "topic_id", "spec_id", "acc_id", "date") VALUES
('https://cdn.petory.app/x_post/1.jpg', 'Homemade chicken and pumpkin dog treats', 'A simple 3-ingredient recipe my dogs go crazy for.', 2, 1, 1, 4, '2025-06-02 13:00:00+07'),
('https://cdn.petory.app/x_post/2.jpg', 'Best pet-friendly cafes in Chiang Mai', 'Rounded up 5 cafes that actually welcome dogs inside, not just the patio.', NULL, 2, NULL, 2, '2025-06-04 15:20:00+07'),
('https://cdn.petory.app/x_post/3.jpg', 'How to spot a good vet clinic', 'A checklist I use before trying a new clinic for my cats.', NULL, 3, 2, 5, '2025-06-06 10:40:00+07'),
('https://cdn.petory.app/x_post/4.jpg', 'Raw diet basics for cats', 'What I wish I knew before switching my cat to a raw diet.', 1, 1, 2, 1, '2025-06-08 09:10:00+07'),
('https://cdn.petory.app/x_post/5.jpg', 'Dog parks worth the drive in Chon Buri', 'Mapped out three parks with shade and water stations.', 3, 2, 1, 3, '2025-06-10 17:55:00+07');