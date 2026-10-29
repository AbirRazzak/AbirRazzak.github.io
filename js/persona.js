(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Ransom-note lettering: split text into individually styled letters.
  // Styles are picked deterministically so the layout is stable between loads.
  var ROTATIONS = [-6, 4, -2, 7, -4, 2, -8, 5];
  var OFFSETS = [0, -0.06, 0.04, -0.03, 0.06, 0, -0.05, 0.03];

  function ransomize(el) {
    var text = el.textContent.trim();
    var seed = text.length;
    var wrap = document.createElement("span");
    wrap.className = "ransom";
    wrap.setAttribute("aria-hidden", "true");

    // Letters are grouped per word so a word never breaks across lines.
    var word = null;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var span = document.createElement("span");
      if (ch === " ") {
        span.className = "ransom__space";
        word = null;
        wrap.appendChild(span);
        continue;
      }
      var n = (i * 7 + ch.charCodeAt(0) + seed) % 6 + 1;
      span.className = "ransom__ch ransom__ch--" + n;
      span.style.setProperty("--r", ROTATIONS[(i + seed) % ROTATIONS.length] + "deg");
      span.style.setProperty("--y", OFFSETS[(i * 3 + seed) % OFFSETS.length] + "em");
      span.textContent = ch;
      if (!word) {
        word = document.createElement("span");
        word.className = "ransom__word";
        wrap.appendChild(word);
      }
      word.appendChild(span);
    }

    var label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = text;

    el.textContent = "";
    el.appendChild(label);
    el.appendChild(wrap);
  }

  document.querySelectorAll("[data-ransom]").forEach(ransomize);

  // Menu captions
  var menuLinks = document.querySelectorAll(".p5-menu a");
  menuLinks.forEach(function (link) {
    if (!link.dataset.sub) return;
    var sub = document.createElement("span");
    sub.className = "p5-menu__sub";
    sub.setAttribute("aria-hidden", "true");
    sub.textContent = link.dataset.sub;
    link.appendChild(sub);
  });

  // Mobile menu toggle
  var nav = document.getElementById("sideNav");
  var toggle = nav.querySelector(".p5-nav__toggle");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  // Page wipe transition for in-page navigation
  var wipe = document.createElement("div");
  wipe.className = "p5-wipe";
  wipe.setAttribute("aria-hidden", "true");
  ["white", "black", "red"].forEach(function (c) {
    var band = document.createElement("div");
    band.className = "p5-wipe__band p5-wipe__band--" + c;
    wipe.appendChild(band);
  });
  document.body.appendChild(wipe);

  var wiping = false;

  function jumpTo(target, hash) {
    root.style.scrollBehavior = "auto";
    target.scrollIntoView();
    root.style.scrollBehavior = "";
    history.pushState(null, "", hash);
  }

  function wipeTo(target, hash) {
    if (reduceMotion || wiping) {
      jumpTo(target, hash);
      return;
    }
    wiping = true;
    wipe.classList.remove("is-out");
    wipe.classList.add("is-in");
    setTimeout(function () {
      jumpTo(target, hash);
      wipe.classList.remove("is-in");
      wipe.classList.add("is-out");
      setTimeout(function () {
        wipe.classList.remove("is-out");
        wiping = false;
      }, 520);
    }, 460);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      var target = hash.length > 1 && document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      wipeTo(target, hash);
    });
  });

  // Highlight the menu item for the section in view
  var sections = Array.prototype.map.call(menuLinks, function (link) {
    return document.querySelector(link.getAttribute("href"));
  });

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        menuLinks.forEach(function (link, i) {
          var active = sections[i] === entry.target;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { if (s) sectionObserver.observe(s); });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 0.06 + "s";
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
