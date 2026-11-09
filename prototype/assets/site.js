(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const two = n => String(n).padStart(2, '0');

  // ---- navigation ----
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * .8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mark the section in view in the menu
  const navLinks = $$('#navLinks a');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.getAttribute('href') === '#' + en.target.id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
    }), { rootMargin: '-45% 0px -50% 0px' }); // a thin band across the middle of the screen
    $$('#top, section[id]').forEach(s => spy.observe(s));
  }

  // mobile menu
  const menuBtn = $('.menu-btn', nav);
  const setMenu = open => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen'); };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#navLinks a, .nav-cta', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 980) setMenu(false); });

  // ---- services: hover / click swaps the image ----
  const items = $$('#svcList li'), imgs = $$('#svcView img');
  const pick = li => {
    items.forEach(x => { const on = x === li; x.classList.toggle('on', on); $('button', x).setAttribute('aria-expanded', on); });
    imgs.forEach(im => im.classList.toggle('on', im.dataset.k === li.dataset.img));
  };
  const canHover = matchMedia('(hover: hover)').matches;
  items.forEach(li => { $('button', li).addEventListener('click', () => pick(li)); if (canHover) li.addEventListener('mouseenter', () => pick(li)); });

  // ---- projects carousel ----
  const rail = $('#rail'), cards = [...rail.children], pc = $('#pc'), prev = $('#prev'), next = $('#next');
  const stepW = () => cards[0].offsetWidth + 24;
  const atEnd = () => rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4;
  const idx = () => atEnd() ? cards.length - 1 : Math.round(rail.scrollLeft / stepW());
  const syncRail = () => { pc.textContent = `[ ${two(idx() + 1)} / ${two(cards.length)} ]`; prev.disabled = rail.scrollLeft < 4; next.disabled = atEnd(); };
  const go = d => rail.scrollTo({ left: Math.max(0, Math.round(rail.scrollLeft / stepW()) + d) * stepW(), behavior: reduce ? 'auto' : 'smooth' });
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
  rail.addEventListener('scroll', syncRail, { passive: true }); addEventListener('resize', syncRail); syncRail();

  // ---- contact forms: friendly steps, chips; POST to /api/contact (contact-service), mailto fallback when no server ----
  const tabs = $$('.tab'), forms = $$('.cform');
  const showTab = (k, focus) => {
    $('.tabs').classList.toggle('job', k === 'job');
    $('#sumTitle').textContent = k === 'job' ? 'Bei uns arbeiten' : 'Projekt anfragen';
    tabs.forEach(t => { const on = t.dataset.tab === k; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    forms.forEach(f => f.classList.toggle('on', f.id === 'form-' + k));
    updateSum();
  };
  tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
  $('.tabs').addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault(); showTab(tabs[(to + tabs.length) % tabs.length].dataset.tab, true);
  });
  $$('[data-open]').forEach(a => a.addEventListener('click', () => showTab(a.dataset.open)));

  // chips are toggle buttons; a group without data-multi keeps a single choice
  $$('.chips').forEach(g => {
    g.setAttribute('role', 'group'); g.setAttribute('aria-label', g.dataset.name);
    const chips = $$('button', g); chips.forEach(b => b.setAttribute('aria-pressed', 'false'));
    g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (!g.hasAttribute('data-multi')) chips.forEach(x => { if (x !== b) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); } });
      const on = b.classList.toggle('on'); b.setAttribute('aria-pressed', on);
      if (on) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
      updateSum();
    });
  });

  const biz = $('#form-biz'), fsteps = $$('.step', biz), stepLabels = ['Projekt', 'Umfang', 'Kontakt'];
  let cur = 0;
  const goStep = i => {
    cur = i; fsteps.forEach((s, k) => s.classList.toggle('on', k === i));
    $('#stepN').textContent = two(i + 1); $('#stepL').textContent = stepLabels[i]; $('#progFill').style.width = ((i + 1) / fsteps.length * 100) + '%';
    $('legend', fsteps[i]).focus({ preventScroll: true }); // the pressed button is now hidden: keep keyboard and screen reader in the form
    biz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  $$('.next', biz).forEach(b => b.addEventListener('click', () => goStep(Math.min(cur + 1, fsteps.length - 1))));
  $$('.back', biz).forEach(b => b.addEventListener('click', () => goStep(Math.max(cur - 1, 0))));

  const job = $('#form-job');
  $$('input[name="Ich bin"]', job).forEach(r => r.addEventListener('change', () => {
    const firm = $('input[name="Ich bin"]:checked', job).value === 'Subunternehmer';
    $('.only-person', job).hidden = firm; $('.only-firm', job).hidden = !firm;
    const fi = $('.only-firm-in', job); fi.hidden = !firm; $('input', fi).required = firm;
  }));

  // everything the visitor entered, as [label, value] pairs
  const collect = f => {
    const rows = [];
    const who = $('input[name="Ich bin"]:checked', f); if (who) rows.push(['Ich bin', who.value]);
    $$('.chips', f).forEach(g => { if (g.closest('[hidden]')) return; const v = $$('button.on', g).map(b => b.textContent.trim()); if (v.length) rows.push([g.dataset.name, v.join(', ')]); });
    $$('input[name]:not([type=radio]):not([type=checkbox]):not([type=file]):not([name=website]), textarea[name]', f).forEach(i => { if (i.closest('[hidden]') || !i.value.trim()) return; rows.push([i.name, i.value.trim()]); });
    return rows;
  };
  const asText = rows => rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  // live summary beside the form (text nodes only: nothing the visitor types is parsed as HTML)
  const sumList = $('#sumList'), sumEmpty = sumList.firstElementChild;
  let sumKey = '';
  function updateSum() {
    const f = $('.cform.on'); if (!f) return;
    const rows = collect(f).filter(([k]) => !/^(Nachricht|Telefon|E-Mail)$/.test(k));
    const key = f.id + JSON.stringify(rows); if (key === sumKey) return; sumKey = key;
    sumList.replaceChildren(...(rows.length ? rows.map(([k, v]) => {
      const li = document.createElement('li'), body = document.createElement('span'), label = document.createElement('small');
      label.textContent = k; body.append(label, v); li.append(body); return li;
    }) : [sumEmpty]));
  }
  forms.forEach(f => { f.addEventListener('input', updateSum); f.addEventListener('change', updateSum); });

  forms.forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const errs = $$('.err', f), say = msg => errs.forEach(x => x.textContent = msg);
    const required = $$('input[required], textarea[required]', f).filter(i => !i.closest('[hidden]') && !i.closest('.step:not(.on)'));
    const bad = required.filter(i => !i.checkValidity());
    $$('.fld', f).forEach(x => x.classList.remove('bad'));
    required.forEach(i => i.setAttribute('aria-invalid', bad.includes(i)));
    bad.forEach(i => i.closest('.fld') && i.closest('.fld').classList.add('bad'));
    if (bad.length) { say(bad.some(i => i.type === 'checkbox') ? 'Bitte füllen Sie die markierten Felder aus und bestätigen Sie den Datenschutz.' : 'Bitte füllen Sie die markierten Felder korrekt aus.'); bad[0].focus(); return; }
    say('');
    const cv = $('input[name=cv]', f), file = cv && cv.files[0];
    if (file && file.size > 5 * 1024 * 1024) { say('Die Datei ist größer als 5 MB.'); cv.focus(); return; }
    const rows = collect(f);
    const sent = () => { f.classList.add('sent'); $('.done', f).focus(); };
    const viaMail = () => {
      const p = $('.done p', f); p.textContent = p.dataset.mail;
      sent();
      window.location.href = `mailto:${f.dataset.to}?cc=${encodeURIComponent(f.dataset.cc)}&subject=${encodeURIComponent(f.dataset.subject)}&body=${encodeURIComponent(asText(rows) + '\n\n— gesendet über umtelkomd.net')}`;
    };
    if (location.protocol === 'file:') return viaMail(); // page opened by double-click: no server
    const fd = new FormData();
    fd.append('form', f.id === 'form-job' ? 'job' : 'biz');
    fd.append('name', $('input[name=Name]', f).value.trim());
    fd.append('email', $('input[name="E-Mail"]', f).value.trim());
    fd.append('summary', asText(rows.filter(([k]) => k !== 'Name' && k !== 'E-Mail'))); // server adds validated name/e-mail itself
    fd.append('website', $('input[name=website]', f).value);
    if (file) fd.append('cv', file, file.name);
    const btn = $('button[type=submit]', f); btn.disabled = true;
    const msgs = { invalid_email: 'Bitte prüfen Sie Ihre E-Mail-Adresse.', invalid_file: 'Bitte laden Sie eine PDF-, Word-, JPG- oder PNG-Datei bis 5 MB hoch.', too_large: 'Die Datei ist zu groß (max. 5 MB).', rate_limited: 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.' };
    fetch('/api/contact', { method: 'POST', body: fd })
      .then(r => r.json().catch(() => ({})).then(j => ({ status: r.status, j })))
      .then(({ status, j }) => {
        if (j.ok) return sent();
        if (status >= 500 || status === 404 || !j.error) return viaMail(); // server not reachable or not deployed
        say(msgs[j.error] || 'Bitte prüfen Sie Ihre Angaben.');
      })
      .catch(viaMail)
      .finally(() => { btn.disabled = false; });
  }));

  // ---- press wave on buttons, chips, tabs and choice cards ----
  const NS = 'http://www.w3.org/2000/svg';
  document.addEventListener('pointerdown', e => {
    if (reduce) return;
    const host = e.target.closest('.btn, .chips button, .tab, .who label');
    if (!host || host.disabled) return;
    const el = host.matches('.who label') ? $('span', host) : host;
    const r = el.getBoundingClientRect(), W = r.width, H = r.height, mid = H - Math.min(10, H * .18); // just under the label
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'press-wave');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    const trail = document.createElementNS(NS, 'path'), pulse = document.createElementNS(NS, 'path');
    trail.setAttribute('class', 'trail'); pulse.setAttribute('class', 'pulse'); svg.append(trail, pulse);
    $$('.press-wave', el).forEach(n => n.remove()); el.append(svg);
    const fromRight = e.clientX - r.left > W / 2, t0 = performance.now(), dur = 380;
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur), amp = Math.min(4, H * .08) * (1 - t * .5);
      let d = ''; for (let x = 0; x <= W; x += 4) { const y = mid + Math.sin(x / 9 - t * 14) * amp * Math.sin(x / W * Math.PI); d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1); }
      trail.setAttribute('d', d); pulse.setAttribute('d', d);
      const L = pulse.getTotalLength(), seg = L * .4, head = (fromRight ? 1 - t : t) * (L + seg) - (fromRight ? 0 : seg);
      [pulse, trail].forEach(p => { p.style.strokeDasharray = `${seg} ${L * 2}`; p.style.strokeDashoffset = -head; });
      svg.style.opacity = t > .8 ? (1 - t) / .2 : 1;
      if (t < 1) requestAnimationFrame(frame); else svg.remove();
    };
    requestAnimationFrame(frame);
  }, { passive: true });

  // ---- motion (skipped without GSAP or when the visitor prefers reduced motion) ----
  const fmt = (v, suf) => v.toLocaleString('de-DE') + suf;
  if (!window.gsap || reduce) { $$('[data-count]').forEach(b => b.textContent = fmt(+b.dataset.count, b.dataset.suffix || '')); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const lenis = new Lenis({ lerp: .09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  // section links: smooth scroll, shareable URL, focus follows
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const hash = a.getAttribute('href'), t = $(hash); if (!t) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: -80 });
    history.pushState(null, '', hash === '#top' ? location.pathname : hash);
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }));

  // endless tweens run only while their section is on screen
  const whileVisible = (trigger, ...tweens) => {
    const apply = s => tweens.forEach(t => s.isActive ? t.play() : t.pause());
    ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: apply, onRefresh: apply });
  };

  // hero intro + parallax
  gsap.from('.hero h1 .w>span', { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: .07, delay: .15 });
  gsap.from(['.hero .kicker', '.hero p', '.hero .ctas', '.hero .reel'], { y: 20, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .1, delay: .55 });
  gsap.fromTo('#heroBg', { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'power2.out' });
  gsap.to('#heroBg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // hero light: a light pulse riding a moving wave
  const wb = $('#waveBase'), wt = $('#waveTrail'), wp = $('#wavePulse');
  const W = 1200, wave = { ph: 0, head: -.1 };
  const waveD = ph => { let d = ''; for (let x = 0; x <= W; x += 10) { const y = 35 + Math.sin(x / 140 + ph) * 13 * Math.sin(x / W * Math.PI); d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1); } return d; };
  const paint = () => {
    const d = waveD(wave.ph); [wb, wt, wp].forEach(p => p.setAttribute('d', d));
    const L = wp.getTotalLength(), h = L * wave.head;
    wp.style.strokeDasharray = `26 ${L}`; wp.style.strokeDashoffset = 26 - h; wt.style.strokeDasharray = `150 ${L}`; wt.style.strokeDashoffset = 150 - h;
  };
  whileVisible('.hero',
    gsap.to(wave, { ph: Math.PI * 2, duration: 6, ease: 'none', repeat: -1, onUpdate: paint }),
    gsap.to(wave, { head: 1.1, duration: 3.4, ease: 'power1.inOut', repeat: -1, repeatDelay: .9, delay: 1.2 }));

  // headings: words rise on scroll
  $$('.split').forEach(h => {
    const s = new SplitText(h, { type: 'words', mask: 'words' });
    gsap.from(s.words, { yPercent: 110, duration: .9, ease: 'power4.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  gsap.utils.toArray('.fade').forEach(el => gsap.from(el, { y: 24, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));

  // image parallax + clip reveal
  gsap.utils.toArray('.par').forEach(img => {
    gsap.fromTo(img.parentElement, { clipPath: 'inset(14% 0 0 0 round 10px)' }, { clipPath: 'inset(0% 0 0 0 round 10px)', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: img.parentElement, start: 'top 85%' } });
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // numbers count up
  const counters = $$('[data-count]');
  counters.forEach(b => { b.textContent = fmt(0, b.dataset.suffix || ''); });
  // the reserved width is measured in the display face, so wait for it
  document.fonts.ready.then(() => counters.forEach(b => {
    const o = { v: 0 }, to = +b.dataset.count, suf = b.dataset.suffix || '';
    // Count in coarse steps and reserve the final width: Cinzel digits are proportional,
    // so changing every unit each frame makes the number jitter and look blurred.
    const step = to >= 1000 ? 100 : to >= 100 ? 10 : 1;
    b.textContent = fmt(to, suf); b.style.minWidth = b.getBoundingClientRect().width + 'px'; b.textContent = fmt(0, suf);
    let last = 0;
    gsap.to(o, { v: to, duration: 2.8, ease: 'power1.inOut', scrollTrigger: { trigger: b, start: 'top 70%', toggleActions: 'play none none none' },
      onUpdate: () => { const v = Math.min(to, Math.round(o.v / step) * step); if (v !== last) { last = v; b.textContent = fmt(v, suf); } } });
  }));

  // process: the fiber fills with the scroll, each step lights up, a light pulse runs ahead
  const fill = $('#trackFill'), FL = fill.getTotalLength(), steps = $$('#steps li');
  gsap.set(fill, { strokeDasharray: FL, strokeDashoffset: FL });
  ScrollTrigger.create({ trigger: '.process .track', start: 'top 75%', end: 'bottom 45%', scrub: .6,
    onUpdate: s => { fill.style.strokeDashoffset = FL * (1 - s.progress); steps.forEach((li, i) => li.classList.toggle('lit', s.progress >= i / (steps.length - 1) - .02)); } });
  whileVisible('.process', ...['trackTrail', 'trackPulse'].map((id, k) => {
    const p = document.getElementById(id), L = p.getTotalLength(), h = k ? 30 : 160;
    gsap.set(p, { strokeDasharray: `${h} ${L + h}`, strokeDashoffset: h });
    return gsap.to(p, { strokeDashoffset: -L, duration: 3.6, ease: 'power1.inOut', repeat: -1, repeatDelay: .6 });
  }));
  gsap.from(steps, { y: 26, autoAlpha: 0, duration: .7, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '#steps', start: 'top 85%' } });

  // site gallery: endless drift, speeds up with scroll velocity
  const mq = $('#mq');
  $$('figure', mq).forEach(f => { const copy = f.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); mq.append(copy); });
  const loop = gsap.to(mq, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
  whileVisible('.site', loop);
  ScrollTrigger.create({ trigger: '.site', start: 'top bottom', end: 'bottom top', onUpdate: s => { gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(s.getVelocity()) / 400, 4), duration: .2, overwrite: true }); gsap.to(loop, { timeScale: 1, duration: 1.2, delay: .25 }); } });

  // career stack fans out; clients and project cards rise in
  gsap.from('.stack figure', { rotate: i => [-6, 4, 8][i], y: 60, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.stack', start: 'top 80%' } });
  gsap.from('.clients > .wrap > ul li', { y: 30, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '.clients > .wrap > ul', start: 'top 85%' } });
  gsap.from('.clients .ops li', { y: 20, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '.clients .ops', start: 'top 90%' } });
  gsap.from('.card', { x: 80, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '#rail', start: 'top 85%' } });
  addEventListener('load', () => ScrollTrigger.refresh());
})();
