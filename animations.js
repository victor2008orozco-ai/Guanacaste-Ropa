/* =========================================================
   ANIMACIONES CON GSAP + SCROLLTRIGGER
   ========================================================= */

(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) document.documentElement.classList.add("reduce");

  // Si GSAP no cargó (sin internet), la página sigue funcionando sin animaciones
  if (!window.gsap) {
    document.getElementById("preloader")?.remove();
    document.documentElement.classList.add("no-gsap");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll suave con Lenis ---------- */
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- Dividir el título en letras ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    el.innerHTML = [...el.textContent].map((c) => `<span class="char"><span>${c}</span></span>`).join("");
  });
  const chars = gsap.utils.toArray(".hero__word .char > span");

  /* =========================================================
     1. PRELOADER + ENTRADA DEL HERO
     ========================================================= */
  const counter = { v: 0 };
  const intro = gsap.timeline({ paused: true })
    .from(chars, { yPercent: 115, rotate: 8, stagger: 0.06, duration: 1.1, ease: "power4.out" })
    .from(".hero__img", {
      clipPath: "inset(100% 0% 0% 0%)", scale: 1.15, stagger: 0.12, duration: 1.3, ease: "power4.out",
    }, "<0.1")
    .from(".hero__bottom > *, .hero__scroll", { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" }, "-=0.9")
    .from(".header", { opacity: 0, duration: 0.8, ease: "power2.out", clearProps: "opacity" }, "<");

  if (reduce) {
    document.getElementById("preloader").remove();
    intro.progress(1);
  } else {
    gsap.timeline()
      .to(counter, {
        v: 100, duration: 1.8, ease: "power2.inOut",
        onUpdate: () => {
          document.getElementById("loaderCount").textContent = Math.round(counter.v);
          document.getElementById("loaderBar").style.width = counter.v + "%";
        },
      })
      .to(".preloader__brand, .preloader__count", { yPercent: -60, opacity: 0, duration: 0.5, ease: "power3.in" })
      .to(".preloader", {
        clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "power4.inOut",
        onComplete: () => {
          document.getElementById("preloader").remove();
          window.lenis?.start();
        },
      })
      .add(() => intro.play(), "-=0.5");
  }

  /* =========================================================
     2. HEADER: se oculta al bajar y aparece al subir
     ========================================================= */
  const header = document.getElementById("header");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle("is-scrolled", y > 40);
      if (!document.body.classList.contains("menu-open")) {
        header.classList.toggle("is-hidden", self.direction === 1 && y > 400);
      }
    },
  });

  /* =========================================================
     3. MARQUEE que acelera con la velocidad del scroll
     ========================================================= */
  const marquee = gsap.to("#marquee", { xPercent: -50, duration: 24, ease: "none", repeat: -1 });
  if (!reduce) {
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity() / 250;
        gsap.to(marquee, { timeScale: (self.direction === 1 ? 1 : -1) * (1 + Math.min(Math.abs(v), 6)), duration: 0.2, overwrite: true });
        gsap.to(marquee, { timeScale: self.direction === 1 ? 1 : -1, duration: 1, delay: 0.25, overwrite: false });
      },
    });
  }

  /* =========================================================
     6. CARRUSEL 3D: gira con scroll + arrastre (dedo o mouse)
     ========================================================= */
  const ring = document.getElementById("ring");
  const viewport = document.getElementById("ringViewport");
  const items = PRODUCTS.slice(0, 10);
  const n = items.length;
  const step = 360 / n;

  ring.innerHTML = items.map((p, i) => `
    <button class="ring__item" data-id="${p.id}" style="--i:${i}" aria-label="Ver ${p.name}">
      <img src="${p.img.replace("w=900", "w=600")}" alt="${p.name}" draggable="false" />
    </button>`).join("");
  const els = gsap.utils.toArray(".ring__item");

  let radius = 0;
  function layout() {
    const w = els[0].offsetWidth;
    radius = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.12);
    els.forEach((el, i) => { el.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
  }
  layout();
  addEventListener("resize", layout);

  // Estado: rotación por scroll + rotación por arrastre
  const state = { scroll: 0, drag: 0 };
  let current = 0;
  let activeIdx = -1;
  const capName = document.querySelector(".ring-caption__name");
  const capPrice = document.querySelector(".ring-caption__price");

  gsap.ticker.add(() => {
    const target = state.scroll + state.drag;
    current += (target - current) * 0.12;
    ring.style.transform = `translateZ(${-radius}px) rotateY(${current}deg)`;

    // Opacidad y escala según qué tan de frente está cada prenda
    els.forEach((el, i) => {
      const a = ((i * step + current) * Math.PI) / 180;
      const facing = Math.cos(a);
      el.style.opacity = 0.25 + 0.75 * Math.max(0, facing);
      el.style.filter = `saturate(${0.4 + 0.6 * Math.max(0, facing)})`;
      el.classList.toggle("is-back", facing < 0);
    });

    const idx = ((Math.round(-current / step) % n) + n) % n;
    if (idx !== activeIdx) {
      activeIdx = idx;
      capName.textContent = items[idx].name;
      capPrice.textContent = money(items[idx].price);
      gsap.fromTo(".ring-caption", { y: 10, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
    }
  });

  // Encaja la prenda más cercana al frente
  function snap() {
    const total = state.scroll + state.drag;
    const snapped = Math.round(total / step) * step;
    gsap.to(state, { drag: state.drag + (snapped - total), duration: 0.6, ease: "power3.out" });
  }

  // Arrastre con dedo o mouse + inercia
  let down = false, startX = 0, startDrag = 0, lastX = 0, lastT = 0, vel = 0, moved = 0, pressedItem = null;
  viewport.addEventListener("pointerdown", (e) => {
    down = true; moved = 0;
    startX = lastX = e.clientX; lastT = performance.now();
    startDrag = state.drag;
    pressedItem = e.target.closest(".ring__item");
    gsap.killTweensOf(state, "drag");
    viewport.classList.add("is-dragging");
  });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const now = performance.now();
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    state.drag = startDrag + dx * 0.3;
    vel = ((e.clientX - lastX) / Math.max(1, now - lastT)) * 16; // px por frame
    lastX = e.clientX; lastT = now;
  });
  addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    viewport.classList.remove("is-dragging");
    if (moved < 6 && pressedItem) {
      Shop.openProduct(pressedItem.dataset.id);
      return;
    }
    gsap.to(state, { drag: state.drag + vel * 6, duration: 1.1, ease: "power3.out", onComplete: snap });
  });

  // Si el navegador toma el gesto para hacer scroll vertical, soltamos el arrastre
  addEventListener("pointercancel", () => {
    if (!down) return;
    down = false;
    viewport.classList.remove("is-dragging");
    snap();
  });

  // Rueda horizontal del trackpad
  viewport.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      state.drag -= e.deltaX * 0.15;
      clearTimeout(viewport._t);
      viewport._t = setTimeout(snap, 180);
    }
  }, { passive: false });

  // Botones y teclado
  const go = (dir) => gsap.to(state, { drag: state.drag + dir * step, duration: 0.8, ease: "power3.inOut", onComplete: snap });
  document.getElementById("ringPrev").addEventListener("click", () => go(1));
  document.getElementById("ringNext").addEventListener("click", () => go(-1));
  els.forEach((el) => el.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(1);
    if (e.key === "ArrowRight") go(-1);
  }));
  // El click con teclado (Enter/Espacio) también abre la prenda
  els.forEach((el) => el.addEventListener("click", (e) => { if (e.detail === 0) Shop.openProduct(el.dataset.id); }));

  /* =========================================================
     4. RESPONSIVO + MOVIMIENTO (solo si el usuario lo permite)
     ========================================================= */
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {

    /* ---- Parallax del hero ---- */
    gsap.utils.toArray(".hero__img").forEach((fig) => {
      const speed = parseFloat(fig.dataset.speed);
      gsap.to(fig, {
        y: () => speed * innerHeight * 0.7, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    });
    gsap.to(".hero__img--b img", {
      scale: 1.25, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__title", {
      yPercent: 40, opacity: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(chars, {
      yPercent: (i) => (i % 2 ? -30 : 30), ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    /* ---- 5. IMAGEN QUE SE EXPANDE mientras la sección entra en pantalla
              (sin fijar la página: el scroll nunca se detiene) ---- */
    gsap.timeline({
      scrollTrigger: { trigger: "#expand", start: "top 85%", end: "top top", scrub: 1 },
    })
      .to("#expandMedia", { width: "100vw", height: "100vh", borderRadius: 0, ease: "power2.inOut", duration: 1 })
      .to("#expandMedia img", { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
      .to(".expand__side--l", { xPercent: -160, opacity: 0, duration: 0.8 }, 0)
      .to(".expand__side--r", { xPercent: 160, opacity: 0, duration: 0.8 }, 0)
      .fromTo(".expand__copy > *", { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 }, 0.6);

    /* ---- 6. CARRUSEL 3D: gira mientras la sección pasa por la pantalla ---- */
    ScrollTrigger.create({
      trigger: ".ring-section", start: "top bottom", end: "bottom top", scrub: true,
      onUpdate: (self) => { state.scroll = -self.progress * 252; },
    });
    gsap.from("#ringViewport", {
      scale: 0.75, opacity: 0.3, ease: "none",
      scrollTrigger: { trigger: ".ring-section", start: "top bottom", end: "top 20%", scrub: true },
    });

    /* ---- 7. COLECCIONES: la fila se corre un poco al bajar y las fotos tienen parallax ---- */
    gsap.fromTo("#hTrack .panel", { x: 60 }, {
      x: -60, ease: "none",
      scrollTrigger: { trigger: "#coleccion", start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.utils.toArray(".panel img").forEach((im) => {
      gsap.fromTo(im, { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: im.closest(".panel"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    /* ---- 8. LOOKBOOK: columnas a distinta velocidad ---- */
    gsap.utils.toArray(".lookbook__col").forEach((col) => {
      const s = parseFloat(col.dataset.speed);
      gsap.fromTo(col, { y: () => -s * 400 }, {
        y: () => s * 400, ease: "none",
        scrollTrigger: { trigger: ".lookbook", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
    });
    gsap.to(".lookbook__title", {
      xPercent: -25, ease: "none",
      scrollTrigger: { trigger: ".lookbook", start: "top bottom", end: "bottom top", scrub: true },
    });

    /* ---- 9. FOTO DEL LOCAL con parallax interior ---- */
    gsap.fromTo("[data-speed-img]", { yPercent: -12 }, {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".local", start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.from(".local__media", {
      clipPath: "inset(15% 15% 15% 15% round 32px)", ease: "none",
      scrollTrigger: { trigger: ".local", start: "top 85%", end: "top 25%", scrub: true },
    });

    /* ---- Texto gigante del footer ---- */
    gsap.from(".footer__big", {
      yPercent: 60, ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  });

  /* Recalcular posiciones cuando cargan las imágenes */
  addEventListener("load", () => ScrollTrigger.refresh());
})();