-- Optional bottle-image reference (R2 object key), set via the image upload
-- route. NULL when no image has been uploaded for this Pour.
ALTER TABLE pours ADD COLUMN image_key TEXT;
