/* Small key/value settings (used for the home page background photos). */
(function () {
  var P = window.ProjectStore, sb = P.sb, cloud = P.mode === 'cloud', KEY = 'northbeam.settings.v1';
  function ok(r) { if (r.error) throw r.error; return r.data; }
  var local = {
    all: function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } },
    get: function (k) { return Promise.resolve(local.all()[k] || null); },
    set: function (k, v) {
      var a = local.all(); a[k] = v;
      try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { return Promise.reject(new Error('Browser storage is full. Try fewer or smaller photos.')); }
      return Promise.resolve();
    },
    remove: function (k) { var a = local.all(); delete a[k]; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} return Promise.resolve(); }
  };
  var remote = cloud && {
    get: function (k) { return sb.from('site_settings').select('value').eq('key', k).maybeSingle().then(ok).then(function (d) { return d ? d.value : null; }); },
    set: function (k, v) { return sb.from('site_settings').upsert({ key: k, value: v, updated_at: new Date().toISOString() }).then(ok); },
    remove: function (k) { return sb.from('site_settings').delete().eq('key', k).then(ok); }
  };
  window.SettingsStore = cloud ? remote : local;
})();
