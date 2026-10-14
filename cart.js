/* =========================================================
   CARRITO DE COMPRA + CHECKOUT
   ========================================================= */

const Cart = (() => {
  const KEY = "marea-cart";
  let items = load();          // [{key, id, size, color, qty}]
  let coupon = null;           // {code, rate}
  let delivery = "envio";      // "envio" | "tienda"

  const $ = (s) => document.querySelector(s);

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }

  /* ---------- Cálculos ---------- */
  function totals() {
    const sub = items.reduce((s, it) => s + findProduct(it.id).price * it.qty, 0);
    const disc = coupon ? sub * coupon.rate : 0;
    const afterDisc = sub - disc;
    const ship = delivery === "tienda" || afterDisc >= FREE_SHIPPING || sub === 0 ? 0 : SHIPPING_COST;
    return { sub, disc, ship, total: afterDisc + ship, count: items.reduce((s, i) => s + i.qty, 0) };
  }

  /* ---------- Acciones ---------- */
  function add(id, size, color, qty = 1) {
    const key = `${id}-${size}-${color}`;
    const found = items.find((i) => i.key === key);
    if (found) found.qty += qty;
    else items.push({ key, id, size, color, qty });
    save(); render(true);
  }
  function setQty(key, qty) {
    const it = items.find((i) => i.key === key);
    if (!it) return;
    it.qty = Math.max(1, Math.min(10, qty));
    save(); render();
  }
  function remove(key) {
    const row = document.querySelector(`[data-key="${key}"]`);
    const done = () => { items = items.filter((i) => i.key !== key); save(); render(); };
    if (row && window.gsap) gsap.to(row, { x: 60, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: .35, ease: "power2.in", onComplete: done });
    else done();
  }
  function clear() { items = []; coupon = null; save(); render(); }

  function applyCoupon(code) {
    const c = code.trim().toUpperCase();
    const msg = $("#couponMsg");
    if (COUPONS[c]) {
      coupon = { code: c, rate: COUPONS[c] };
      msg.textContent = `Código ${c} aplicado: ${Math.round(COUPONS[c] * 100)}% de descuento.`;
      msg.className = "coupon__msg is-ok";
    } else {
      coupon = null;
      msg.textContent = "Ese código no es válido. Revisa que esté bien escrito.";
      msg.className = "coupon__msg is-error";
    }
    render();
  }

  /* ---------- Render del drawer ---------- */
  function render(bump = false) {
    const t = totals();
    const list = $("#cartList");
    list.innerHTML = items.map((it) => {
      const p = findProduct(it.id);
      return `
        <li class="cart-item" data-key="${it.key}">
          <img src="${p.img}" alt="${p.name}" />
          <div class="cart-item__info">
            <p class="cart-item__name">${p.name}</p>
            <p class="cart-item__meta"><span class="dot" style="background:${it.color}"></span> Talla ${it.size}</p>
            <div class="qty qty--small">
              <button data-act="minus" aria-label="Quitar uno">−</button>
              <span>${it.qty}</span>
              <button data-act="plus" aria-label="Agregar uno">+</button>
            </div>
          </div>
          <div class="cart-item__side">
            <p class="cart-item__price">${money(p.price * it.qty)}</p>
            <button class="link-btn" data-act="remove">Quitar</button>
          </div>
        </li>`;
    }).join("");

    const empty = items.length === 0;
    $("#cartEmpty").style.display = empty ? "flex" : "none";
    $("#cartFoot").style.display = empty ? "none" : "block";
    $("#shipProgress").style.display = empty ? "none" : "block";

    // Barra de envío gratis
    const afterDisc = t.sub - t.disc;
    const pct = Math.min(100, (afterDisc / FREE_SHIPPING) * 100);
    $("#shipBar").style.width = pct + "%";
    $("#shipText").textContent = delivery === "tienda"
      ? "Recoger en tienda no tiene costo."
      : afterDisc >= FREE_SHIPPING ? "¡Tu envío es gratis!" : `Te faltan ${money(FREE_SHIPPING - afterDisc)} para el envío gratis`;

    $("#tSub").textContent = money(t.sub);
    $("#tDiscRow").hidden = !coupon;
    $("#tDisc").textContent = "−" + money(t.disc);
    $("#tShip").textContent = t.ship === 0 ? "Gratis" : money(t.ship);
    $("#tTotal").textContent = money(t.total);

    const badge = $("#cartCount");
    badge.textContent = t.count;
    badge.classList.toggle("is-visible", t.count > 0);
    if (bump && window.gsap) gsap.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: .6, ease: "elastic.out(1, .4)", clearProps: "transform" });
  }

  /* ---------- Eventos del drawer ---------- */
  function bind() {
    $("#cartList").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const key = btn.closest(".cart-item").dataset.key;
      const it = items.find((i) => i.key === key);
      if (btn.dataset.act === "plus") setQty(key, it.qty + 1);
      if (btn.dataset.act === "minus") it.qty === 1 ? remove(key) : setQty(key, it.qty - 1);
      if (btn.dataset.act === "remove") remove(key);
    });

    document.querySelectorAll('input[name="delivery"]').forEach((r) =>
      r.addEventListener("change", () => { delivery = r.value; render(); }));

    $("#couponForm").addEventListener("submit", (e) => {
      e.preventDefault();
      applyCoupon($("#couponInput").value);
    });

    $("#checkoutBtn").addEventListener("click", () => Checkout.open());
  }

  return {
    init() { bind(); render(); },
    add, clear, totals, render,
    get items() { return items; },
    get coupon() { return coupon; },
    get delivery() { return delivery; },
    set delivery(v) {
      delivery = v;
      const r = document.querySelector(`input[name="delivery"][value="${v}"]`);
      if (r) r.checked = true;
      render();
    },
  };
})();


/* =========================================================
   CHECKOUT EN 3 PASOS + MÉTODOS DE PAGO
   ========================================================= */
const Checkout = (() => {
  const $ = (s) => document.querySelector(s);
  let step = 1;
  let payMethod = "tarjeta";

  function open() {
    if (Cart.items.length === 0) return;
    UI.closeDrawers();
    $("#checkoutForm").hidden = false;
    $("#success").hidden = true;
    $("#steps").hidden = false;
    // sincroniza la entrega elegida en el carrito
    const r = document.querySelector(`input[name="entrega"][value="${Cart.delivery}"]`);
    if (r) r.checked = true;
    toggleAddress();
    goTo(1);
    renderSummary();
    UI.openModal("#checkoutModal");
  }

  function goTo(n) {
    step = n;
    document.querySelectorAll(".step").forEach((f) => f.classList.toggle("is-active", +f.dataset.step === n));
    document.querySelectorAll("#steps li").forEach((li, i) => {
      li.classList.toggle("is-active", i + 1 === n);
      li.classList.toggle("is-done", i + 1 < n);
    });
    const active = document.querySelector(`.step[data-step="${n}"]`);
    if (window.gsap) gsap.from(active, { x: 30, opacity: 0, duration: .45, ease: "power3.out" });
    $("#payAmount").textContent = money(Cart.totals().total);
  }

  function validateStep(n) {
    const fs = document.querySelector(`.step[data-step="${n}"]`);
    let ok = true;
    fs.querySelectorAll("input[required]").forEach((inp) => {
      if (inp.closest("[hidden]")) return;
      const valid = inp.checkValidity() && inp.value.trim() !== "";
      inp.closest(".field").classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok && window.gsap) gsap.fromTo(fs, { x: -8 }, { x: 0, duration: .4, ease: "elastic.out(1,.3)" });
    return ok;
  }

  function toggleAddress() {
    const pickup = document.querySelector('input[name="entrega"]:checked').value === "tienda";
    $("#addressFields").hidden = pickup;
    $("#pickupNote").hidden = !pickup;
    Cart.delivery = pickup ? "tienda" : "envio";
    renderSummary();
  }

  function renderSummary() {
    const t = Cart.totals();
    $("#summaryList").innerHTML = Cart.items.map((it) => {
      const p = findProduct(it.id);
      return `<li><img src="${p.img}" alt="" /><span>${p.name}<small>Talla ${it.size} · ${it.qty} ud.</small></span><b>${money(p.price * it.qty)}</b></li>`;
    }).join("");
    $("#summaryTotals").innerHTML = `
      <div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>
      ${Cart.coupon ? `<div><dt>Descuento ${Cart.coupon.code}</dt><dd>−${money(t.disc)}</dd></div>` : ""}
      <div><dt>Envío</dt><dd>${t.ship === 0 ? "Gratis" : money(t.ship)}</dd></div>
      <div class="totals__grand"><dt>Total</dt><dd>${money(t.total)}</dd></div>`;
    $("#payAmount").textContent = money(t.total);
  }

  /* ---------- Tarjeta: formato, marca y validación ---------- */
  function brandOf(num) {
    if (/^4/.test(num)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "Amex";
    return "Tarjeta";
  }
  function luhn(num) {
    let sum = 0, dbl = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = +num[i];
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return num.length >= 13 && sum % 10 === 0;
  }
  function expValid(v) {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const mm = +m[1], yy = 2000 + +m[2];
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    return yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1);
  }

  function bindCard() {
    const num = $("#ccNum"), name = $("#ccName"), exp = $("#ccExp"), cvv = $("#ccCvv"), card = $("#card3d");

    num.addEventListener("input", () => {
      const digits = num.value.replace(/\D/g, "").slice(0, 16);
      num.value = digits.replace(/(.{4})/g, "$1 ").trim();
      const shown = (digits + "•".repeat(16 - digits.length)).replace(/(.{4})/g, "$1 ").trim();
      $("#cardNumView").textContent = shown;
      const b = brandOf(digits);
      $("#cardBrand").textContent = b;
      card.dataset.brand = b.toLowerCase();
    });
    name.addEventListener("input", () => { $("#cardNameView").textContent = name.value || "Tu nombre"; });
    exp.addEventListener("input", () => {
      let v = exp.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      exp.value = v;
      $("#cardExpView").textContent = v || "MM/AA";
    });
    cvv.addEventListener("input", () => {
      cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4);
      $("#cardCvvView").textContent = cvv.value.replace(/./g, "•") || "•••";
    });
    cvv.addEventListener("focus", () => card.classList.add("is-flipped"));
    cvv.addEventListener("blur", () => card.classList.remove("is-flipped"));
  }

  function validatePayment() {
    const err = $("#payError");
    err.hidden = true;
    if (payMethod !== "tarjeta") return true;
    const digits = $("#ccNum").value.replace(/\s/g, "");
    const problems = [];
    if (!luhn(digits)) problems.push("el número de tarjeta");
    if ($("#ccName").value.trim().length < 3) problems.push("el nombre");
    if (!expValid($("#ccExp").value)) problems.push("la fecha de vencimiento");
    if (!/^\d{3,4}$/.test($("#ccCvv").value)) problems.push("el CVV");
    if (problems.length) {
      err.textContent = `Revisa ${problems.join(", ")}. Para probar usa 4242 4242 4242 4242.`;
      err.hidden = false;
      return false;
    }
    return true;
  }

  function submit(e) {
    e.preventDefault();
    if (!validatePayment()) return;
    const btn = $("#payBtn");
    btn.disabled = true;
    btn.classList.add("is-loading");
    btn.innerHTML = '<span class="spinner"></span> Procesando pago';

    // Aquí se conectaría la pasarela real (Stripe, PayPal, etc.)
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove("is-loading");
      btn.innerHTML = 'Pagar <span id="payAmount"></span>';
      $("#checkoutForm").hidden = true;
      $("#steps").hidden = true;
      $("#orderId").textContent = "MS-" + Math.floor(100000 + Math.random() * 900000);
      $("#success").hidden = false;
      if (window.gsap) {
        gsap.from("#success > *", { y: 20, opacity: 0, stagger: .08, duration: .5, ease: "power3.out" });
        gsap.fromTo(".success__check path", { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: .8, delay: .2, ease: "power2.out" });
      }
      UI.confetti();
      Cart.clear();
      $("#checkoutForm").reset();
      ["#cardNumView", "#cardNameView", "#cardExpView", "#cardCvvView"].forEach((s, i) =>
        $(s).textContent = ["•••• •••• •••• ••••", "Tu nombre", "MM/AA", "•••"][i]);
    }, 1800);
  }

  function bind() {
    document.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => {
      if (validateStep(step)) goTo(step + 1);
    }));
    document.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => goTo(step - 1)));
    document.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", toggleAddress));
    document.querySelectorAll("#checkoutForm input").forEach((inp) =>
      inp.addEventListener("input", () => inp.closest(".field")?.classList.remove("is-invalid")));

    document.querySelectorAll(".pay-tab").forEach((tab) => tab.addEventListener("click", () => {
      payMethod = tab.dataset.pay;
      document.querySelectorAll(".pay-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll(".pay-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === payMethod));
      $("#payError").hidden = true;
      const label = { tarjeta: "Pagar", paypal: "Continuar con PayPal", transferencia: "Confirmar pedido", tienda: "Apartar mis prendas" }[payMethod];
      $("#payBtn").innerHTML = `${label} <span id="payAmount">${money(Cart.totals().total)}</span>`;
    }));

    bindCard();
    $("#checkoutForm").addEventListener("submit", submit);
  }

  return { init: bind, open };
})();