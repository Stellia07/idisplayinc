-- Optional: confirms the setup worked. A fresh setup shows 4 projects, 6 services, 1 admin.
select 'projects' as what, count(*) from public.projects
union all select 'services', count(*) from public.services
union all select 'admins', count(*) from public.admins;
