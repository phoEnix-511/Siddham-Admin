-- 1. Ensure existing categories are marked as standard categories (isConcern = false)
UPDATE "Category"
SET "isConcern" = false;

-- 2. Insert or update the 15 latest concerns to have isConcern = true
INSERT INTO "Category" (id, name, slug, description, "isConcern", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Brain Wellness', 'brain-wellness', 'Brain wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Cardiac Wellness', 'cardiac-wellness', 'Cardiac wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Daily Wellness', 'daily-wellness', 'Daily wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Diabetic Wellness', 'diabetic-wellness', 'Diabetic wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Digestive Wellness', 'digestive-wellness', 'Digestive wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Hair Wellness', 'hair-wellness', 'Hair wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Immunity Wellness', 'immunity-wellness', 'Immunity wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Kidney Wellness', 'kidney-wellness', 'Kidney wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Liver Wellness', 'liver-wellness', 'Liver wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Men''s Wellness', 'mens-wellness', 'Men wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Pain Reliever', 'pain-reliever', 'Pain relief support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Skin Wellness', 'skin-wellness', 'Skin wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Stamina Booster', 'stamina-booster', 'Stamina support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Women''s Wellness', 'womens-wellness', 'Women wellness support', true, NOW(), NOW()),
  (gen_random_uuid(), 'Blood Purify', 'blood-purify', 'Blood purification support', true, NOW(), NOW())
ON CONFLICT (slug) 
DO UPDATE SET 
  "isConcern" = true,
  "description" = EXCLUDED.description,
  "updatedAt" = NOW();
