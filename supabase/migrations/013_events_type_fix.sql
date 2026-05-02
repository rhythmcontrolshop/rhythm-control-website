-- Migration 013: Fix events type constraint
--
-- The frontend uses types: dj_set, live, session, all_night, release_party, in_store, other
-- The original constraint only allowed: dj_set, live, release_party, in_store, other
-- Add: session, all_night

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('dj_set', 'live', 'session', 'all_night', 'release_party', 'in_store', 'other'));
