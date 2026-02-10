-- 1. Deduplicate stores: Keep only the most recently created store for each user
DELETE FROM stores
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rnum
    FROM stores
  ) t
  WHERE t.rnum > 1
);

-- 2. Add Unique Constraint to prevent future duplicates
ALTER TABLE stores ADD CONSTRAINT stores_user_id_unique UNIQUE (user_id);
