/* THRESHOLD 阈限 — 转盘 / 战斗进程 / 进化史 / 页面温度 */
(() => {
  "use strict";
  // 素材包与 site-design/ 同级；按脚本自身位置解析，中文页（site-design/）和英文页（site-design/en/）共用
  const SCRIPT = document.currentScript && document.currentScript.src;
  const PACK = SCRIPT ? new URL("../../Threshold_宣传素材包_2026-09-24/", SCRIPT).href : "../Threshold_宣传素材包_2026-09-24/";
  const EN = /^en/i.test(document.documentElement.lang);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;

  /* ================= 页面温度 ================= */
  // 冷灰蓝 → 灰烬 → 橙 → 过曝橙红
  const STOPS = [
    [0.00, [143, 163, 184]],
    [0.40, [196, 160, 134]],
    [0.72, [255, 112, 46]],
    [1.00, [255, 64, 32]],
  ];
  function heatColor(h) {
    for (let i = 1; i < STOPS.length; i++) {
      const [p1, c1] = STOPS[i], [p0, c0] = STOPS[i - 1];
      if (h <= p1) {
        const t = (h - p0) / (p1 - p0);
        return c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  let heatNow = 0, heatTarget = 0;
  function applyHeat(h) {
    const [r, g, b] = heatColor(h);
    root.style.setProperty("--heat", h.toFixed(3));
    root.style.setProperty("--hot", `rgb(${r},${g},${b})`);
  }
  applyHeat(0);

  /* ================= 转盘 ================= */
  const N = 72;
  const tt = document.getElementById("turntable");
  const cv = document.getElementById("tt-canvas");
  const ctx = cv.getContext("2d");
  const degEl = document.getElementById("tt-deg");
  const ticksEl = document.getElementById("tt-ticks");
  const frames = new Array(N).fill(null);
  const ticks = [];
  for (let i = 0; i < N; i++) { const t = document.createElement("i"); ticksEl.appendChild(t); ticks.push(t); }

  const src = i => PACK + "02_Boss环绕图/72帧原图/f_" + String(i).padStart(3, "0") + ".webp";
  // 先铺稀疏帧，再逐级加密：拖动时始终有最近的已加载角度可画
  const order = [];
  for (const step of [72, 18, 9, 3, 1]) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
  let cursor = 0;
  function loadNext() {
    if (cursor >= order.length) return;
    const i = order[cursor++];
    const im = new Image();
    im.decoding = "async";
    im.onload = () => { frames[i] = im; ticks[i].classList.add("ok"); if (nearest(frameIndex()) === i) draw(); loadNext(); };
    im.onerror = loadNext;
    im.src = src(i);
  }
  for (let k = 0; k < 4; k++) loadNext();

  let angle = 0;            // 度，0–360
  let vel = 0;              // 度/帧（惯性）
  let dragging = false, touched = false, lastX = 0, lastT = 0;
  const frameIndex = () => ((Math.round(angle / 5) % N) + N) % N;
  function nearest(i) {
    if (frames[i]) return i;
    for (let d = 1; d < N / 2; d++) {
      if (frames[(i + d) % N]) return (i + d) % N;
      if (frames[(i - d + N) % N]) return (i - d + N) % N;
    }
    return -1;
  }
  function resize() {
    const r = tt.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    draw();
  }
  let shown = -1;
  function draw() {
    const i = frameIndex(), n = nearest(i);
    const deg = i * 5;
    degEl.textContent = String(deg).padStart(3, "0");
    tt.setAttribute("aria-valuenow", deg); tt.setAttribute("aria-valuetext", EN ? deg + " degrees" : deg + " 度");
    if (shown >= 0) ticks[shown].classList.remove("now");
    ticks[i].classList.add("now"); shown = i;
    if (n < 0) return;
    ctx.drawImage(frames[n], 0, 0, cv.width, cv.height);
  }
  const DIR = -1;           // 向右拖 = 守卫朝右转
  function setAngle(a) { angle = ((a % 360) + 360) % 360; draw(); }

  tt.addEventListener("pointerdown", e => {
    dragging = true; touched = true; vel = 0; lastX = e.clientX; lastT = performance.now();
    tt.setPointerCapture(e.pointerId);
  });
  tt.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, now = performance.now();
    const w = tt.getBoundingClientRect().width;
    const dA = DIR * dx / w * 360 * 0.9;       // 拖满一个画面宽 ≈ 转 324°
    setAngle(angle + dA);
    vel = dA / Math.max(1, (now - lastT) / 16.7);
    lastX = e.clientX; lastT = now;
  });
  const end = () => { dragging = false; };
  tt.addEventListener("pointerup", end);
  tt.addEventListener("pointercancel", end);
  tt.addEventListener("keydown", e => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "ArrowRight") {
      e.preventDefault(); touched = true; vel = 0;
      setAngle(angle + (k === "ArrowRight" ? 1 : -1) * DIR * 5 * (e.shiftKey ? 3 : 1));   // 与拖动方向一致
    } else if (k === "Home") { e.preventDefault(); touched = true; setAngle(0); }
  });

  let heroVisible = true;
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(tt);
  addEventListener("resize", resize);
  resize();

  function spin() {
    if (heroVisible && !dragging) {
      if (Math.abs(vel) > 0.05) { vel *= 0.94; setAngle(angle + vel); }
      else if (!touched && !reduced) { setAngle(angle + 0.18); }   // 首次触碰前慢速自转，暗示可转
    }
  }

  /* ================= 战斗进程 ================= */
  const fight = document.getElementById("fight");
  const shots = [...fight.querySelectorAll(".shots img")];
  const beats = [...fight.querySelectorAll(".beat")];
  const beatBtns = [...fight.querySelectorAll(".beat-nav button")];
  const flash = fight.querySelector(".flash");
  let beatNow = -1;

  function fightProgress() {
    const r = fight.getBoundingClientRect();
    const span = fight.offsetHeight - innerHeight;
    return clamp(-r.top / span, 0, 1);
  }
  function updateFight() {
    const p = fightProgress();
    const f = p * 6;
    const idx = Math.min(5, Math.floor(f));
    if (idx !== beatNow) {
      shots.forEach((im, i) => im.classList.toggle("on", i === idx));
      beats.forEach((b, i) => b.classList.toggle("on", i === idx));
      beatBtns.forEach((b, i) => { if (i === idx) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      if (idx === 4 && beatNow === 3 && !reduced) {
        flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
      }
      beatNow = idx;
    }
    return p;
  }
  beatBtns.forEach((btn, i) => btn.addEventListener("click", () => {
    const span = fight.offsetHeight - innerHeight;
    scrollTo({ top: fight.offsetTop + span * ((i + 0.5) / 6), behavior: reduced ? "auto" : "smooth" });
  }));
  // 首屏之后预热截图（loading=lazy 只在接近视口时才取）
  shots.forEach(im => { im.decoding = "async"; });

  /* ================= 进化史 ================= */
  const evo = document.getElementById("evolution");
  const track = evo.querySelector(".evo-track");
  const stages = [...evo.querySelectorAll(".stage")];
  const tabs = [...evo.querySelectorAll(".evo-index button")];
  let stageNow = -1;

  function stageOffsets() {
    return stages.map(s => innerWidth / 2 - (s.offsetLeft + s.offsetWidth / 2));
  }
  let offs = [];
  function evoProgress() {
    const r = evo.getBoundingClientRect();
    const span = evo.offsetHeight - innerHeight;
    return clamp(-r.top / span, 0, 1);
  }
  function setStage(i) {
    if (i === stageNow) return;
    stageNow = i;
    stages.forEach((s, k) => {
      s.classList.toggle("on", k === i);
      let v = s.querySelector("video");
      if (k === i) {
        if (!v) {
          v = document.createElement("video");
          v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
          v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
          v.addEventListener("playing", () => { if (stageNow === k) v.classList.add("play"); });
          v.src = s.dataset.video;
          s.querySelector(".stage-media").appendChild(v);
        }
        v.currentTime = 0;
        const p = v.play();
        if (p) p.catch(() => {});
      } else if (v) {
        v.pause();
        v.classList.remove("play");
      }
    });
    tabs.forEach((t, k) => t.setAttribute("aria-selected", String(k === i)));
  }
  function updateEvo() {
    if (!offs.length) offs = stageOffsets();
    const p = evoProgress();
    const f = p * (stages.length - 1);
    const a = Math.floor(f), b = Math.min(stages.length - 1, a + 1), t = f - a;
    const tx = offs[a] + (offs[b] - offs[a]) * t;
    track.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
    const r = evo.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) setStage(Math.round(f));
    return f;
  }
  tabs.forEach((btn, i) => btn.addEventListener("click", () => {
    const span = evo.offsetHeight - innerHeight;
    scrollTo({ top: evo.offsetTop + span * (i / (stages.length - 1)), behavior: reduced ? "auto" : "smooth" });
  }));
  evo.querySelector(".evo-index").addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = clamp(tabs.indexOf(document.activeElement) + (e.key === "ArrowRight" ? 1 : -1), 0, tabs.length - 1);
    tabs[i].focus(); tabs[i].click();
  });
  addEventListener("resize", () => { offs = stageOffsets(); });

  /* ================= 导航当前态 ================= */
  const navLinks = [...document.querySelectorAll(".nav a")];
  const navTargets = navLinks.map(a => document.querySelector(a.getAttribute("href")));

  /* ================= 主循环 ================= */
  const heatSections = [...document.querySelectorAll("[data-heat]")].filter(el => !el.classList.contains("stage"));
  function loop() {
    spin();
    const pF = updateFight();
    const fE = updateEvo();
    const mid = innerHeight / 2;
    const fr = fight.getBoundingClientRect(), er = evo.getBoundingClientRect();
    if (fr.top <= mid && fr.bottom >= mid) {
      heatTarget = clamp(pF * 1.08, 0, 1);
    } else if (er.top <= mid && er.bottom >= mid) {
      const a = Math.floor(fE), b = Math.min(stages.length - 1, a + 1), t = fE - a;
      heatTarget = +stages[a].dataset.heat + (stages[b].dataset.heat - stages[a].dataset.heat) * t;
    } else {
      for (const s of heatSections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { heatTarget = +s.dataset.heat; break; }
      }
    }
    heatNow += (heatTarget - heatNow) * 0.12;
    if (Math.abs(heatTarget - heatNow) > 0.001) applyHeat(heatNow);

    navLinks.forEach((a, i) => {
      const r = navTargets[i].getBoundingClientRect();
      a.classList.toggle("is-current", r.top <= mid && r.bottom >= mid);
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
