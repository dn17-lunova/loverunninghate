-- First-party signup report for Supabase SQL Editor (read-only).
-- Submissions are stored rows; unique addresses are deduplicated within each
-- day/source bucket, so do not sum those buckets for an all-time unique total.
-- Keep the authorized test address out of marketing totals.
select
  date_trunc('day', created_at at time zone 'UTC') as day_utc,
  source as form_source,
  count(*) as confirmed_submissions,
  count(distinct lower(trim(email))) as unique_addresses
from public.subscribers
where lower(trim(email)) <> 'fox@loverunninghate.com'
  and source is distinct from 'e2e-test'
group by 1, 2
order by 1 desc, 2;
