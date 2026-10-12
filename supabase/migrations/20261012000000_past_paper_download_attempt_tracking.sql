-- Additive tracking for past-paper download-link attempts.
-- A link_issued event is not proof that a browser completed saving the file.
create table if not exists public.past_paper_download_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id uuid null references public.past_papers(id) on delete set null,
  paper_title text,
  status text not null check (status in ('link_issued', 'premium_blocked', 'request_failed', 'network_error')),
  reason text,
  client_reported boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists past_paper_download_attempts_user_created_idx
  on public.past_paper_download_attempts (user_id, created_at desc);

alter table public.past_paper_download_attempts enable row level security;

comment on table public.past_paper_download_attempts is
  'Audit trail for user-reported past-paper download attempts. link_issued means a signed link was issued, not that the browser finished saving the PDF.';
