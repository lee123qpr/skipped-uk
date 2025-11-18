-- Make environmental-certificates bucket public so certificates can be downloaded
UPDATE storage.buckets
SET public = true
WHERE id = 'environmental-certificates';
