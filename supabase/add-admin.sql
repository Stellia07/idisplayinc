-- Give another person admin access (they must also exist under Authentication > Users).
-- Replace the email, then Run.
insert into public.admins (email) values (lower('PUT-THE-EMAIL-HERE')) on conflict do nothing;

-- To remove an admin instead:
-- delete from public.admins where email = lower('PUT-THE-EMAIL-HERE');
