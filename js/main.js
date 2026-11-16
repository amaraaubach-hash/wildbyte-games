/* =========================================================
   WildByte Games — main.js
   1) Menú móvil
   2) Año automático en el footer
   3) Drag & drop de imágenes (ratón + táctil + teclado)
   Sin dependencias. Funciona abriendo el HTML directamente.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1) Menú móvil ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    var closeMenu = function () {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ---------- 2) Año del copyright ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 3) Drag & drop ----------
     Uso en el HTML:
       <div class="drag-zone" data-drag-zone> ...
         <div class="drag-item" data-draggable tabindex="0"> <img ...> </div>
       </div>
     - Cada .drag-item se mueve solo dentro de su .drag-zone.
     - Doble clic / doble toque: vuelve a su sitio.
     - Teclado: flechas para mover (Mayús = más rápido), Escape o 0 para recolocar.
  */
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-draggable]"));
  if (!items.length) return;

  var supportsPointer = "PointerEvent" in window;
  var zTop = 10;
  var state = new WeakMap(); // posición actual de cada elemento

  function getState(el) {
    var s = state.get(el);
    if (!s) { s = { x: 0, y: 0, rot: 0 }; state.set(el, s); }
    return s;
  }

  function apply(el) {
    var s = getState(el);
    el.style.transform = "translate3d(" + s.x + "px," + s.y + "px,0) rotate(" + s.rot + "deg)";
  }

  /* --- Reacciones (saltar, girar, bailar...) --- */
  var TAP_REACTIONS = ["r-jump", "r-spin", "r-wiggle"];
  var SPARKS = ["✨", "⭐", "💥", "🐾", "💫"];

  function getReact(el) { return el.querySelector(":scope > .react"); }

  function playReaction(el, cls) {
    var r = getReact(el);
    if (!r) return;
    r.classList.remove("r-jump", "r-spin", "r-wiggle", "r-land");
    void r.offsetWidth; // reinicia la animación aunque se repita
    r.classList.add(cls);
  }

  function burstSparks(el) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var zone = el.closest("[data-drag-zone]");
    if (!zone) return;
    var zr = zone.getBoundingClientRect(), er = el.getBoundingClientRect();
    var cx = er.left - zr.left + er.width / 2, cy = er.top - zr.top + er.height * 0.35;
    for (var i = 0; i < 7; i++) {
      var sp = document.createElement("span");
      var ang = (Math.PI * 2 * i) / 7 + Math.random() * 0.6;
      var dist = 50 + Math.random() * 45;
      sp.className = "spark";
      sp.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
      sp.style.left = cx + "px";
      sp.style.top = cy + "px";
      sp.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      sp.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      sp.style.setProperty("--rot", (Math.random() * 240 - 120) + "deg");
      zone.appendChild(sp);
      sp.addEventListener("animationend", function () { this.remove(); });
    }
  }

  function tapReaction(el) {
    playReaction(el, TAP_REACTIONS[Math.floor(Math.random() * TAP_REACTIONS.length)]);
    burstSparks(el);
  }

  // Límites: cuánto se puede desplazar el elemento sin salir de su zona
  function computeBounds(el) {
    var zone = el.closest("[data-drag-zone]") || el.parentElement;
    var s = getState(el);
    var zr = zone.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    // Posición "base" (sin transform) del elemento
    var baseLeft = er.left - s.x, baseTop = er.top - s.y;
    var pad = 4;
    return {
      minX: zr.left + pad - baseLeft,
      maxX: zr.right - pad - (baseLeft + er.width),
      minY: zr.top + pad - baseTop,
      maxY: zr.bottom - pad - (baseTop + er.height)
    };
  }

  function clamp(v, min, max) {
    if (min > max) return (min + max) / 2;
    return Math.max(min, Math.min(max, v));
  }

  function markTouched(el) {
    var zone = el.closest("[data-drag-zone]");
    if (zone) zone.classList.add("was-touched");
  }

  function resetItem(el, animated) {
    var s = getState(el);
    s.x = 0; s.y = 0; s.rot = 0;
    if (animated) {
      el.classList.add("is-returning");
      setTimeout(function () { el.classList.remove("is-returning"); }, 460);
    }
    apply(el);
  }

  function resetZone(zone) {
    zone.querySelectorAll("[data-draggable]").forEach(function (el) { resetItem(el, true); });
    zone.classList.remove("was-touched");
  }

  /* --- Motor de arrastre común para pointer / mouse / touch --- */
  var drag = null; // { el, startX, startY, origX, origY, bounds, lastX, lastT, vx, moved, raf }

  function startDrag(el, clientX, clientY) {
    var s = getState(el);
    drag = {
      el: el,
      startX: clientX, startY: clientY,
      origX: s.x, origY: s.y,
      bounds: computeBounds(el),
      lastX: clientX, lastT: performance.now(), vx: 0,
      moved: 0, raf: 0
    };
    el.classList.remove("is-returning");
    el.classList.add("is-dragging");
    el.style.zIndex = String(++zTop);
    markTouched(el);
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return;
    var s = getState(drag.el);
    var dx = clientX - drag.startX, dy = clientY - drag.startY;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    s.x = clamp(drag.origX + dx, drag.bounds.minX, drag.bounds.maxX);
    s.y = clamp(drag.origY + dy, drag.bounds.minY, drag.bounds.maxY);

    // Inclinación según la velocidad horizontal (efecto "peso")
    var now = performance.now(), dt = Math.max(1, now - drag.lastT);
    drag.vx = drag.vx * 0.7 + ((clientX - drag.lastX) / dt) * 0.3;
    drag.lastX = clientX; drag.lastT = now;
    s.rot = clamp(drag.vx * 9, -14, 14);

    if (!drag.raf) {
      var el = drag.el;
      drag.raf = requestAnimationFrame(function () {
        if (drag) drag.raf = 0;
        apply(el);
      });
    }
  }

  var lastTap = { el: null, t: 0 };

  function endDrag() {
    if (!drag) return;
    var el = drag.el, moved = drag.moved;
    if (drag.raf) cancelAnimationFrame(drag.raf);
    var s = getState(el);
    s.rot = 0;
    el.classList.add("is-returning"); // suaviza el "enderezado"
    apply(el);
    setTimeout(function () { el.classList.remove("is-returning"); }, 460);
    el.classList.remove("is-dragging");
    drag = null;

    if (moved >= 6) playReaction(el, "r-land");

    // Toque simple = reacción. Doble toque = recolocar
    if (moved < 6) {
      tapReaction(el);
      var now = performance.now();
      if (lastTap.el === el && now - lastTap.t < 320) {
        resetItem(el, true);
        lastTap.el = null;
      } else {
        lastTap = { el: el, t: now };
      }
    }
  }

  items.forEach(function (el) {
    // Envoltorio interior para las animaciones de reacción
    if (!getReact(el)) {
      var wrap = document.createElement("div");
      wrap.className = "react";
      while (el.firstChild) wrap.appendChild(el.firstChild);
      el.appendChild(wrap);
      wrap.addEventListener("animationend", function (e) {
        if (e.target === wrap) wrap.classList.remove("r-jump", "r-spin", "r-wiggle", "r-land");
      });
    }

    // Evita el "arrastrar imagen" nativo del navegador y el menú de mantener pulsado
    el.querySelectorAll("img").forEach(function (img) {
      img.setAttribute("draggable", "false");
      img.addEventListener("dragstart", function (e) { e.preventDefault(); });
    });
    el.addEventListener("contextmenu", function (e) { if (drag) e.preventDefault(); });
    el.addEventListener("dblclick", function () { resetItem(el, true); });

    if (supportsPointer) {
      // Pointer Events: un único código para ratón, dedo y lápiz
      el.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (drag) return; // ignora un segundo dedo
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        startDrag(el, e.clientX, e.clientY);
        drag.pointerId = e.pointerId;
      });
      el.addEventListener("pointermove", function (e) {
        if (drag && drag.el === el && drag.pointerId === e.pointerId) {
          e.preventDefault();
          moveDrag(e.clientX, e.clientY);
        }
      });
      var up = function (e) {
        if (drag && drag.el === el && drag.pointerId === e.pointerId) {
          try { el.releasePointerCapture(e.pointerId); } catch (_) {}
          endDrag();
        }
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("lostpointercapture", up);
    } else {
      // Respaldo para navegadores muy antiguos sin Pointer Events
      el.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        startDrag(el, e.clientX, e.clientY);
        var mm = function (ev) { moveDrag(ev.clientX, ev.clientY); };
        var mu = function () {
          endDrag();
          document.removeEventListener("mousemove", mm);
          document.removeEventListener("mouseup", mu);
        };
        document.addEventListener("mousemove", mm);
        document.addEventListener("mouseup", mu);
      });
      el.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) return;
        var t = e.touches[0];
        startDrag(el, t.clientX, t.clientY);
      }, { passive: true });
      el.addEventListener("touchmove", function (e) {
        if (!drag) return;
        e.preventDefault(); // bloquea el scroll mientras se arrastra
        var t = e.touches[0];
        moveDrag(t.clientX, t.clientY);
      }, { passive: false });
      el.addEventListener("touchend", endDrag);
      el.addEventListener("touchcancel", endDrag);
    }

    // Teclado (accesibilidad)
    el.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 40 : 12;
      var s = getState(el), b, handled = true;
      if (e.key === "Escape" || e.key === "0") { resetItem(el, true); return; }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapReaction(el); return; }
      b = computeBounds(el);
      if (e.key === "ArrowLeft") s.x = clamp(s.x - step, b.minX, b.maxX);
      else if (e.key === "ArrowRight") s.x = clamp(s.x + step, b.minX, b.maxX);
      else if (e.key === "ArrowUp") s.y = clamp(s.y - step, b.minY, b.maxY);
      else if (e.key === "ArrowDown") s.y = clamp(s.y + step, b.minY, b.maxY);
      else handled = false;
      if (handled) {
        e.preventDefault();
        el.style.zIndex = String(++zTop);
        markTouched(el);
        apply(el);
      }
    });
  });

  // Botones "Recolocar" de cada zona
  document.querySelectorAll("[data-drag-reset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var zone = btn.closest("[data-drag-zone]");
      if (zone) resetZone(zone);
    });
  });

  // Al cambiar el tamaño de la ventana, mantiene cada imagen dentro de su zona
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      items.forEach(function (el) {
        var s = getState(el), b = computeBounds(el);
        s.x = clamp(s.x, b.minX, b.maxX);
        s.y = clamp(s.y, b.minY, b.maxY);
        apply(el);
      });
    }, 120);
  });
})();
