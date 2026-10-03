(() => {
  'use strict';

  /* ========================================================
     LENIS SMOOTH SCROLL + GSAP SCROLLTRIGGER INTEGRATION
  ======================================================== */
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lenis;
  if (!prefersReducedMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { offset: -70 });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* ========================================================
     SMOOTH ANCHOR LINKS
  ======================================================== */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(el);
      closeMobileNav();
    });
  });

  /* ========================================================
     HEADER: SCROLLED STATE
  ======================================================== */
  const header = document.getElementById('siteHeader');

  ScrollTrigger.create({
    start: 0,
    onUpdate: (self) => {
      header.classList.toggle('scrolled', self.scroll() > 10);
    },
    end: () => document.documentElement.scrollHeight,
  });

  /* ========================================================
     MOBILE NAV TOGGLE
  ======================================================== */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  function closeMobileNav() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileNav.inert = true;
    document.body.classList.remove('mobile-menu-open');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') !== 'true';
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    mobileNav.classList.toggle('open', isOpen);
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
    mobileNav.inert = !isOpen;
    document.body.classList.toggle('mobile-menu-open', isOpen);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeMobileNav();
      hamburger.focus();
    }
  });

  /* ========================================================
     SCROLL REVEAL (fade-up) FOR ALL .reveal-up ELEMENTS
  ======================================================== */
  const revealEls = gsap.utils.toArray('.reveal-up');
  revealEls.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => el.classList.add('is-visible'),
      once: true,
    });
  });

  /* Hero copy entrance on load (staggered) */
  window.addEventListener('load', () => {
    const heroEls = document.querySelectorAll('.hero .reveal-up');
    gsap.to(heroEls, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      onStart: () => heroEls.forEach((el) => el.classList.add('is-visible')),
    });
  });

  /* Stagger project / service cards */
  gsap.utils.toArray('.projects-grid, .services-cards, .lh-track').forEach((grid) => {
    const items = grid.children;
    ScrollTrigger.create({
      trigger: grid,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(items, { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
        });
      },
    });
  });

  /* ========================================================
     COUNT-UP STATS
  ======================================================== */
  gsap.utils.toArray('.stat-num').forEach((el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(counter.val) + suffix;
          },
        });
      },
    });
  });

  /* ========================================================
     GENERIC CAROUSEL FACTORY (dots + prev/next, single active slide)
  ======================================================== */
  function createSlideCarousel({ slides, dotsContainer, prevBtn, nextBtn, activeClass, autoplay = 0 }) {
    let index = 0;
    const total = slides.length;
    if (!total) return;

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show slide ${i + 1} of ${total}`);
        dot.setAttribute('aria-current', String(i === 0));
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => go(i));
        dotsContainer.appendChild(dot);
      });
    }

    function render() {
      slides.forEach((s, i) => s.classList.toggle(activeClass, i === index));
      if (dotsContainer) {
        [...dotsContainer.children].forEach((d, i) => {
          d.classList.toggle('active', i === index);
          d.setAttribute('aria-current', String(i === index));
        });
      }
    }

    function go(i) {
      index = (i + total) % total;
      render();
      resetAutoplay();
    }

    let timer;
    function resetAutoplay() {
      if (!autoplay) return;
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), autoplay);
    }

    prevBtn && prevBtn.addEventListener('click', () => go(index - 1));
    nextBtn && nextBtn.addEventListener('click', () => go(index + 1));

    render();
    resetAutoplay();
    return { go };
  }

  /* ========================================================
     TESTIMONIAL SLIDER: pages of 2 cards (1 on mobile),
     sliding track + dots + autoplay.
  ======================================================== */
  const ttWrap = document.getElementById('testimonialWrap');
  const ttTrack = document.getElementById('testimonialTrack');
  const ttCards = gsap.utils.toArray('#testimonialTrack .testimonial');

  if (ttWrap && ttTrack && ttCards.length) {
    const ttPageSize = () => (window.innerWidth <= 768 ? 1 : 2);
    let ttPage = 0;

    const ttTotalPages = () => Math.max(1, Math.ceil(ttCards.length / ttPageSize()));

    function renderTtDots() {
      const dotsEl = document.getElementById('testimonialDots');
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      for (let i = 0; i < ttTotalPages(); i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show testimonial page ${i + 1} of ${ttTotalPages()}`);
        dot.setAttribute('aria-current', String(i === ttPage));
        if (i === ttPage) dot.classList.add('active');
        dot.addEventListener('click', () => { ttPage = i; updateTt(); resetTtAutoplay(); });
        dotsEl.appendChild(dot);
      }
    }

    function updateTt() {
      const size = ttPageSize();
      const gap = 24;
      const viewportWidth = ttWrap.offsetWidth;
      const cardWidth = (viewportWidth - gap * (size - 1)) / size;

      ttCards.forEach((card) => { card.style.width = cardWidth + 'px'; });

      const maxPage = ttTotalPages() - 1;
      if (ttPage > maxPage) ttPage = maxPage;
      const step = size * (cardWidth + gap);
      const offset = ttPage * step;
      ttTrack.style.transform = `translateX(-${offset}px)`;
      renderTtDots();
      [...document.getElementById('testimonialDots').children].forEach((dot, i) => {
        dot.classList.toggle('active', i === ttPage);
        dot.setAttribute('aria-current', String(i === ttPage));
      });
    }

    let ttTimer;
    function resetTtAutoplay() {
      clearInterval(ttTimer);
      if (prefersReducedMotion) return;
      ttTimer = setInterval(() => {
        ttPage = (ttPage + 1) % ttTotalPages();
        updateTt();
      }, 5500);
    }

    ttTrack.style.transition = 'transform .5s ease';
    updateTt();
    resetTtAutoplay();
    window.addEventListener('resize', () => { updateTt(); });
  }

  /* ========================================================
     LIGHTHOUSE PERFORMANCE: client list highlights one at a
     time (underline + arrow), driving the laptop screen
     carousel, with autoplay.
  ======================================================== */
  const laptopTrack = document.getElementById('laptopTrack');
  const perfClientItems = gsap.utils.toArray('#perfClientList .perf-client-item');

  if (laptopTrack && perfClientItems.length) {
    let perfIndex = 0;
    const perfTotal = perfClientItems.length;
    let perfTimer;

    function renderPerf() {
      laptopTrack.style.transform = `translateX(-${perfIndex * 100}%)`;
      perfClientItems.forEach((item, i) => item.classList.toggle('is-active', i === perfIndex));
    }

    function resetPerfAutoplay() {
      clearInterval(perfTimer);
      if (prefersReducedMotion) return;
      perfTimer = setInterval(() => goPerf(perfIndex + 1), 4000);
    }

    function goPerf(i) {
      perfIndex = (i + perfTotal) % perfTotal;
      renderPerf();
      resetPerfAutoplay();
    }

    perfClientItems.forEach((item, i) => {
      item.addEventListener('click', () => goPerf(i));
      item.addEventListener('mouseenter', () => goPerf(i));
    });

    resetPerfAutoplay();
  }

  /* ========================================================
     FAQ ACCORDION: one answer open at a time.
  ======================================================== */
  const faqItems = gsap.utils.toArray('#faqList .faq-item');

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    answer.id = `faq-answer-${faqItems.indexOf(item) + 1}`;
    question.setAttribute('aria-controls', answer.id);

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-answer').style.maxHeight = '';
      });

      if (!isOpen) {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });

  /* ========================================================
     PROJECT GALLERY: pinned section — columns of screenshots
     glide past at different speeds while it stays fixed.
  ======================================================== */
  const galleryPin = document.getElementById('galleryPin');
  const galleryCols = gsap.utils.toArray('.gallery-col');

  if (galleryPin && galleryCols.length) {
    let galleryTl;

    const setupGalleryScroll = () => {
      if (galleryTl) {
        galleryTl.scrollTrigger.kill();
        galleryTl.kill();
        gsap.set(galleryCols, { y: 0 });
      }

      const pinHeight = galleryPin.clientHeight;
      const bottomBuffer = 40;

      const travels = galleryCols.map((col) => {
        const marginTop = parseFloat(getComputedStyle(col).marginTop) || 0;
        return Math.max(0, marginTop + col.scrollHeight - (pinHeight - bottomBuffer));
      });
      const maxTravel = Math.max(1, ...travels);

      // Scroll distance matches the longest column's travel 1:1, so the
      // glide tracks the wheel naturally instead of racing ahead of it.
      galleryTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#gallery',
          start: () => `top top+=${document.getElementById('siteHeader').offsetHeight}`,
          end: `+=${maxTravel}`,
          scrub: 1.2,
          pin: true,
        },
      });

      galleryCols.forEach((col, i) => {
        galleryTl.to(col, { y: -travels[i], ease: 'none' }, 0);
      });
    };

    setupGalleryScroll();
    window.addEventListener('resize', setupGalleryScroll);
  }

  /* ========================================================
     LOGO MARQUEE: duplicate content for seamless loop
  ======================================================== */
  const logoTrack = document.getElementById('logoTrack');
  if (logoTrack) {
    logoTrack.innerHTML += logoTrack.innerHTML;
  }

  /* ========================================================
     SECTION-DARK / CTA CONTRAST ON LOGO MARQUEE RESPECT REDUCED MOTION
  ======================================================== */
  if (prefersReducedMotion && logoTrack) {
    logoTrack.style.animation = 'none';
  }

  ScrollTrigger.refresh();
})();
