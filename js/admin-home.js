(function () {
  var P = ProjectStore, H = SettingsStore, $ = function (i) { return document.getElementById(i); };
  var ready = false;
  function say(t, bad) { var m = $('hmsg'); m.textContent = t; m.className = bad ? 'err' : 'ok'; }
  function save(items) {
    if (!ready) return; say('Saving…');
    (items.length ? H.set('hero', { images: items }) : H.remove('hero')).then(function () {
      say(items.length ? 'Saved. The home page now uses these photos.' : 'Saved. The home page uses its default photo.');
    }).catch(function (e) { say('Could not save: ' + AdminHelp.msg(e), true); });
  }
  var list = ImageList($('hero-list'), { max: 8, onChange: save });
  $('hero-reset').onclick = function () { list.set([]); save([]); };
  if (P.mode === 'local') $('hnote').textContent = 'Local mode: changes only show in this browser. Connect Supabase to change the live site.';
  document.addEventListener('admin:ready', function () {
    H.get('hero').then(function (v) { list.set((v && v.images) || []); ready = true; })
      .catch(function (e) { say('Could not load: ' + e.message, true); ready = true; });
  });
})();
