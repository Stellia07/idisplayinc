/* Services data layer (same modes as ProjectStore: cloud = Supabase, local = this browser). */
(function () {
  var P = window.ProjectStore, sb = P.sb, cloud = P.mode === 'cloud', KEY = 'northbeam.services.v1';
  var SEED = [
 {
  "title": "Custom exhibits",
  "summary": "Custom-built exhibit booths for trade shows and expos.",
  "desc": "We design and build custom exhibit booths that put your brand at the center of the show floor. From the first concept to installation, every booth is tailored to your needs and objectives.\n\nWith in-house design and production capabilities, we keep full control of quality while staying flexible and responsive.",
  "features": "Custom-built exhibit booths\nConceptual design and planning\nIn-house fabrication\nInstallation and post-event support",
  "img": "images/image1.jpg",
  "id": "s1"
 },
 {
  "title": "Kiosks",
  "summary": "Branded kiosks that put your products and information within reach.",
  "desc": "Kiosks give your brand a compact, eye-catching presence in malls, events and retail spaces. We build them to reflect your brand identity and goals.\n\nWe combine creativity with durability and cost-efficiency, so your kiosk looks great and holds up.",
  "features": "Designed around your brand identity\nDurable, cost-efficient construction\nBuilt in-house with full quality control",
  "img": "",
  "id": "s2"
 },
 {
  "title": "Promotional events",
  "summary": "Roadshows and promotional installations that draw a crowd.",
  "desc": "From roadshows to promotional installations, we create event spaces that engage, inspire, and connect meaningfully with your audience.\n\nWe handle the planning, fabrication and installation, and support you after the event, anywhere our services are needed.",
  "features": "Roadshows\nPromotional installations\nInstallation anywhere our services are needed\nPost-event support",
  "img": "images/image2.jpg",
  "id": "s3"
 },
 {
  "title": "Permanent displays & shop fittings",
  "summary": "Retail displays and fittings built with craftsmanship.",
  "desc": "We design and produce permanent displays and shop fittings that present your products at their best, built with craftsmanship and durability in mind.\n\nEvery piece is tailored to your brand and your space.",
  "features": "Retail displays\nShop fittings\nCraftsmanship and durability\nTailored to your brand and space",
  "img": "images/image4.jpg",
  "id": "s4"
 },
 {
  "title": "Commercial interior design & architecture",
  "summary": "Commercial interiors designed and delivered end to end.",
  "desc": "We plan and deliver commercial interiors that reflect each client’s brand identity and goals, from conceptual design and planning to fabrication and installation.\n\nOur end-to-end process is tailored to your needs and objectives.",
  "features": "Conceptual design and planning\nIn-house fabrication\nInstallation\nTailored to each client’s needs and objectives",
  "img": "",
  "id": "s5"
 },
 {
  "title": "Graphic displays",
  "summary": "Visually compelling graphics that help your brand stand out.",
  "desc": "Our graphic displays present your message as visually compelling pieces that help brands stand out and connect meaningfully with their audience.\n\nThey are produced with our in-house capabilities, so we keep full quality control from design to finish.",
  "features": "Visually compelling graphics\nIn-house production\nFull quality control",
  "img": "images/image3.jpg",
  "id": "s6"
 }
];
  function ok(r) { if (r.error) throw r.error; return r.data; }
  function slug(s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var local = {
    load: function () {
      try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
      return JSON.parse(JSON.stringify(SEED));
    },
    save: function (l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { throw new Error('Browser storage is full. Try a smaller image.'); } },
    list: function () { return Promise.resolve(local.load()); },
    create: function (s) { var l = local.load(); s.id = 's' + Date.now().toString(36); l.push(s); local.save(l); return Promise.resolve(); },
    update: function (id, s) {
      var l = local.load(), i = l.findIndex(function (x) { return x.id === id; });
      if (i >= 0) { for (var k in s) l[i][k] = s[k]; local.save(l); }
      return Promise.resolve();
    },
    remove: function (id) { local.save(local.load().filter(function (x) { return x.id !== id; })); return Promise.resolve(); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} return Promise.resolve(); }
  };
  function toApp(r) { return { id: r.id, title: r.title, summary: r.summary || '', desc: r.description || '', features: r.features || '', img: r.img || '' }; }
  function toDb(s) { return { title: s.title, summary: s.summary, description: s.desc, features: s.features, img: s.img }; }
  var remote = cloud && {
    list: function () { return sb.from('services').select('*').order('sort').order('created_at').then(ok).then(function (d) { return d.map(toApp); }); },
    create: function (s) { return sb.from('services').insert(toDb(s)).then(ok); },
    update: function (id, s) { return sb.from('services').update(toDb(s)).eq('id', id).then(ok); },
    remove: function (id) { return sb.from('services').delete().eq('id', id).then(ok); },
    reset: function () { return Promise.resolve(); }
  };
  var impl = cloud ? remote : local;
  window.ServiceStore = { list: impl.list, create: impl.create, update: impl.update, remove: impl.remove, reset: impl.reset, slug: slug };
})();
