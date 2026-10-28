# IDisplay website: setup guide

The site works as it is in local test mode (no login, nothing saved online). To go live, connect it to a database.

## 1. Create the Supabase project (free)
1. Sign up at supabase.com with the company email and create a **new project** (choose the region closest to your customers, for example Singapore). Save the database password in a password manager.
2. Open **Authentication > Users > Add user**, create your admin user (email + a long, unique password) and tick "Auto confirm user". Remember the email: you need it in step 4.
3. Open **Authentication > Sign In / Providers** and turn **off** "Allow new users to sign up". Otherwise anyone could register.
4. Open **SQL Editor > New query**, paste all of `supabase/setup.sql`, **change the one line** `PUT-YOUR-ADMIN-EMAIL-HERE` to the admin email from step 2, and click **Run**. If you forget to change it, the script stops with a message and changes nothing. If the editor asks whether to enable Row Level Security, choose **Run and enable RLS** (the script turns it on anyway).
5. (Optional) Run `supabase/check.sql`. A fresh setup shows 4 projects, 6 services and 1 admin.
6. Open **Project Settings > API Keys** and copy the **Project URL** and the **publishable key** (starts with `sb_publishable_`) into `js/config.js`. Never use the secret key.

## 2. Test locally
1. Open `status.html`. Every line should show a tick.
2. Open `projects.html`. You should see the 4 starter projects.
3. Open `admin.html`, sign in, and try adding a project. The bar at the top should say "Signed in as" with your email.

## 3. Put the site online (free)
Cloudflare Pages: Workers & Pages > Create > Pages > Upload assets, then drag in the whole site folder (keep the `_headers` file in it). Delete `status.html` before launch.

## 4. Domain (later, paid)
Buy a .com at Cloudflare Registrar, then attach it under your Pages project's Custom domains.

## Admin
- Open `/admin.html` on your site (bookmark it). It is not linked from the website.
- To add another admin: create the user in Supabase, then run `supabase/add-admin.sql` with their email.
- "Not allowed to change this" errors mean the signed-in email is not in the admin list.

## Security checklist
1. Sign-ups are turned off (step 1.3) and only your own admin user exists.
2. Only the publishable key is in `js/config.js`. Never put the secret or service_role key in any file.
3. Keep `_headers` in the root of the uploaded folder. It adds browser protections.
4. Turn on two-step verification (an authenticator app) for Supabase, Cloudflare, the domain registrar and the company email. Use a password manager.
5. After launch, open `admin.html` signed out: you should only see the sign-in form, and nothing can be added.

## Keeping images and videos small
- Photos uploaded in the admin are shrunk automatically (max 1920 px, WebP when possible) and a small thumbnail is saved with each one.
- Videos cannot be shrunk in the browser. Compress them first with HandBrake (free): preset "Fast 1080p30", MP4, quality RF 24. Or use a YouTube/Vimeo link, which costs you no storage.
- Photos you put in the `images/` folder yourself: also add a smaller copy (about 800 px wide) with the same name in `images/thumbs/`.
