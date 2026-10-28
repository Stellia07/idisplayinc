/* Data layer. Same API in two modes:
   - cloud: Supabase (when js/config.js is filled in)
   - local: this browser's localStorage (default, no setup needed)
   Every method returns a Promise. */
(function () {
  var C = window.NB_CONFIG || {};
  var configured = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY), initError = '';
  var cloud = configured && !!window.supabase, sb = null;
  if (configured && !window.supabase) initError = 'The Supabase script did not load (check your internet connection).';
  if (configured && !/^https:\/\//i.test(C.SUPABASE_URL)) { cloud = false; initError = 'SUPABASE_URL in js/config.js must be the Project URL (https://xxxx.supabase.co). It currently does not start with https:// (a key may have been pasted there).'; }
  if (cloud) { try { sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY); } catch (e) { cloud = false; initError = 'Could not start Supabase: ' + (e.message || e) + ' Check the URL and key in js/config.js.'; } }
  var BUCKET = 'project-images', KEY = 'northbeam.projects.v1';
  var SEED = [
    {id:'p1',client:'Evolve Innovations',cat:'Custom exhibits',title:'Timber arch trade show stand',place:'Convention hall',img:'images/image1.jpg',alt:'Timber-framed exhibition stand with a lit logo wall',desc:'A two-level island stand with curved timber ribs, an upper meeting deck, integrated LED edge lighting and a central reception desk.'},
    {id:'p2',client:'Innovate 24',cat:'Promotional events',title:'Mall tech festival zone',place:'Shopping mall atrium',img:'images/image2.jpg',alt:'Mall activation with LED signage and counters',desc:'A hanging LED sign, a branded tower and themed counters for gaming, creative and lifestyle zones, built to run through busy weekend crowds.'},
    {id:'p3',client:'Global Innovation Summit',cat:'Graphic displays',title:'Large-format print workshop',place:'Our production floor',img:'images/image3.jpg',alt:'Print workshop with a UV flatbed printer',desc:'UV flatbed and roll-to-roll printing, finishing tables and a rack of finished banners, all produced in-house.'},
    {id:'p4',client:'Client name',cat:'Permanent displays & shop fittings',title:'Premium accessories boutique',place:'Retail store',img:'images/image4.jpg',alt:'Retail store interior with timber shelving',desc:'Walnut-toned joinery, backlit shelves, glass display cases and a polished concrete floor for a store selling bags, watches and clothing.'}
  ];
  function ok(r) { if (r.error) throw r.error; return r.data; }

  var local = {
    load: function () {
      try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
      return JSON.parse(JSON.stringify(SEED));
    },
    save: function (l) {
      try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { throw new Error('Browser storage is full. Try a smaller image.'); }
    },
    list: function () { return Promise.resolve(local.load()); },
    create: function (p) { var l = local.load(); p.id = Date.now().toString(36); l.push(p); local.save(l); return Promise.resolve(); },
    update: function (id, p) {
      var l = local.load(), i = l.findIndex(function (x) { return x.id === id; });
      if (i >= 0) { for (var k in p) l[i][k] = p[k]; local.save(l); }
      return Promise.resolve();
    },
    remove: function (id) { local.save(local.load().filter(function (x) { return x.id !== id; })); return Promise.resolve(); },
    upload: function (blob, opts) {
      var T = window.ImageTools;
      return (T ? T.process(blob, opts).then(function (r) { return r.full; }) : Promise.resolve(blob)).then(function (b) {
        return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); });
      });
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} return Promise.resolve(); },
    uploadVideo: function () { return Promise.reject(new Error('Video upload needs the Supabase connection. Paste a YouTube or Vimeo link instead.')); },
    user: function () { return Promise.resolve({ email: 'local' }); },
    signIn: function () { return Promise.resolve(); },
    signOut: function () { return Promise.resolve(); }
  };

  function toApp(r) { return { id: r.id, title: r.title, cat: r.cat, client: r.client || '', clientLogo: r.client_logo || '', gallery: Array.isArray(r.gallery) ? r.gallery : [], video: r.video || '', place: r.place || '', desc: r.description || '', img: r.img, alt: r.alt || r.title }; }
  function toDb(p) { return { title: p.title, cat: p.cat, client: p.client, client_logo: p.clientLogo || '', gallery: p.gallery || [], video: p.video || '', place: p.place, description: p.desc, img: p.img, alt: p.alt }; }

  var remote = cloud && {
    list: function () {
      return sb.from('projects').select('*').order('sort').order('created_at').then(ok).then(function (d) { return d.map(toApp); });
    },
    create: function (p) { return sb.from('projects').insert(toDb(p)).then(ok); },
    update: function (id, p) { return sb.from('projects').update(toDb(p)).eq('id', id).then(ok); },
    remove: function (id) { return sb.from('projects').delete().eq('id', id).then(ok); },
    upload: function (blob, opts) {
      var T = window.ImageTools;
      var p = T ? T.process(blob, opts) : Promise.resolve({ full: blob, thumb: null, type: 'image/jpeg', ext: 'jpg' });
      return p.then(function (r) {
        var base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), name = base + '.' + r.ext;
        function put(n, b) { return sb.storage.from(BUCKET).upload(n, b, { contentType: r.type, cacheControl: '31536000' }).then(ok); }
        return put(name, r.full)
          .then(function () { return r.thumb ? put(base + '-t.' + r.ext, r.thumb).catch(function () {}) : null; })
          .then(function () { return sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl; });
      });
    },
    reset: function () { return Promise.resolve(); },
    uploadVideo: function (file) {
      var ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (ext !== 'mp4' && ext !== 'webm') return Promise.reject(new Error('Please use an MP4 or WebM video.'));
      var name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      return sb.storage.from('project-videos').upload(name, file, { contentType: file.type || 'video/mp4', cacheControl: '31536000' }).then(ok).then(function () {
        return sb.storage.from('project-videos').getPublicUrl(name).data.publicUrl;
      });
    },
    user: function () { return sb.auth.getSession().then(function (r) { return r.data.session ? r.data.session.user : null; }); },
    signIn: function (email, password) { return sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) { if (r.error) throw r.error; }); },
    signOut: function () { return sb.auth.signOut(); }
  };

  function deriveClients(list) {
    var map = {}, out = [];
    list.forEach(function (p) {
      var n = (p.client || '').trim(); if (!n) return;
      var k = n.toLowerCase();
      if (!map[k]) { map[k] = { name: n, logo: '' }; out.push(map[k]); }
      if (!map[k].logo && p.clientLogo) map[k].logo = p.clientLogo;
    });
    return out;
  }
  local.listClients = function () { return Promise.resolve(deriveClients(local.load())); };
  local.setClientLogo = function (name, logo) {
    var l = local.load();
    l.forEach(function (p) { if ((p.client || '').toLowerCase() === name.toLowerCase()) p.clientLogo = logo; });
    local.save(l); return Promise.resolve();
  };
  if (remote) {
    remote.listClients = function () {
      return sb.from('projects').select('client,client_logo').order('sort').order('created_at').then(ok).then(function (d) {
        return deriveClients(d.map(function (r) { return { client: r.client, clientLogo: r.client_logo }; }));
      });
    };
    remote.setClientLogo = function (name, logo) {
      return sb.from('projects').update({ client_logo: logo }).ilike('client', name.replace(/[\\%_]/g, '\\$&')).then(ok);
    };
  }
  var impl = cloud ? remote : local;
  window.ProjectStore = {
    mode: cloud ? 'cloud' : 'local', sb: sb,
    configured: configured, initError: initError, host: (C.SUPABASE_URL || '').replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
    withTimeout: function (p, ms) {
      return new Promise(function (res, rej) {
        var t = setTimeout(function () { rej(new Error('The database did not answer in time. Check the Supabase URL and key in js/config.js.')); }, ms || 12000);
        p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
      });
    },
    isDev: /^(localhost|127\.0\.0\.1|\[::1\])?$/.test(location.hostname) || location.protocol === 'file:',
    list: impl.list, create: impl.create, update: impl.update, remove: impl.remove,
    upload: impl.upload, listClients: impl.listClients, setClientLogo: impl.setClientLogo, uploadVideo: impl.uploadVideo, reset: impl.reset, user: impl.user, signIn: impl.signIn, signOut: impl.signOut,
    categories: function (list, base) { var c = (base || (window.NB_SITE || {}).cats || []).slice(); list.forEach(function (p) { if (c.indexOf(p.cat) < 0) c.push(p.cat); }); return c; }
  };
})();
