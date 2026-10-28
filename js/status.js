(function () {
  var out = document.getElementById('out'), P = window.ProjectStore;
  function row(ok, title, hint) {
    var d = document.createElement('div'); d.className = 'r';
    var b = document.createElement('b'); b.className = ok ? 'ok' : 'no'; b.textContent = ok ? '✓' : '✗';
    var t = document.createElement('div'); t.textContent = title;
    if (hint) { var h = document.createElement('div'); h.className = 'hn'; h.textContent = hint; t.appendChild(h); }
    d.appendChild(b); d.appendChild(t); out.appendChild(d);
  }
  function why(e) {
    var m = String((e && e.message) || e);
    if (/does not exist|schema cache|PGRST205|42P01/i.test(m)) return m + ' → The table is missing. Run supabase/setup.sql once in the Supabase SQL Editor.';
    if (/Invalid API key|JWT|apikey|401/i.test(m)) return m + ' → The key in js/config.js looks wrong. Use the publishable key (sb_publishable_...) or the legacy anon key, never the secret key.';
    if (/Failed to fetch|NetworkError|did not answer/i.test(m)) return m + ' → The URL in js/config.js may be wrong, or you are offline. It should look like https://abcdxyz.supabase.co';
    if (/permission denied|row-level|42501/i.test(m)) return m + ' → Access rules are missing. Run supabase/setup.sql.';
    return m;
  }
  if (!P) { row(false, 'Site scripts did not load', 'js/store.js is missing or has an error. Open the browser console (F12) to see it.'); return; }
  row(P.configured, P.configured ? 'js/config.js has a URL and key' : 'js/config.js is empty', P.configured ? 'Project: ' + P.host : 'Paste your Project URL and publishable key into js/config.js.');
  if (!P.configured) return;
  row(!!window.supabase, window.supabase ? 'Supabase script loaded' : 'Supabase script did not load', window.supabase ? '' : 'Check your internet connection.');
  row(P.mode === 'cloud', P.mode === 'cloud' ? 'Connected in cloud mode' : 'Not in cloud mode', P.initError);
  if (P.mode !== 'cloud') return;
  function test(name, fn, fmt) {
    return P.withTimeout(fn(), 10000).then(function (v) { row(true, name, fmt ? fmt(v) : ''); }, function (e) { row(false, name + ' failed', why(e)); });
  }
  test('Read projects', function () { return P.list(); }, function (l) { return l.length + ' project(s) found. (Expected 4 on a fresh setup.)'; })
    .then(function () { return test('Read services', function () { return ServiceStore.list(); }, function (l) { return l.length + ' service(s) found. (Expected 6 on a fresh setup.)'; }); })
    .then(function () { return test('Read site settings', function () { return SettingsStore.get('hero'); }, function (v) { return v ? 'Custom home photos are set.' : 'No custom home photos yet (this is normal).'; }); })
    .then(function () { return P.user(); }).then(function (u) { row(true, u ? 'Signed in as ' + u.email : 'Not signed in', u ? '' : 'This is fine here. Sign in on admin.html to edit.'); }, function () {});
})();
