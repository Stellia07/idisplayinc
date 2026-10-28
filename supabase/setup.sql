-- =====================================================================
--  IDisplay website database: run this ONCE on a NEW Supabase project.
--  Supabase dashboard > SQL Editor > New query > paste everything > Run.
--  It is safe to run again later (it will not duplicate your data).
-- =====================================================================

-- STEP 1 (the only line you must edit): the email you will sign in with on admin.html.
-- It must be the SAME email as the user you create under Authentication > Users.
do $$
declare admin_email text := 'PUT-YOUR-ADMIN-EMAIL-HERE';
begin
  if admin_email like 'PUT-YOUR%' or admin_email not like '%@%' then
    raise exception 'Please replace PUT-YOUR-ADMIN-EMAIL-HERE with your real admin email (line above), then run again.';
  end if;
  create table if not exists public.admins (email text primary key);
  insert into public.admins (email) values (lower(admin_email)) on conflict do nothing;
end $$;

-- Admin list: nobody can read or change it through the website.
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Is the person making this request an admin? (used by every write rule below)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins a where a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- STEP 2: tables
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cat text not null,
  client text,
  client_logo text,
  place text,
  description text,
  img text not null,
  alt text,
  gallery jsonb not null default '[]'::jsonb,
  video text,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  description text,
  features text,
  img text,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- STEP 3: access rules. Everyone can read. Only admins can add, change or delete.
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "public read projects" on public.projects;
drop policy if exists "admin write projects" on public.projects;
create policy "public read projects" on public.projects for select using (true);
create policy "admin write projects" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read services" on public.services;
drop policy if exists "admin write services" on public.services;
create policy "public read services" on public.services for select using (true);
create policy "admin write services" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read settings" on public.site_settings;
drop policy if exists "admin write settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
create policy "admin write settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.projects, public.services, public.site_settings to anon, authenticated;
grant insert, update, delete on public.projects, public.services, public.site_settings to authenticated;

-- STEP 4: photo and video storage (public to view, admin-only to upload or delete)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('project-images', 'project-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('project-videos', 'project-videos', true, null, array['video/mp4','video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin upload media" on storage.objects;
drop policy if exists "admin update media" on storage.objects;
drop policy if exists "admin delete media" on storage.objects;
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id in ('project-images','project-videos') and public.is_admin());
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id in ('project-images','project-videos') and public.is_admin());
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id in ('project-images','project-videos') and public.is_admin());

-- STEP 5: starter content (only added when the tables are empty)
insert into public.projects (title, cat, place, description, img, alt, sort, client)
select * from (values
  ('Timber arch trade show stand', 'Custom exhibits', 'Convention hall', 'A two-level island stand with curved timber ribs, an upper meeting deck, integrated LED edge lighting and a central reception desk.', 'images/image1.jpg', 'Timber-framed exhibition stand with a lit logo wall', 1, 'Evolve Innovations'),
  ('Mall tech festival zone', 'Promotional events', 'Shopping mall atrium', 'A hanging LED sign, a branded tower and themed counters for gaming, creative and lifestyle zones, built to run through busy weekend crowds.', 'images/image2.jpg', 'Mall activation with LED signage and counters', 2, 'Innovate 24'),
  ('Large-format print workshop', 'Graphic displays', 'Our production floor', 'UV flatbed and roll-to-roll printing, finishing tables and a rack of finished banners, all produced in-house.', 'images/image3.jpg', 'Print workshop with a UV flatbed printer', 3, 'Global Innovation Summit'),
  ('Premium accessories boutique', 'Permanent displays & shop fittings', 'Retail store', 'Walnut-toned joinery, backlit shelves, glass display cases and a polished concrete floor for a store selling bags, watches and clothing.', 'images/image4.jpg', 'Retail store interior with timber shelving', 4, 'Client name')
) as v(title, cat, place, description, img, alt, sort, client)
where not exists (select 1 from public.projects);

insert into public.services (title, summary, description, features, img, sort)
select * from (values
  ('Custom exhibits', 'Custom-built exhibit booths for trade shows and expos.', 'We design and build custom exhibit booths that put your brand at the center of the show floor. From the first concept to installation, every booth is tailored to your needs and objectives.

With in-house design and production capabilities, we keep full control of quality while staying flexible and responsive.', 'Custom-built exhibit booths
Conceptual design and planning
In-house fabrication
Installation and post-event support', 'images/image1.jpg', 1),
  ('Kiosks', 'Branded kiosks that put your products and information within reach.', 'Kiosks give your brand a compact, eye-catching presence in malls, events and retail spaces. We build them to reflect your brand identity and goals.

We combine creativity with durability and cost-efficiency, so your kiosk looks great and holds up.', 'Designed around your brand identity
Durable, cost-efficient construction
Built in-house with full quality control', '', 2),
  ('Promotional events', 'Roadshows and promotional installations that draw a crowd.', 'From roadshows to promotional installations, we create event spaces that engage, inspire, and connect meaningfully with your audience.

We handle the planning, fabrication and installation, and support you after the event, anywhere our services are needed.', 'Roadshows
Promotional installations
Installation anywhere our services are needed
Post-event support', 'images/image2.jpg', 3),
  ('Permanent displays & shop fittings', 'Retail displays and fittings built with craftsmanship.', 'We design and produce permanent displays and shop fittings that present your products at their best, built with craftsmanship and durability in mind.

Every piece is tailored to your brand and your space.', 'Retail displays
Shop fittings
Craftsmanship and durability
Tailored to your brand and space', 'images/image4.jpg', 4),
  ('Commercial interior design & architecture', 'Commercial interiors designed and delivered end to end.', 'We plan and deliver commercial interiors that reflect each client’s brand identity and goals, from conceptual design and planning to fabrication and installation.

Our end-to-end process is tailored to your needs and objectives.', 'Conceptual design and planning
In-house fabrication
Installation
Tailored to each client’s needs and objectives', '', 5),
  ('Graphic displays', 'Visually compelling graphics that help your brand stand out.', 'Our graphic displays present your message as visually compelling pieces that help brands stand out and connect meaningfully with their audience.

They are produced with our in-house capabilities, so we keep full quality control from design to finish.', 'Visually compelling graphics
In-house production
Full quality control', 'images/image3.jpg', 6)
) as v(title, summary, description, features, img, sort)
where not exists (select 1 from public.services);
