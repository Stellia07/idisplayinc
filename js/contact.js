(function () {
  var NS = window.NB_SITE || {}, EMAIL = NS.email || '';
  var $ = function (i) { return document.getElementById(i); };
  var F = { nm: $('nm'), em: $('em'), co: $('co'), ph: $('ph'), sv: $('sv'), vn: $('vn'), dt: $('dt'), bd: $('bd'), br: $('br') };
  function v(k) { return F[k].value.trim(); }
  function enc(s) { return encodeURIComponent(s); }
  var draft = '';

  // static contact info
  $('ci-tel').textContent = NS.phone; $('ci-tel').href = 'tel:' + NS.tel;
  $('ci-mail').textContent = EMAIL; $('ci-mail').href = 'mailto:' + EMAIL;
  $('ci-addr').textContent = NS.address; $('ci-fb').href = NS.facebook;
  $('q-app').href = 'mailto:' + EMAIL;
  $('q-gm').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(EMAIL);

  function build() {
    var who = v('co') || v('nm');
    var subject = 'Quotation request: ' + (v('sv') || 'Project inquiry') + (who ? ' - ' + who : '');
    var L = ['Hello IDisplay Inc. team,', '', 'I would like to request a quotation for the following project.', ''];
    function add(arr, label, val) { if (val) arr.push(label + ': ' + val); }
    add(L, 'Service', v('sv')); add(L, 'Target venue / city', v('vn')); add(L, 'Target date / timeline', v('dt')); add(L, 'Budget guidance', v('bd'));
    if (v('br')) L.push('', 'Project brief:', v('br'));
    var C = []; add(C, 'Name', v('nm')); add(C, 'Company', v('co')); add(C, 'Email', v('em')); add(C, 'Phone', v('ph'));
    if (C.length) L.push('', 'My contact details:'), C.forEach(function (c) { L.push(c); });
    L.push('', 'Thank you.'); if (v('nm')) L.push(v('nm'));
    return { subject: subject, body: L.join('\n') };
  }
  function update() {
    var d = build();
    var mailto = 'mailto:' + EMAIL + '?subject=' + enc(d.subject) + '&body=' + enc(d.body.replace(/\n/g, '\r\n'));
    var gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(EMAIL) + '&su=' + enc(d.subject) + '&body=' + enc(d.body);
    $('b-app').href = mailto; $('b-gm').href = gmail;
    draft = 'To: ' + EMAIL + '\nSubject: ' + d.subject + '\n\n' + d.body;
    $('pv').textContent = draft;
    $('lnote').hidden = mailto.length < 1900;
    $('cnt').textContent = F.br.value.length + ' / 1500';
  }
  function status(t, bad) { var s = $('cstat'); s.textContent = t; s.className = bad ? 'err' : ''; }
  function copy(text, ok) {
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var done = false; try { done = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); status(done ? ok : 'Could not copy. Please select the preview text and copy it.', !done);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { status(ok); }, fallback); else fallback();
  }
  function needService(e) {
    if (v('sv')) return false;
    if (e) e.preventDefault();
    F.sv.parentNode.classList.add('bad'); status('Please choose the service you need first.', true); F.sv.focus();
    return true;
  }
  F.sv.addEventListener('change', function () { F.sv.parentNode.classList.remove('bad'); });
  $('b-app').addEventListener('click', function (e) { if (!needService(e)) status('Opening your email app. Review the draft, then press send.'); });
  $('b-gm').addEventListener('click', function (e) { if (!needService(e)) status('Opening Gmail in a new tab. Review the draft, then press send.'); });
  $('b-copy').onclick = function () { if (!needService()) copy(draft, 'Draft copied. Paste it into any email.'); };
  $('q-copy').onclick = function () { copy(EMAIL, 'Email address copied.'); };

  // budget quick picks
  ['Under PHP 100,000', 'PHP 100,000 - 500,000', 'PHP 500,000 - 1,000,000', 'Above PHP 1,000,000', 'Not sure yet'].forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = t;
    b.onclick = function () { F.bd.value = t; update(); }; $('picks').appendChild(b);
  });

  // service options: from the services list, falling back to the fixed names
  function fillServices(titles) {
    var want = new URLSearchParams(location.search).get('service') || F.sv.value;
    F.sv.textContent = ''; F.sv.add(new Option('Choose a service…', ''));
    titles.forEach(function (t) { F.sv.add(new Option(t, t)); });
    F.sv.add(new Option('Other / not sure yet', 'Other / not sure yet'));
    if (want && [].some.call(F.sv.options, function (o) { return o.value === want; })) F.sv.value = want;
    update();
  }
  fillServices(NS.cats || []);
  if (window.ServiceStore) ServiceStore.list().then(function (l) { if (l.length) fillServices(l.map(function (s) { return s.title; })); }).catch(function () {});

  Object.keys(F).forEach(function (k) { F[k].addEventListener('input', update); F[k].addEventListener('change', update); });
  $('cform').addEventListener('submit', function (e) { e.preventDefault(); });
  if (window.innerWidth >= 960) $('pvd').open = true;
  update();
})();
