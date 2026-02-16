-- ============================================
-- STORAGE POLICIES FOR LOGOS
-- ============================================

-- 1. Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public Access to view logos
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'logos');

-- 3. Allow Authenticated Users to upload logos
CREATE POLICY "Authenticated Users Can Upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'logos' 
        AND auth.role() = 'authenticated'
    );

-- 4. Allow Authenticated Users to update their own logos
CREATE POLICY "Authenticated Users Can Update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'logos' 
        AND auth.role() = 'authenticated'
    );

-- 5. Allow Authenticated Users to delete their own logos
CREATE POLICY "Authenticated Users Can Delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'logos' 
        AND auth.role() = 'authenticated'
    );
