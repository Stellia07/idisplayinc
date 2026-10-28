(function () {
  var S = ProjectStore, $ = function (i) { return document.getElementById(i); };
  var f = $('f'), editing = null, blob = null, keepImg = '', items = [];
  var gal = ImageList($('gal'), { max: 12 });
  var clFile = null, keepLogo = '', clientMap = {};
  function clPreview(src) { var p = $('clprev'); if (src) { p.src = src; p.hidden = false; } else { p.hidden = true; p.removeAttribute('src'); } }
  function setClientLogo(src) {
    clFile = null; $('clfile').value = ''; src = src || '';
    var isData = src.indexOf('data:') === 0; keepLogo = isData ? src : ''; $('clpath').value = isData ? '' : src; clPreview(src);
  }
  function buildClientMap() {
    clientMap = {}; var dl = $('clist'); dl.textContent = '';
    items.forEach(function (p) {
      var n = (p.client || '').trim(); if (!n) return; var k = n.toLowerCase();
      if (!clientMap[k]) clientMap[k] = { name: n, logo: '' };
      if (!clientMap[k].logo && p.clientLogo) clientMap[k].logo = p.clientLogo;
    });
    Object.keys(clientMap).sort().forEach(function (k) { var o = document.createElement('option'); o.value = clientMap[k].name; dl.appendChild(o); });
  }
  function autofillLogo() {
    var c = clientMap[$('client').value.trim().toLowerCase()];
    if (c && c.logo && !clFile && !keepLogo && !$('clpath').value.trim()) { setClientLogo(c.logo); $('clnote').textContent = 'Using the logo already saved for this client.'; }
    else if (!c) $('clnote').textContent = '';
  }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function msg(t, bad) { var m = $('msg'); m.textContent = t; m.className = bad ? 'err' : 'ok'; }
  function preview(src) { var p = $('prev'); if (src) { p.src = src; p.hidden = false; } else { p.hidden = true; p.removeAttribute('src'); } }
  function setCat(v) {
    var s = $('cat');
    if (v && ![].some.call(s.options, function (o) { return o.value === v; })) s.add(new Option(v, v));
    s.value = v;
  }
  (function () {
    var s = $('cat'); s.add(new Option('Choose a service…', ''));
    ((window.NB_SITE || {}).cats || []).forEach(function (c) { s.add(new Option(c, c)); });
  })();
  function fillServices(titles) {
    var s = $('cat'), v = s.value; s.textContent = ''; s.add(new Option('Choose a service…', ''));
    titles.forEach(function (c) { s.add(new Option(c, c)); }); setCat(v);
  }
  document.addEventListener('services:changed', function (e) { fillServices(e.detail); });
  function resetForm() {
    f.reset(); editing = null; blob = null; keepImg = ''; preview(''); gal.set([]); $('vinfo').textContent = ''; setClientLogo(''); $('clnote').textContent = '';
    $('ftitle').textContent = 'Add project'; $('save').textContent = 'Add project'; $('cancel').hidden = true;
  }
  function edit(id) {
    var p = items.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    editing = id; blob = null; msg('');
    $('title').value = p.title; setCat(p.cat); $('client').value = p.client || ''; setClientLogo(p.clientLogo || ''); $('clnote').textContent = ''; $('place').value = p.place || ''; $('desc').value = p.desc || ''; gal.set(p.gallery || []); $('vlink').value = p.video || ''; $('vinfo').textContent = '';
    var isData = p.img.indexOf('data:') === 0;
    keepImg = isData ? p.img : ''; $('path').value = isData ? '' : p.img; preview(p.img);
    $('ftitle').textContent = 'Edit project'; $('save').textContent = 'Save changes'; $('cancel').hidden = false;
    f.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('title').focus();
  }
  function del(p) {
    if (!confirm('Delete "' + p.title + '"? This cannot be undone.')) return;
    S.remove(p.id).then(function () { if (editing === p.id) resetForm(); msg('Project deleted.'); return render(); })
      .catch(function (e) { msg('Delete failed: ' + AdminHelp.msg(e), true); });
  }
  function render() {
    var rows = $('rows'); rows.textContent = '';
    return S.list().then(function (list) {
      items = list; buildClientMap(); $('count').textContent = '(' + list.length + ')';
      if (!list.length) { rows.appendChild(el('p', 'empty', 'No projects yet. Add one using the form.')); return; }
      list.forEach(function (p) {
        var row = el('div', 'row'), im = el('img'); im.src = p.img; im.alt = '';
        var info = el('div', 'info'); info.appendChild(el('strong', null, p.title)); info.appendChild(el('span', null, (p.client ? p.client + ' · ' : '') + p.cat));
        var a = el('div', 'acts');
        var e = el('button', 'btn sm ghost', 'Edit'); e.type = 'button'; e.onclick = function () { edit(p.id); };
        var d = el('button', 'btn sm danger', 'Delete'); d.type = 'button'; d.onclick = function () { del(p); };
        a.appendChild(e); a.appendChild(d);
        row.appendChild(im); row.appendChild(info); row.appendChild(a); rows.appendChild(row);
      });
    }).catch(function (e) { rows.appendChild(el('p', 'empty', 'Could not load projects: ' + e.message)); });
  }
  $('file').onchange = function () {
    var file = this.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var s = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function (b) { blob = b; keepImg = ''; $('path').value = ''; preview(URL.createObjectURL(b)); }, 'image/jpeg', 0.8);
      };
      im.onerror = function () { msg('That file could not be read as an image.', true); };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  };
  $('path').oninput = function () { blob = null; keepImg = ''; $('file').value = ''; preview(this.value.trim()); };
  f.onsubmit = function (e) {
    e.preventDefault();
    var d = { title: $('title').value.trim(), cat: $('cat').value.trim(), client: $('client').value.trim(), place: $('place').value.trim(), desc: $('desc').value.trim() };
    var path = $('path').value.trim();
    if (!d.title || !d.cat || !(path || blob || keepImg)) { msg('Title, service and an image are required.', true); return; }
    d.alt = d.title; d.gallery = gal.get();
    var vurl = $('vlink').value.trim(), vf = $('vfile').files[0];
    if (vurl && !ProjectMedia.parseVideo(vurl)) { msg('Video: use a YouTube or Vimeo link, or upload an MP4 file.', true); return; }
    var clPath = $('clpath').value.trim();
    if (clPath && /^[a-z][a-z0-9+.-]*:/i.test(clPath) && !/^https?:\/\//i.test(clPath)) { msg('Client logo: use an image path or an https link.', true); return; }
    var wasEdit = !!editing; $('save').disabled = true; msg(vf ? 'Saving… uploading the video can take a while.' : 'Saving…');
    var imgP = path ? Promise.resolve(path) : blob ? S.upload(blob) : Promise.resolve(keepImg);
    imgP.then(function (img) { d.img = img; return vf ? S.uploadVideo(vf) : vurl; })
      .then(function (v) { d.video = v || ''; return clPath ? clPath : clFile ? S.upload(clFile, { max: 600, quality: 0.9, noThumb: true }) : keepLogo; })
      .then(function (lg) { d.clientLogo = d.client ? (lg || '') : ''; return wasEdit ? S.update(editing, d) : S.create(d); })
      .then(function () { return d.client && d.clientLogo ? S.setClientLogo(d.client, d.clientLogo) : null; })
      .then(function () { resetForm(); msg(wasEdit ? 'Project updated.' : 'Project added.'); return render(); })
      .catch(function (err) { msg('Could not save: ' + AdminHelp.msg(err), true); })
      .then(function () { $('save').disabled = false; });
  };
  if (S.mode === 'local') { $('vfile').disabled = true; $('vnote').textContent = 'Video upload needs the Supabase connection. For now, paste a YouTube or Vimeo link.'; }
  $('vfile').onchange = function () {
    var v0 = this.files[0], info = $('vinfo'); if (!v0) { info.textContent = ''; return; }
    if (v0.size > 52428800) { this.value = ''; info.textContent = 'That file is over 50 MB. Please compress it first (see the tip below), or use a YouTube link.'; return; }
    var mb = (v0.size / 1048576).toFixed(1); $('vlink').value = '';
    info.textContent = 'Selected: ' + v0.name + ' (' + mb + ' MB). Checking…';
    var vid = document.createElement('video'), u = URL.createObjectURL(v0); vid.preload = 'metadata';
    vid.onloadedmetadata = function () {
      var w = vid.videoWidth, h = vid.videoHeight, d = Math.round(vid.duration || 0);
      var t = 'Selected: ' + v0.name + ' (' + mb + ' MB, ' + w + '×' + h + ', ' + Math.floor(d / 60) + ':' + ('0' + (d % 60)).slice(-2) + '). It uploads when you press Save.';
      if (v0.size > 20971520 || Math.max(w, h) > 1920) t += ' This is large and will load slowly. For best results compress it first: HandBrake, preset "Fast 1080p30", MP4, quality RF 24 (or use a YouTube link).';
      info.textContent = t; URL.revokeObjectURL(u);
    };
    vid.onerror = function () { info.textContent = 'Selected: ' + v0.name + ' (' + mb + ' MB). It uploads when you press Save.'; URL.revokeObjectURL(u); };
    vid.src = u;
  };
  $('vlink').oninput = function () { if (this.value.trim()) { $('vfile').value = ''; $('vinfo').textContent = ''; } };
  $('client').addEventListener('input', autofillLogo); $('client').addEventListener('change', autofillLogo);
  $('clfile').onchange = function () { var fl = this.files[0]; if (!fl) return; clFile = fl; keepLogo = ''; $('clpath').value = ''; $('clnote').textContent = ''; clPreview(URL.createObjectURL(fl)); };
  $('clpath').oninput = function () { clFile = null; keepLogo = ''; $('clfile').value = ''; clPreview(this.value.trim()); };
  $('cancel').onclick = function () { resetForm(); msg(''); };
  $('reset').onclick = function () {
    if (!confirm('Replace all projects with the original 4? Your changes will be lost.')) return;
    S.reset().then(function () { resetForm(); msg('Restored the original projects.'); return render(); });
  };
  $('lf').onsubmit = function (e) {
    e.preventDefault(); var m = $('lmsg'); m.textContent = 'Signing in…'; m.className = '';
    S.signIn($('email').value.trim(), $('pw').value).then(boot).catch(function (err) { m.textContent = err.message || 'Sign in failed.'; m.className = 'err'; });
  };
  $('out').onclick = function () { S.signOut().then(boot); };
  function boot() {
    return S.user().then(function (u) {
      window.__adminEmail = u && u.email && u.email !== 'local' ? u.email : '';
      if (S.mode === 'local' && !S.isDev) { $('login').hidden = true; $('app').hidden = true; $('off').hidden = false; return; }
      $('login').hidden = !!u; $('app').hidden = !u;
      $('out').hidden = !(u && S.mode === 'cloud'); $('reset').hidden = S.mode === 'cloud';
      $('mode').textContent = S.mode === 'cloud' ? 'Connected to Supabase. Signed in as ' + (u ? u.email : '') : (S.configured ? 'Supabase is set up but its script did not load, so this is test mode with no sign-in. Check your internet connection.' : 'Test mode: there is no sign-in and changes stay in this browser only. Connect Supabase in js/config.js to turn on sign-in.');
      if (u) { document.dispatchEvent(new Event('admin:ready')); return render(); }
    });
  }
  boot();
})();
