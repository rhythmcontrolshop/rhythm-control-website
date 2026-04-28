-- Migration 012: Full-text search function for releases
--
-- search_release_ids(search_query text, filter_status text DEFAULT 'active')
-- Searches across: title, artists[], labels[], catno, country, format, condition
-- Uses case-insensitive ILIKE matching.
-- Works with text arrays via unnest for partial matches.

CREATE OR REPLACE FUNCTION search_release_ids(
  search_query text,
  filter_status text DEFAULT 'active'
)
RETURNS SETOF uuid
LANGUAGE sql STABLE
AS $$
  SELECT id FROM releases
  WHERE (
    -- If filter_status is 'all', search across all statuses
    filter_status = 'all'
    OR status = filter_status
  )
  AND (
    -- Text columns: simple ILIKE
    title ILIKE '%' || search_query || '%'
    OR catno ILIKE '%' || search_query || '%'
    OR country ILIKE '%' || search_query || '%'
    OR format ILIKE '%' || search_query || '%'
    OR condition ILIKE '%' || search_query || '%'
    OR barcode ILIKE '%' || search_query || '%'
    -- Array columns: unnest + ILIKE for partial match within each element
    OR EXISTS (SELECT 1 FROM unnest(artists) a WHERE a ILIKE '%' || search_query || '%')
    OR EXISTS (SELECT 1 FROM unnest(labels)  l WHERE l ILIKE '%' || search_query || '%')
    OR EXISTS (SELECT 1 FROM unnest(genres)  g WHERE g ILIKE '%' || search_query || '%')
    OR EXISTS (SELECT 1 FROM unnest(styles)  s WHERE s ILIKE '%' || search_query || '%')
  )
$$;
