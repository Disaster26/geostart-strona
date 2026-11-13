(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;

  /* menu mobilne */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu-mob');
  if (burger && menu) {
    var zamknij = function () { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); };
    burger.addEventListener('click', function () {
      var otw = menu.hidden;
      menu.hidden = !otw;
      burger.setAttribute('aria-expanded', String(otw));
      burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) zamknij(); });
  }

  /* karuzele: palec, mysz, strzałki, licznik (uruchamiane, gdy są blisko ekranu - bez przeliczeń układu przy starcie) */
  var strz = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  function karuzela(car) {
    var tor = car.querySelector('.car-tor');
    var el = tor.children, n = el.length;
    if (n < 2) return;
    tor.setAttribute('tabindex', '0');
    tor.setAttribute('aria-label', 'Przewiń w bok');
    var nav = document.createElement('div'); nav.className = 'car-nav';
    var l = document.createElement('button'); l.type = 'button'; l.className = 'car-btn'; l.innerHTML = strz; l.setAttribute('aria-label', 'Poprzednie');
    var p = document.createElement('button'); p.type = 'button'; p.className = 'car-btn'; p.innerHTML = strz.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7'); p.setAttribute('aria-label', 'Następne');
    var nr = document.createElement('span'); nr.className = 'car-nr';
    var pas = document.createElement('span'); pas.className = 'car-pasek'; var pi = document.createElement('i'); pas.appendChild(pi);
    nav.appendChild(l); nav.appendChild(nr); nav.appendChild(p); nav.appendChild(pas);
    car.appendChild(nav);
    var k = 0;
    function krok() { return k || (k = el[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(tor).columnGap) || 0)); }
    function odswiez() {
      var max = tor.scrollWidth - tor.clientWidth;
      if (max < 4) { nav.style.visibility = 'hidden'; return; }
      nav.style.visibility = '';
      var widac = Math.max(1, Math.round(tor.clientWidth / krok()));
      var i = Math.round(tor.scrollLeft / krok());
      if (tor.scrollLeft >= max - 4) i = n - widac;
      nr.textContent = Math.min(i + widac, n) + ' / ' + n;
      l.disabled = tor.scrollLeft < 4;
      p.disabled = tor.scrollLeft > max - 4;
      var w = tor.clientWidth / tor.scrollWidth;
      pi.style.width = (w * 100) + '%';
      pi.style.left = ((tor.scrollLeft / max) * (1 - w) * 100) + '%';
    }
    function idz(d) { tor.scrollBy({ left: d * krok(), behavior: reduce ? 'auto' : 'smooth' }); }
    l.addEventListener('click', function () { idz(-1); });
    p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { requestAnimationFrame(odswiez); }, { passive: true });
    tor.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); } });
    var start = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = e.clientX; sl = tor.scrollLeft; ruch = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (start === null) return;
      var dx = e.clientX - start;
      if (!ruch && Math.abs(dx) > 5) { ruch = true; car.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (start === null) return;
      start = null;
      if (ruch) {
        var kk = krok(), cel = Math.round(tor.scrollLeft / kk) * kk;
        car.classList.remove('ciag');
        tor.scrollTo({ left: cel, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { ruch = false; }, 0);
      }
    }
    window.addEventListener('pointerup', koniec);
    window.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); } }, true);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('resize', function () { k = 0; requestAnimationFrame(odswiez); });
    requestAnimationFrame(odswiez);
  }
  var cars = document.querySelectorAll('[data-car]');
  if (IO) {
    var ioCar = new IntersectionObserver(function (w) {
      w.forEach(function (e) { if (e.isIntersecting) { ioCar.unobserve(e.target); karuzela(e.target); } });
    }, { rootMargin: '300px 0px' });
    cars.forEach(function (c) { ioCar.observe(c); });
  } else { cars.forEach(karuzela); }

  /* pasek mobilny po przewinięciu za przycisk pierwszego ekranu */
  var pasek = document.getElementById('pasek-mob');
  var cel = document.getElementById('hero-cta') || document.querySelector('.pod-gl');
  if (pasek && cel && IO) {
    new IntersectionObserver(function (w) {
      pasek.classList.toggle('widac', !w[0].isIntersecting && w[0].boundingClientRect.top < 0);
    }).observe(cel);
  }

  /* baner cookies i mapy Google: mapy ładowane przy przewinięciu; po wyborze „Tylko niezbędne” zastępnik */
  var KL = 'gs-cookies', zg = null;
  try { zg = JSON.parse(localStorage.getItem(KL) || 'null'); } catch (e) { zg = null; }
  if (zg && (!zg.t || Date.now() - zg.t > 31536e6)) zg = null;
  var ban = document.getElementById('cookies');
  var mapy = document.querySelectorAll('.mapa[data-mapa]');
  function zgodaMapy() { return !zg || zg.mapy; }
  function pokazMape(m) {
    if (m.querySelector('iframe') && zgodaMapy()) return;
    m.innerHTML = '';
    if (zgodaMapy()) {
      var f = document.createElement('iframe');
      f.title = m.getAttribute('data-tytul') || 'Mapa Google';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = m.getAttribute('data-mapa');
      m.appendChild(f);
    } else {
      var d = document.createElement('div'); d.className = 'mapa-zast';
      d.innerHTML = '<p>Mapa Google jest wyłączona zgodnie z wyborem w banerze cookies.</p><button type="button">Pokaż mapę</button>';
      d.querySelector('button').addEventListener('click', function () { zapisz(true); });
      m.appendChild(d);
    }
    m.setAttribute('data-gotowa', '1');
  }
  function odswiezMapy() { mapy.forEach(function (m) { if (m.getAttribute('data-gotowa')) pokazMape(m); }); }
  if (mapy.length) {
    if (IO) {
      var ioMap = new IntersectionObserver(function (w) {
        w.forEach(function (e) { if (e.isIntersecting) { ioMap.unobserve(e.target); pokazMape(e.target); } });
      }, { rootMargin: '400px 0px' });
      mapy.forEach(function (m) { ioMap.observe(m); });
    } else { mapy.forEach(pokazMape); }
  }
  function zapisz(m) {
    zg = { mapy: !!m, t: Date.now() };
    try { localStorage.setItem(KL, JSON.stringify(zg)); } catch (e) {}
    if (ban) ban.hidden = true;
    odswiezMapy();
  }
  if (ban) {
    ban.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookies]'); if (!b) return;
      zapisz(b.getAttribute('data-cookies') === 'tak');
    });
  }
  document.querySelectorAll('[data-cookies-otworz]').forEach(function (x) {
    x.addEventListener('click', function () { if (ban) { ban.hidden = false; ban.querySelector('button').focus(); } });
  });
})();
