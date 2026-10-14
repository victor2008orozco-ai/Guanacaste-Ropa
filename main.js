/* =========================================================
   INTERFAZ GENERAL
   ========================================================= */

const UI = (() => {
  const $ = (s) => document.querySelector(s);
  const overlay = $("#overlay");

  /* ---------- Scroll suave a una sección ---------- */
  function scrollTo(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (window.lenis) window.lenis.scrollTo(el, { offset: -70, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- Bloquear scroll cuando hay algo abierto ---------- */
  function lock(on) {
    document.body.classList.toggle("is-locked", on);
    if (window.lenis) on ? window.lenis.stop() : window.lenis.start();
  }

  /* ---------- Drawers (carrito y favoritos) ---------- */
  function openDrawer(sel) {
    closeDrawers(true);
    const d = $(sel);
    d.classList.add("is-open");
    d.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-visible");
    lock(true);
    if (window.gsap) gsap.from(d.querySelectorAll(".cart-item"), { x: 40, opacity: 0, stagger: .05, duration: .5, delay: .15, ease: "power3.out" });
  }
  function closeDrawers(keepOverlay = false) {
    document.querySelectorAll(".drawer.is-open").forEach((d) => {
      d.classList.remove("is-open");
      d.setAttribute("aria-hidden", "true");
    });
    if (!keepOverlay) { overlay.classList.remove("is-visible"); lock(false); }
  }

  /* ---------- Modales ---------- */
  let lastFocus = null;
  function openModal(sel) {
    lastFocus = document.activeElement;
    const m = $(sel);
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    lock(true);
    if (window.gsap) gsap.fromTo(m.querySelector(".modal__card"), { y: 40, scale: .96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .55, ease: "power3.out" });
    setTimeout(() => m.querySelector(".modal__close")?.focus(), 50);
  }
  function closeModal(m) {
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.is-open") && !document.querySelector(".drawer.is-open")) lock(false);
    lastFocus?.focus?.();
  }

  /* ---------- Notificaciones ---------- */
  function toast(text, img) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `${img ? `<img src="${img}" alt="" />` : ""}<span>${text}</span>`;
    $("#toasts").appendChild(t);
    if (window.gsap) {
      gsap.fromTo(t, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: "back.out(1.6)" });
      gsap.to(t, { y: -10, opacity: 0, delay: 2.8, duration: .35, onComplete: () => t.remove() });
    } else setTimeout(() => t.remove(), 3000);
  }

  /* ---------- Confeti al pagar ---------- */
  function confetti() {
    if (!window.gsap) return;
    const colors = ["#C2602E", "#D4B483", "#1E3A52", "#5E6B3C", "#E7E8E3"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.background = colors[i % colors.length];
      c.style.left = innerWidth / 2 + "px";
      c.style.top = innerHeight / 2 + "px";
      document.body.appendChild(c);
      gsap.to(c, {
        x: gsap.utils.random(-innerWidth / 2, innerWidth / 2),
        y: gsap.utils.random(-innerHeight / 2, innerHeight / 2),
        rotation: gsap.utils.random(-540, 540),
        opacity: 0, duration: gsap.utils.random(1.2, 2.2), ease: "power3.out",
        onComplete: () => c.remove(),
      });
    }
  }

  /* ---------- Animación de "volar al carrito" ---------- */
  function flyToCart(imgEl) {
    if (!imgEl || !window.gsap) return;
    const from = imgEl.getBoundingClientRect();
    const to = $("#cartOpen").getBoundingClientRect();
    const clone = imgEl.cloneNode();
    clone.className = "fly-clone";
    Object.assign(clone.style, { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px" });
    document.body.appendChild(clone);
    gsap.to(clone, {
      left: to.left + to.width / 2 - 15, top: to.top + to.height / 2 - 15,
      width: 30, height: 30, borderRadius: "50%", opacity: .6,
      duration: .8, ease: "power3.inOut", onComplete: () => clone.remove(),
    });
  }

  return { scrollTo, lock, openDrawer, closeDrawers, openModal, closeModal, toast, confetti, flyToCart };
})();


/* =========================================================
   PRODUCTOS, FILTROS Y FAVORITOS
   ========================================================= */
const Shop = (() => {
  const $ = (s) => document.querySelector(s);
  let filter = "todos";
  let sort = "destacados";
  let wish = loadWish();

  function loadWish() { try { return JSON.parse(localStorage.getItem("marea-wish")) || []; } catch { return []; } }
  function saveWish() { try { localStorage.setItem("marea-wish", JSON.stringify(wish)); } catch {} }

  function filtered() {
    let list = PRODUCTS.filter((p) => {
      if (filter === "todos") return true;
      if (filter === "nuevo" || filter === "oferta") return p.tags.includes(filter);
      return p.cat === filter;
    });
    if (sort === "precio-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "nombre") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function cardHTML(p) {
    const fav = wish.includes(p.id);
    const tag = p.tags.includes("oferta") ? `<span class="tag tag--sale">−${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>`
      : p.tags.includes("nuevo") ? `<span class="tag">Nuevo</span>` : "";
    return `
      <article class="card" data-id="${p.id}">
        <div class="card__media">
          <img src="${p.img}" alt="${p.name}" loading="lazy" />
          ${tag}
          <button class="fav ${fav ? "is-on" : ""}" data-fav="${p.id}" aria-label="${fav ? "Quitar de" : "Guardar en"} favoritos" aria-pressed="${fav}">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9.2C1.6 7.4 4 4 7.3 4c2 0 3.5 1.1 4.7 2.7C13.2 5.1 14.7 4 16.7 4 20 4 22.4 7.4 21 10.8 19 15.6 12 20 12 20Z"/></svg>
          </button>
          <div class="card__quick">
            ${p.sizes.slice(0, 5).map((s) => `<button data-quick="${s}">${s}</button>`).join("")}
          </div>
        </div>
        <div class="card__info">
          <div>
            <h3 class="card__name">${p.name}</h3>
            <p class="card__cat">${CATEGORY_LABEL[p.cat]}</p>
          </div>
          <p class="card__price">${p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : ""}${money(p.price)}</p>
        </div>
        <div class="card__colors">${p.colors.map((c) => `<span style="background:${c}"></span>`).join("")}</div>
      </article>`;
  }

  function render(animate = true) {
    const grid = $("#productGrid");
    const list = filtered();
    const draw = () => {
      grid.innerHTML = list.map(cardHTML).join("");
      $("#gridEmpty").hidden = list.length > 0;
      if (animate && window.gsap) gsap.from(grid.children, { y: 40, opacity: 0, stagger: .06, duration: .6, ease: "power3.out" });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    if (animate && window.gsap && grid.children.length) {
      gsap.to(grid.children, { opacity: 0, y: -15, duration: .2, stagger: .02, onComplete: draw });
    } else draw();
  }

  function setFilter(f) {
    filter = f;
    document.querySelectorAll(".chip").forEach((c) => {
      const on = c.dataset.filter === f;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", on);
    });
    render();
  }

  /* ---------- Favoritos ---------- */
  function toggleWish(id, btn) {
    wish = wish.includes(id) ? wish.filter((w) => w !== id) : [...wish, id];
    saveWish();
    const on = wish.includes(id);
    document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on);
    });
    if (btn && window.gsap) gsap.fromTo(btn, { scale: .6 }, { scale: 1, duration: .5, ease: "back.out(3)" });
    UI.toast(on ? `${findProduct(id).name} guardado en favoritos` : "Quitado de favoritos");
    renderWish();
  }
  function renderWish() {
    $("#wishCount").textContent = wish.length;
    $("#wishCount").classList.toggle("is-visible", wish.length > 0);
    $("#wishEmpty").style.display = wish.length ? "none" : "flex";
    $("#wishList").innerHTML = wish.map((id) => {
      const p = findProduct(id);
      return `<li class="cart-item" data-id="${id}">
        <img src="${p.img}" alt="${p.name}" />
        <div class="cart-item__info"><p class="cart-item__name">${p.name}</p><p class="cart-item__meta">${money(p.price)}</p></div>
        <div class="cart-item__side">
          <button class="btn btn--small" data-wish-view="${id}">Ver</button>
          <button class="link-btn" data-wish-remove="${id}">Quitar</button>
        </div></li>`;
    }).join("");
  }

  /* ---------- Vista rápida ---------- */
  let current = null, chosen = { size: null, color: null, qty: 1 };
  function openProduct(id) {
    const p = findProduct(id);
    current = p;
    chosen = { size: p.sizes.length === 1 ? p.sizes[0] : null, color: p.colors[0], qty: 1 };
    $("#pmImg").src = p.img; $("#pmImg").alt = p.name;
    $("#pmCat").textContent = CATEGORY_LABEL[p.cat];
    $("#pmName").textContent = p.name;
    $("#pmPrice").innerHTML = (p.oldPrice ? `<s>${money(p.oldPrice)}</s> ` : "") + money(p.price);
    $("#pmDesc").textContent = p.desc;
    $("#pmQty").textContent = 1;
    $("#pmError").hidden = true;
    $("#pmColors").innerHTML = p.colors.map((c, i) =>
      `<button class="swatch ${i === 0 ? "is-active" : ""}" style="--c:${c}" data-color="${c}" aria-label="Color ${i + 1}"></button>`).join("");
    $("#pmSizes").innerHTML = p.sizes.map((s) =>
      `<button class="size ${chosen.size === s ? "is-active" : ""}" data-size="${s}">${s}</button>`).join("");
    UI.closeDrawers();
    UI.openModal("#productModal");
    if (window.gsap) gsap.fromTo("#pmImg", { scale: 1.2 }, { scale: 1, duration: 1.1, ease: "power3.out" });
  }

  function addCurrent() {
    if (!chosen.size) {
      $("#pmError").hidden = false;
      if (window.gsap) gsap.fromTo("#pmSizes", { x: -8 }, { x: 0, duration: .4, ease: "elastic.out(1,.3)" });
      return;
    }
    Cart.add(current.id, chosen.size, chosen.color, chosen.qty);
    UI.flyToCart($("#pmImg"));
    UI.toast(`${current.name} agregado al carrito`, current.img);
    UI.closeModal($("#productModal"));
  }

  function bind() {
    document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => setFilter(c.dataset.filter)));
    $("#sortSelect").addEventListener("change", (e) => { sort = e.target.value; render(); });

    // Clicks dentro de la cuadrícula
    $("#productGrid").addEventListener("click", (e) => {
      const fav = e.target.closest("[data-fav]");
      if (fav) { e.stopPropagation(); return toggleWish(fav.dataset.fav, fav); }
      const quick = e.target.closest("[data-quick]");
      if (quick) {
        const card = quick.closest(".card");
        const p = findProduct(card.dataset.id);
        Cart.add(p.id, quick.dataset.quick, p.colors[0], 1);
        UI.flyToCart(card.querySelector("img"));
        UI.toast(`${p.name} talla ${quick.dataset.quick} agregado`, p.img);
        return;
      }
      const card = e.target.closest(".card");
      if (card) openProduct(card.dataset.id);
    });

    // Modal de producto
    $("#pmColors").addEventListener("click", (e) => {
      const b = e.target.closest("[data-color]"); if (!b) return;
      chosen.color = b.dataset.color;
      document.querySelectorAll("#pmColors .swatch").forEach((s) => s.classList.toggle("is-active", s === b));
    });
    $("#pmSizes").addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]"); if (!b) return;
      chosen.size = b.dataset.size;
      $("#pmError").hidden = true;
      document.querySelectorAll("#pmSizes .size").forEach((s) => s.classList.toggle("is-active", s === b));
    });
    $("#pmMinus").addEventListener("click", () => { chosen.qty = Math.max(1, chosen.qty - 1); $("#pmQty").textContent = chosen.qty; });
    $("#pmPlus").addEventListener("click", () => { chosen.qty = Math.min(10, chosen.qty + 1); $("#pmQty").textContent = chosen.qty; });
    $("#pmAdd").addEventListener("click", addCurrent);

    // Favoritos drawer
    $("#wishList").addEventListener("click", (e) => {
      const v = e.target.closest("[data-wish-view]");
      const r = e.target.closest("[data-wish-remove]");
      if (v) openProduct(v.dataset.wishView);
      if (r) toggleWish(r.dataset.wishRemove);
    });

    // Enlaces que filtran (colecciones, footer, menú)
    document.querySelectorAll("[data-filter-link]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      setFilter(a.dataset.filterLink);
      UI.scrollTo("#tienda");
    }));
  }

  return { init() { bind(); render(false); renderWish(); }, openProduct, setFilter };
})();


/* =========================================================
   IMAGEN DE RESPALDO si alguna foto no carga
   ========================================================= */
function useFallback(el) {
  if (el.dataset.fallback) return;
  el.dataset.fallback = "1";
  const label = (el.alt || "Marea").replace(/[<>&"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#1E3A52'/><stop offset='1' stop-color='#C2602E'/></linearGradient></defs><rect width='600' height='800' fill='url(#g)'/><text x='50%' y='50%' fill='white' font-family='sans-serif' font-size='38' text-anchor='middle'>${label}</text></svg>`;
  el.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
document.addEventListener("error", (e) => { if (e.target.tagName === "IMG") useFallback(e.target); }, true);
// Imágenes que ya fallaron antes de que este script cargara
document.querySelectorAll("img").forEach((im) => { if (im.complete && im.naturalWidth === 0 && im.getAttribute("src")) useFallback(im); });

/* =========================================================
   MENÚ, BUSCADOR, CURSOR Y FORMULARIOS
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);

  Cart.init();
  Checkout.init();
  Shop.init();

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Carrito y favoritos ---------- */
  $("#cartOpen").addEventListener("click", () => UI.openDrawer("#cartDrawer"));
  $("#cartClose").addEventListener("click", () => UI.closeDrawers());
  $("#wishOpen").addEventListener("click", () => UI.openDrawer("#wishDrawer"));
  $("#wishClose").addEventListener("click", () => UI.closeDrawers());
  $("#overlay").addEventListener("click", () => UI.closeDrawers());
  $("#cartShop").addEventListener("click", (e) => { e.preventDefault(); UI.closeDrawers(); UI.scrollTo("#tienda"); });

  /* ---------- Modales: cerrar ---------- */
  document.querySelectorAll(".modal").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-close]")) UI.closeModal(m);
    });
  });

  /* ---------- Menú pantalla completa ---------- */
  const menu = $("#menu"), menuBtn = $("#menuBtn");
  let menuOpen = false, menuTl = null;
  if (window.gsap) {
    menuTl = gsap.timeline({ paused: true })
      .set(menu, { visibility: "visible" })
      .fromTo(".menu__bg", { clipPath: "circle(0% at calc(100% - 44px) 36px)" }, { clipPath: "circle(150% at calc(100% - 44px) 36px)", duration: .9, ease: "power3.inOut" })
      .fromTo(".menu__link span", { yPercent: 110 }, { yPercent: 0, stagger: .06, duration: .7, ease: "power4.out" }, "-=.35")
      .fromTo(".menu__preview", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: .8, ease: "power3.out" }, "<")
      .fromTo(".menu__footer > *", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .5 }, "-=.4");
  }
  function toggleMenu(force) {
    menuOpen = force ?? !menuOpen;
    menu.setAttribute("aria-hidden", !menuOpen);
    menuBtn.setAttribute("aria-expanded", menuOpen);
    menuBtn.setAttribute("aria-label", menuOpen ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("menu-open", menuOpen);
    UI.lock(menuOpen);
    if (menuTl) menuOpen ? menuTl.timeScale(1).play() : menuTl.timeScale(1.6).reverse();
    else menu.style.visibility = menuOpen ? "visible" : "hidden";
  }
  menuBtn.addEventListener("click", () => toggleMenu());

  document.querySelectorAll(".menu__link").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const prev = $("#menuPreview");
      if (prev.src === link.dataset.img) return;
      if (window.gsap) {
        gsap.to(prev, { opacity: 0, scale: 1.08, duration: .2, onComplete: () => {
          prev.src = link.dataset.img;
          gsap.to(prev, { opacity: 1, scale: 1, duration: .5, ease: "power2.out" });
        }});
      } else prev.src = link.dataset.img;
    });
    link.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMenu(false);
      if (link.dataset.filter) Shop.setFilter(link.dataset.filter);
      setTimeout(() => UI.scrollTo(link.getAttribute("href")), 450);
    });
  });

  /* Enlaces del header con scroll suave */
  document.querySelectorAll('.nav__link, .logo, .hero__ctas a:not([data-filter-link])').forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); UI.scrollTo(a.getAttribute("href")); }));

  /* ---------- Buscador ---------- */
  const search = $("#search"), sInput = $("#searchInput");
  const openSearch = () => {
    search.classList.add("is-open"); search.setAttribute("aria-hidden", "false");
    UI.lock(true); setTimeout(() => sInput.focus(), 100); renderSearch("");
  };
  const closeSearch = () => {
    search.classList.remove("is-open"); search.setAttribute("aria-hidden", "true");
    UI.lock(false); sInput.value = "";
  };
  function renderSearch(q) {
    const term = q.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => !term || (p.name + " " + p.cat + " " + p.desc).toLowerCase().includes(term));
    $("#searchResults").innerHTML = list.length
      ? list.map((p) => `<button class="sresult" data-id="${p.id}"><img src="${p.img}" alt="" /><span>${p.name}<small>${money(p.price)}</small></span></button>`).join("")
      : `<p class="search__empty">No encontramos “${q.replace(/[<>&]/g, "")}”. Prueba con camisa, chaqueta o reloj.</p>`;
  }
  $("#searchOpen").addEventListener("click", openSearch);
  $("#searchClose").addEventListener("click", closeSearch);
  sInput.addEventListener("input", () => renderSearch(sInput.value));
  $("#searchResults").addEventListener("click", (e) => {
    const r = e.target.closest(".sresult"); if (!r) return;
    closeSearch(); Shop.openProduct(r.dataset.id);
  });

  /* ---------- Tecla Escape cierra todo ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (search.classList.contains("is-open")) return closeSearch();
    const m = document.querySelector(".modal.is-open");
    if (m) return UI.closeModal(m);
    if (document.querySelector(".drawer.is-open")) return UI.closeDrawers();
    if (menuOpen) toggleMenu(false);
  });

  /* ---------- Reserva de probador ---------- */
  const appt = $("#appointmentForm");
  $("#openAppointment").addEventListener("click", () => {
    appt.hidden = !appt.hidden;
    if (!appt.hidden && window.gsap) gsap.from(appt, { height: 0, opacity: 0, duration: .5, ease: "power3.out" });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
  const dateInput = appt.querySelector('input[type="date"]');
  dateInput.min = new Date().toISOString().split("T")[0];
  appt.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(appt);
    UI.toast(`Listo, ${d.get("nombre")}. Te esperamos el ${d.get("dia")} a las ${d.get("hora")}.`);
    appt.reset(); appt.hidden = true;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  /* ---------- Newsletter ---------- */
  $("#newsletterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    UI.toast("Revisa tu correo: tu cupón es BIENVENIDA (15%).");
    e.target.reset();
  });

  /* ---------- Colecciones: deslizar con dedo, mouse o flechas ---------- */
  const track = $("#hTrack");
  const stepSize = () => (track.querySelector(".panel")?.offsetWidth || 400) + 32;
  $("#hPrev").addEventListener("click", () => track.scrollBy({ left: -stepSize(), behavior: "smooth" }));
  $("#hNext").addEventListener("click", () => track.scrollBy({ left: stepSize(), behavior: "smooth" }));

  let hDown = false, hStartX = 0, hStartLeft = 0, hMoved = 0;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;          // en táctil se usa el deslizamiento nativo
    hDown = true; hMoved = 0;
    hStartX = e.clientX; hStartLeft = track.scrollLeft;
    track.classList.add("is-dragging");
  });
  addEventListener("pointermove", (e) => {
    if (!hDown) return;
    const dx = e.clientX - hStartX;
    hMoved = Math.max(hMoved, Math.abs(dx));
    track.scrollLeft = hStartLeft - dx;
  });
  addEventListener("pointerup", () => {
    if (!hDown) return;
    hDown = false;
    track.classList.remove("is-dragging");
  });
  // Si se arrastró, no abrir el enlace al soltar
  track.addEventListener("click", (e) => { if (hMoved > 6) { e.preventDefault(); e.stopPropagation(); hMoved = 0; } }, true);
});