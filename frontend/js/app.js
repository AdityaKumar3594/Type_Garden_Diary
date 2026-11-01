
const FONTS = {
  playfair: {
    name: 'Playfair Display',
    family: '"Playfair Display", Georgia, serif',
    svgFamily: 'Playfair Display, Georgia, serif',
    weight: '700'
  },
  cormorant: {
    name: 'Cormorant Garamond',
    family: '"Cormorant Garamond", "Times New Roman", serif',
    svgFamily: 'Cormorant Garamond, Times New Roman, serif',
    weight: '700'
  },
  fraunces: {
    name: 'Fraunces',
    family: '"Fraunces", Georgia, serif',
    svgFamily: 'Fraunces, Georgia, serif',
    weight: '700'
  },
  cinzel: {
    name: 'Cinzel',
    family: '"Cinzel", "Times New Roman", serif',
    svgFamily: 'Cinzel, Times New Roman, serif',
    weight: '700'
  },
  montserrat: {
    name: 'Montserrat',
    family: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    svgFamily: 'Montserrat, sans-serif',
    weight: '700'
  },
  caveat: {
    name: 'Caveat',
    family: '"Caveat", cursive, sans-serif',
    svgFamily: 'Caveat, cursive, sans-serif',
    weight: '700'
  },
  dancing: {
    name: 'Dancing Script',
    family: '"Dancing Script", cursive, sans-serif',
    svgFamily: 'Dancing Script, cursive, sans-serif',
    weight: '700'
  },
  mono: {
    name: 'DM Mono',
    family: '"DM Mono", ui-monospace, monospace',
    svgFamily: 'DM Mono, monospace',
    weight: '500'
  }
};

const FONT_SIZES = {
  small: { name: 'Size: Small', scale: 0.75 },
  medium: { name: 'Size: Medium', scale: 1.0 },
  large: { name: 'Size: Large', scale: 1.25 },
  xlarge: { name: 'Size: Extra Large', scale: 1.55 }
};

const F = '"Playfair Display",Georgia,serif';
const SENT = '\u200b';
// name, background, flower, stem & leaf, flower line, type
const PAL = [
 ['Rose noir','#000000','#FF1400','#3257FF','#FFB4A8','#FFFFFF'],
 ['Paper','#F3EEE4','#FF3B1F','#1C2B8F','#FFD2C4','#111111'],
 ['Midnight','#0D1B4C','#FF5A4E','#9FB4FF','#FFD6CF','#FFFFFF'],
 ['Citrus','#0E1A12','#FF8A00','#1FA463','#FFE2B8','#FFF6E8'],
 ['Orchid','#140A1F','#E63CFF','#2FB8A6','#F9D1FF','#FFFFFF'],
 ['Moss','#133A2A','#FFB7C5','#7FD18B','#FFFFFF','#F6F1E7'],
 ['Tomato','#FF1400','#FFF1E0','#0B0B0B','#FF1400','#000000'],
 ['Butter','#FFE9A8','#E4002B','#0F5132','#FFC2C2','#1A1A1A'],
 ['Blush','#FAD4D8','#C8102E','#274690','#FFE3E6','#1A1A1A'],
 ['Mono','#000000','#F2F2F2','#6E6E6E','#000000','#FFFFFF']
];
const MAX = 1500;
const props = { boil: true, recoil: 20, density: 1 };

class Garden {
  constructor() {
    this.cv = document.getElementById('cv'); this.inp = document.getElementById('inp');
    this.g = this.cv.getContext('2d');
    this.palette = 0; this.locked = true; this.letters = []; this.uid = 1; this.cache = {}; this.Sd = 0; this.St = 0; this.wrapped = false;
    this.fontKey = 'playfair'; this.sizeKey = 'medium'; this.sizeScale = 1.0;
    try {
      const sf = localStorage.getItem('tg_font');
      if (sf && FONTS[sf]) this.fontKey = sf;
      const ss = localStorage.getItem('tg_size');
      if (ss && FONT_SIZES[ss]) { this.sizeKey = ss; this.sizeScale = FONT_SIZES[ss].scale; }
    } catch (_) {}
    this._history = []; this._histIdx = -1; // undo/redo
    this.t0 = performance.now(); this.lastKey = 0; this.fa = {}; this.mx = null; this.flies = []; this.perch = [];
    this.iv = SENT; this.inp.value = SENT;
    this.touch = matchMedia('(pointer: coarse)').matches; this.ptype = 'mouse';
    addEventListener('resize', () => this.resize());
    addEventListener('keydown', e => this.key(e));
    addEventListener('pointermove', e => { this.mx = e.clientX; this.my = e.clientY; });
    addEventListener('pointerdown', e => { this.ptype = e.pointerType || 'mouse'; }, true);
    const up = e => { if (e.pointerType && e.pointerType !== 'mouse') this.mx = null; };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    document.addEventListener('pointerleave', () => { this.mx = null; });
    this.inp.addEventListener('input', () => this.inputDiff());
    this.inp.addEventListener('compositionstart', () => { this.composing = true; });
    this.inp.addEventListener('compositionend', () => { this.composing = false; setTimeout(() => this.inputDiff(), 0); });
    const app = document.getElementById('app');
    app.addEventListener('pointerdown', e => {
      const touch = e.pointerType && e.pointerType !== 'mouse', onCv = e.target === this.cv;
      if (touch) {
        if (e.cancelable && (onCv || e.target.closest('button') || e.target.closest('select'))) e.preventDefault();
      } else {
        if (!e.target.closest('select') && !e.target.closest('button')) {
          this.inp.focus({ preventScroll: true });
        }
      }
      if (onCv) this.spawnFly(e.clientX, e.clientY);
    });
    app.addEventListener('click', e => { if (this.ptype !== 'mouse' && e.target === this.cv) this.inp.focus({ preventScroll: true }); });
    document.getElementById('png').onclick = () => { this.savePNG(); this.refocus(); };
    document.getElementById('svg').onclick = () => { this.saveSVG(); this.refocus(); };
    this.setupDropdowns();
    this.buildPal(); this.applyPal();
    this.resize();
    this.loadFont(this.fontKey);
    const loop = () => { requestAnimationFrame(loop); this.frame(); }; loop();
    if (!this.touch) setTimeout(() => this.inp.focus({ preventScroll: true }), 50);
  }
  getFontConfig() { return FONTS[this.fontKey] || FONTS.playfair; }
  getFontString(size) { const f = this.getFontConfig(); return `${f.weight} ${size}px ${f.family}`; }
  loadFont(fontKey) {
    const f = FONTS[fontKey] || FONTS.playfair;
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`${f.weight} 100px ${f.family}`).then(() => {
        this.cache = {}; this.layout(true);
      }).catch(() => {});
    }
  }
  setFont(fontKey, save = true) {
    if (!FONTS[fontKey]) fontKey = 'playfair';
    this.fontKey = fontKey;
    this.cache = {};
    if (save) { try { localStorage.setItem('tg_font', fontKey); } catch (_) {} }
    const sel = document.getElementById('font-select');
    if (sel) {
      if (sel.value !== fontKey) sel.value = fontKey;
      sel.style.fontFamily = this.getFontConfig().family;
    }
    this.loadFont(fontKey);
    this.layout(true);
  }
  setFontSize(sizeKey, save = true) {
    if (!FONT_SIZES[sizeKey]) sizeKey = 'medium';
    this.sizeKey = sizeKey;
    this.sizeScale = FONT_SIZES[sizeKey].scale;
    if (save) { try { localStorage.setItem('tg_size', sizeKey); } catch (_) {} }
    const sel = document.getElementById('size-select');
    if (sel && sel.value !== sizeKey) sel.value = sizeKey;
    this.layout(false);
  }
  setupDropdowns() {
    const fontSel = document.getElementById('font-select');
    if (fontSel) {
      fontSel.value = this.fontKey;
      fontSel.style.fontFamily = this.getFontConfig().family;
      fontSel.addEventListener('change', () => { this.setFont(fontSel.value); this.refocus(); });
      fontSel.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const sizeSel = document.getElementById('size-select');
    if (sizeSel) {
      sizeSel.value = this.sizeKey;
      sizeSel.addEventListener('change', () => { this.setFontSize(sizeSel.value); this.refocus(); });
      sizeSel.addEventListener('pointerdown', e => e.stopPropagation());
    }
  }
  refocus() { if (this.ptype === 'mouse') this.inp.focus({ preventScroll: true }); }
  pal() { const p = PAL[this.palette]; return { bg: p[1], C: { red: p[2], blue: p[3], line: p[4], text: p[5], vein: p[1] } }; }
  buildPal() {
    const box = document.getElementById('pal'); box.innerHTML = '';
    PAL.forEach((p, i) => {
      const b = document.createElement('button'); b.title = b.ariaLabel = p[0];
      b.style.background = p[1]; b.innerHTML = `<i style="background:${p[2]}"></i>`;
      b.onclick = e => { e.stopPropagation(); this.palette = i; this.applyPal(); this.refocus(); };
      box.appendChild(b);
    });
  }
  applyPal() {
    const P = this.pal(), app = document.getElementById('app');
    app.style.background = P.bg; document.getElementById('bar').style.color = P.C.text; document.getElementById('top').style.color = P.C.text;
    document.getElementById('pal').style.background = P.bg;
    [...document.getElementById('pal').children].forEach((b, i) => {
      const on = i === this.palette;
      b.style.border = `1.5px solid ${on ? P.C.text : (PAL[i][1] === P.bg ? '#3A3A3A' : 'transparent')}`;
      b.style.transform = on ? 'scale(1.1)' : '';
    });
  }

  // ---------- math ----------
  h(n) { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); }
  spr(t, k = 7, w = 16) { return t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * w); }
  eo(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  rng(seed) {
    let s = seed | 0;
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  bez(a, b, c, d, n) {
    const P = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
      P.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]); }
    return P;
  }
  at(P, u) { const n = P.length, i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1)))); return [P[i], Math.atan2(P[i+1][1] - P[i-1][1], P[i+1][0] - P[i-1][0])]; }
  jit(id, f, amp) { if (!amp) return [0, 0, 0]; return [(this.h(id*1.37 + f*7.13)*2 - 1)*amp, (this.h(id*2.71 + f*3.11)*2 - 1)*amp, (this.h(id*5.3 + f*1.7)*2 - 1)*0.035]; }
  path(c, p, closed) {
    const n = p.length; if (n < 2) return;
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const s = m(p[n-1], p[0]); c.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const q = m(p[i], p[(i+1) % n]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.closePath();
    } else {
      c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n - 1; i++) { const q = m(p[i], p[i+1]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.lineTo(p[n-1][0], p[n-1][1]);
    }
  }
  backend(g) {
    return {
      fill: (p, col) => { g.beginPath(); this.path(g, p, true); g.fillStyle = col; g.fill(); },
      stroke: (p, col, w) => { g.beginPath(); this.path(g, p, false); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); },
      rect: (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); },
      text: (ch, x, y, S, col) => { g.font = this.getFontString(S); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.fillText(ch, x, y); }
    };
  }
  vine(base, dir, len, amp, waves, ph, bend, n) {
    n = n || 40; const P = [[base[0], base[1]]], step = len / n; let x = base[0], y = base[1];
    for (let i = 1; i <= n; i++) {
      const u = i / n, a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
      x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
    }
    return P;
  }
  curl(P, sign, rad) {
    const n = P.length, e = P[n - 1], a = Math.atan2(e[1] - P[n - 2][1], e[0] - P[n - 2][0]);
    const c = [e[0] - Math.sin(a) * sign * rad, e[1] + Math.cos(a) * sign * rad], a0 = Math.atan2(e[1] - c[1], e[0] - c[0]);
    for (let i = 1; i <= 14; i++) { const u = i / 14, t = a0 + sign * u * Math.PI * 1.6, rr = rad * (1 - 0.5 * u); P.push([c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr]); }
    return P;
  }
  weave(r, startLayer) {
    const cuts = [], nc = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nc; i++) cuts.push(0.15 + r() * 0.7);
    cuts.sort((a, b) => a - b);
    const segs = []; let u0 = 0, layer = startLayer;
    for (const c of cuts) {
      if (c <= u0) continue;
      segs.push({ u0, u1: c, layer });
      if (r() < 0.3) u0 = Math.min(0.98, c + 0.02 + r() * 0.03); else u0 = c;
      layer = 1 - layer;
    }
    segs.push({ u0, u1: 1, layer });
    return segs;
  }
  layerAt(segs, u) { for (const s of segs) if (u >= s.u0 && u <= s.u1) return s.layer; return segs[segs.length - 1].layer; }

  // ---------- layout ----------
  resize() {
    const r = this.cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    this.W = r.width; this.H = r.height; this.dpr = d;
    this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d);
    this.layout(true);
  }
  mw(ch) {
    if (ch === '\n') return 0;
    if (this.cache[ch] != null) return this.cache[ch];
    this.g.font = this.getFontString(100);
    let w = this.g.measureText(ch).width / 100; if (ch === ' ') w *= 1.4;
    return (this.cache[ch] = w);
  }
  layoutCore(A, W, H, prevWrapped) {
    const scale = this.sizeScale || 1.0;
    const maxW = W * 0.8, S0 = H * 0.28 * scale, LH = 2.0, ws = A.map(l => this.mw(l.ch));
    const words = []; let cur = null;
    A.forEach((l, i) => {
      if (l.ch === '\n') {
        if (cur) { words.push(cur); cur = null; }
        words.push({ nl: true, idx: [i] });
      } else if (l.ch === ' ') {
        if (cur) { words.push(cur); cur = null; }
        words.push({ sp: true, idx: [i] });
      } else {
        if (!cur) cur = { idx: [] };
        cur.idx.push(i);
      }
    });
    if (cur) words.push(cur);
    const lineW = (li, S) => {
      let e = li.length;
      while (e > 0 && (A[li[e-1]].ch === ' ' || A[li[e-1]].ch === '\n')) e--;
      let w = 0;
      for (let k = 0; k < e; k++) w += ws[li[k]];
      return w * S;
    };
    const wrap = S => {
      const lines = [[]]; let lw = 0;
      for (const w of words) {
        if (w.nl) {
          lines[lines.length - 1].push(...w.idx);
          lines.push([]);
          lw = 0;
          continue;
        }
        const ww = w.idx.reduce((s, i) => s + ws[i], 0) * S;
        if (!w.sp && lw > 0 && lw + ww > maxW) {
          lines.push([]);
          lw = 0;
        }
        lines[lines.length - 1].push(...w.idx);
        lw += ww;
      }
      return lines;
    };
    const hasNL = words.some(w => w.nl);
    const multi = words.filter(w => !w.sp && !w.nl).length > 1;
    let lines = wrap(S0);
    let wrapped = hasNL || (multi && (prevWrapped || lines.length > 1));
    let S = S0;
    if (wrapped) {
      const maxH = H * 0.82 * (scale < 1.0 ? scale : 1.0);
      let lo = Math.max(12, H * 0.02 * scale), hi = Math.min(S0, H * 0.18 * scale);
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2, ls = wrap(mid);
        const fitsW = ls.every(li => lineW(li, mid) <= maxW);
        const fitsH = ls.length * LH * mid <= maxH;
        if (fitsW && fitsH) lo = mid; else hi = mid;
      }
      S = lo;
      lines = wrap(S);
      if (lines.length < 2 && !hasNL) wrapped = false;
    } else {
      lines = [A.map((_, i) => i)];
      const unit = lineW(lines[0], 1);
      S = unit > 0 ? Math.min(S0, maxW / unit) : S0;
    }
    const n = lines.length, lh = LH * S;
    lines.forEach((li, k) => {
      let x = W / 2 - lineW(li, S) / 2;
      const y = H / 2 + (k - (n - 1) / 2) * lh + 0.33 * S;
      li.forEach(i => {
        const l = A[i], w = ws[i] * S;
        l.tx = x + w / 2;
        l.ty = y;
        l.tw = w;
        l.line = k;
        x += w;
      });
    });
    return { S, wrapped, n, lines, lh };
  }
  layout(snap) {
    if (!this.W || this._nl) return;
    const A = this.letters.filter(l => !l.dead), res = this.layoutCore(A, this.W, this.H, this.wrapped);
    this.wrapped = res.wrapped;
    A.forEach(l => { if (l.x == null) { l.x = l.tx; l.y = l.ty; } });
    const S = res.S, last = A[A.length - 1];
    this.St = S;
    if (last && last.ch === '\n') {
      const lastLineIdx = res.n - 1;
      const lastLineY = this.H / 2 + (lastLineIdx - (res.n - 1) / 2) * res.lh + 0.33 * S;
      this.ctx_ = this.W / 2;
      this.cty = lastLineY - 0.33 * S;
    } else if (last) {
      this.ctx_ = last.tx + last.tw / 2 + 0.07 * S;
      this.cty = last.ty - 0.33 * S;
    } else {
      this.ctx_ = this.W / 2;
      this.cty = this.H / 2;
    }
    if (snap || !this.Sd) { this.Sd = S; this.cx = this.ctx_; this.cy = this.cty; A.forEach(l => { l.x = l.tx; l.y = l.ty; }); }
    // Update word count
    const txt = A.map(l => l.ch).join('').trim();
    const words = txt ? txt.split(/\s+/).filter(Boolean).length : 0;
    const chars = txt.length;
    const wcEl = document.getElementById('wc');
    if (wcEl) wcEl.textContent = txt ? `${words}w · ${chars}c` : '';
  }

  // ---------- history (undo/redo) ----------
  _snapshot() {
    const state = this.letters.filter(l => !l.dead).map(l => l.ch).join('');
    const pal = this.palette;
    // Trim future if branching
    if (this._histIdx < this._history.length - 1) {
      this._history = this._history.slice(0, this._histIdx + 1);
    }
    // Avoid duplicate consecutive snapshots
    const prev = this._history[this._histIdx];
    if (prev && prev.text === state && prev.pal === pal) return;
    this._history.push({ text: state, pal });
    if (this._history.length > 200) this._history.shift();
    this._histIdx = this._history.length - 1;
  }
  undo() {
    if (this.locked || this._histIdx <= 0) return;
    this._histIdx--;
    this._applyHistory();
  }
  redo() {
    if (this.locked || this._histIdx >= this._history.length - 1) return;
    this._histIdx++;
    this._applyHistory();
  }
  _applyHistory() {
    const s = this._history[this._histIdx];
    if (!s) return;
    const now = performance.now() - 4000;
    this._nl = true;
    this.letters = [];
    this.uid = 1;
    for (const ch of s.text) this.add(ch, now);
    this._nl = false;
    if (PAL[s.pal]) { this.palette = s.pal; this.applyPal(); }
    this.layout(true);
  }

  // ---------- input ----------
  wither(now) {
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (!last) return;
    last.dead = now;
    const pv = A[A.length - 2];
    if (pv && pv.ch !== ' ' && pv.ch !== '\n') { pv.cut = null; pv.endEls = null; pv.tb = now; }
    this.layout();
  }
  inputDiff() {
    const el = this.inp;
    if (this.locked) { el.value = SENT; this.iv = SENT; return; }
    if (this._kd) { this.iv = this.composing ? el.value : SENT; if (!this.composing) el.value = SENT; return; }
    const old = this.iv == null ? SENT : this.iv, cur = el.value;
    let p = 0; while (p < old.length && p < cur.length && old[p] === cur[p]) p++;
    let dels = old.length - p;
    if (p === 0 && old[0] === SENT && old.length > 1) dels -= 1;
    const now = performance.now(); this.lastKey = now;
    for (let i = 0; i < dels; i++) this.wither(now);
    for (const ch of cur.slice(p)) {
      if (ch === SENT) continue;
      this.add(ch.charCodeAt(0) === 10 ? '\n' : ch, now);
    }
    if (this.composing) this.iv = cur; else { el.value = SENT; this.iv = SENT; }
  }
  key(e) {
    if (e.target && e.target !== this.inp && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod || e.altKey) {
      if (mod) {
        const k = e.key.toLowerCase();
        // Ctrl/Cmd + S → save (intercept browser save-page)
        if (k === 's') { e.preventDefault(); if (e.shiftKey) this.saveSVG(); else window._triggerSave && window._triggerSave(); return; }
        // Ctrl/Cmd + Z → undo
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); return; }
        // Ctrl/Cmd + Y or Ctrl+Shift+Z → redo
        if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); return; }
        // Ctrl/Cmd + F → find
        if (k === 'f') { e.preventDefault(); window._openFind && window._openFind(); return; }
      }
      return;
    }
    // Non-modifier keys
    if (e.key === 'Escape') { window._handleEsc && window._handleEsc(); return; }
    if (e.key === 'F' || e.key === 'f') {
      // Only toggle focus mode if not in an auth form / find input
      if (!e.target || e.target === this.inp || e.target === document.body) {
        window._toggleFocus && window._toggleFocus(); return;
      }
    }
    if (e.key === '?') {
      if (!e.target || e.target === this.inp || e.target === document.body) {
        e.preventDefault(); window._openHelp && window._openHelp(); return;
      }
    }
    if (this.locked) return;
    if (e.target && e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    const now = performance.now();
    if (e.key === 'Backspace') { e.preventDefault(); this.mark(); this._snapshot(); this.wither(now); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      this.mark();
      this._snapshot();
      if (e.shiftKey) {
        // Shift + Enter: new paragraph (paragraph break)
        const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
        if (last && last.ch === '\n') {
          this.add('\n', now);
        } else {
          this.add('\n', now);
          this.add('\n', now);
        }
      } else {
        // Enter: next line
        this.add('\n', now);
      }
      return;
    }
    if (e.key.length !== 1) return;
    e.preventDefault(); this.mark(); this._snapshot(); this.add(e.key, now);
  }
  mark() { this.lastKey = performance.now(); this._kd = true; setTimeout(() => { this._kd = false; }, 0); }
  add(ch, now) {
    if (this.letters.length >= MAX) return;
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (ch === ' ' || ch === '\n') {
      if (last && last.ch !== ' ' && last.ch !== '\n') { last.cut = now; this.genEnd(last, now - last.birth); }
      this.letters.push({ ch, id: this.uid++, birth: now, els: [] });
      this.layout();
      if (!this._nl) {
        try { localStorage.setItem('tg_draft', JSON.stringify({ text: this.text(), pal: this.palette, ts: Date.now() })); } catch(_) {}
      }
      return;
    }
    const same = last && last.ch !== ' ' && last.ch !== '\n';
    const l = { ch, id: this.uid++, birth: now, tb: now, ws: same ? last.ws : Math.floor(Math.random() * 1e9), wi: same ? last.wi + 1 : 0, prev: same ? last : null };
    this.gen(l); this.letters.push(l); this.layout();
    // Save draft to localStorage for crash recovery
    if (!this._nl) {
      try { localStorage.setItem('tg_draft', JSON.stringify({ text: this.text(), pal: this.palette, ts: Date.now() })); } catch(_) {}
    }
  }

  // ---------- growth ----------
  wordParams(ws) {
    const r = this.rng(ws * 7 + 13), dens = props.density;
    return { roseP: 0.3 + r() * 0.3, leafy: (0.6 + r() * 0.8) * dens, dens, lean: (r() - 0.5) * 0.6, big: 0.85 + r() * 0.45, curvy: 0.8 + r() * 0.6, bridgeP: Math.min(0.95, (0.45 + r() * 0.35) * dens), w: 0.5 };
  }
  grow(r, E, nid, p, o) {
    const tip = o.tip || (r() < p.roseP ? 'rose' : r() < 0.45 ? 'fan' : r() < 0.6 ? 'leaf' : 'curl');
    let P = o.pts || this.vine(o.base, o.dir, o.len, (0.35 + r() * 0.45) * p.curvy, 1 + r() * 1.6, r() * 6.28, (r() - 0.5) * 1.2, 40);
    if (tip === 'curl') P = this.curl(P, r() < 0.5 ? -1 : 1, 0.05 + r() * 0.05);
    const segs = this.weave(r, o.layer0 != null ? o.layer0 : (r() < 0.5 ? 0 : 1));
    const dur = Math.max(320, (o.len || 0.8) * 620), thorns = [], nt = Math.floor(r() * 2.5);
    for (let i = 0; i < nt; i++) thorns.push({ u: 0.15 + r() * 0.65, s: r() < 0.5 ? -1 : 1 });
    E.push({ t: 'stem', id: nid(), pts: P, segs, d0: o.d0, dur, w: o.depth ? 0.82 : 1, thorns });
    const nl = Math.floor(r() * 2.8 * p.leafy); let sd = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < nl; i++) {
      const u = 0.25 + r() * 0.6, [q, a] = this.at(P, u); sd = -sd;
      E.push({ t: 'leaf', id: nid(), x: q[0], y: q[1], a: a + sd * (0.55 + r() * 0.5), L: (0.14 + r() * 0.2) * (o.depth ? 0.8 : 1), bend: (r() - 0.5) * 1.2, layer: this.layerAt(segs, u), d0: o.d0 + dur * u });
    }
    const [tp, ta] = this.at(P, 1), td = o.d0 + dur * 0.8, tl = this.layerAt(segs, 1);
    if (tip === 'rose') {
      const R = (0.13 + r() * 0.15) * p.big * (o.depth ? 0.75 : 1);
      const over = tp[1] > -0.78 && tp[1] < 0.05 && Math.abs(tp[0]) < p.w * 0.5;
      const layer = over ? (r() < 0.22 ? 1 : 0) : (r() < 0.6 ? 1 : tl);
      E.push({ t: 'rose', id: nid(), x: tp[0], y: tp[1], R, rot: (r() - 0.5) * 1.0, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r() * 1, layer, d0: td });
      if (r() < 0.2) { const oo = ta + (r() < 0.5 ? 1 : -1) * 1.3; E.push({ t: 'rose', id: nid(), x: tp[0] + Math.cos(oo) * R * 1.4, y: tp[1] + Math.sin(oo) * R * 1.4, R: R * (0.6 + r() * 0.3), rot: (r() - 0.5) * 1.2, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r(), layer, d0: td + 120 }); }
    } else if (tip === 'fan') {
      const spread = 0.6 + r() * 0.3;
      for (let j = 0; j < 2; j++) E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (j - 0.5) * spread, L: 0.2 + r() * 0.2, bend: (j - 0.5) * 0.8, layer: tl, d0: td + j * 60 });
    } else if (tip === 'leaf') {
      E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (r() - 0.5) * 0.3, L: 0.16 + r() * 0.16, bend: (r() - 0.5), layer: tl, d0: td });
    }
    if (!o.depth && r() < 0.3) {
      const u = 0.35 + r() * 0.35, [q, a] = this.at(P, u);
      this.grow(r, E, nid, p, { base: q, dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), len: (o.len || 0.8) * (0.35 + r() * 0.2), d0: o.d0 + dur * u, depth: 1, layer0: this.layerAt(segs, u) });
    }
    return P;
  }
  gen(l) {
    const r = this.rng((l.ws ^ Math.imul(l.wi + 1, 2654435761)) + Math.floor(Math.random() * 1e6));
    const p = this.wordParams(l.ws), E = []; let k0 = 0; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), inX = () => (r() - 0.5) * w * 0.7; p.w = w;
    const nUp = 1 + (r() < 0.45 * p.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++) this.grow(r, E, nid, p, { base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + p.lean * 0.5 + (r() - 0.5) * 0.7, len: 0.6 + r() * 0.5, d0: 40 + i * 130, tip: l.wi === 0 && i === 0 ? 'rose' : null });
    if (r() < 0.4 * p.dens) this.grow(r, E, nid, p, { base: [inX(), -0.1 - r() * 0.35], dir: Math.PI / 2 + (r() - 0.5) * 0.8, len: 0.35 + r() * 0.35, d0: 160 });
    if (l.prev && r() < p.bridgeP) {
      const px = -(this.mw(l.prev.ch) + w) / 2;
      const a = [inX(), -0.05 - r() * 0.55], b = [px + (r() - 0.5) * 0.25, -0.05 - r() * 0.55];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.4 + r() * 0.4), dx = b[0] - a[0];
      let P = this.bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
      if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
      this.grow(r, E, nid, p, { pts: P, len: Math.abs(dx) + Math.abs(bulge), d0: 90, tip: r() < 0.5 ? 'curl' : r() < 0.5 ? 'leaf' : 'rose' });
    }
    if (l.wi === 0) this.grow(r, E, nid, p, { base: [-w * 0.3, -0.15 - r() * 0.4], dir: Math.PI + (r() - 0.5) * 1.2, len: 0.45 + r() * 0.3, d0: 120, tip: 'curl' });
    l.els = E; l.endEls = null;
    const T = [], tr = this.rng(l.id * 977 + Math.floor(Math.random() * 1e6));
    this.grow(tr, T, () => l.id * 100 + 90 + T.length, p, { base: [w * 0.25, -0.1 - tr() * 0.45], dir: (tr() - 0.5) * 1.4, len: 0.45 + tr() * 0.25, d0: 0, tip: 'curl', depth: 1 });
    l.tend = T.filter(e => e.t === 'stem').slice(0, 1);
  }
  genEnd(l, rel) {
    const r = this.rng(l.ws + l.wi * 31 + Math.floor(Math.random() * 1e6)), p = this.wordParams(l.ws), E = [];
    let k0 = 50; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), n = 1 + Math.floor(r() * 2.5); p.w = w;
    for (let i = 0; i < n; i++) {
      const dir = -Math.PI / 2 + 0.6 + (i - (n - 1) / 2) * 0.9 + (r() - 0.5) * 0.4;
      this.grow(r, E, nid, p, { base: [(r() - 0.2) * w * 0.6, -r() * 0.5], dir, len: 0.4 + r() * 0.45, d0: rel + 40 + i * 90, depth: 1, tip: i === 0 || r() < 0.5 ? 'rose' : 'fan' });
    }
    l.endEls = E;
  }

  // ---------- drawing ----------
  strokeRange(B, P, a, b, col, w) {
    const n = P.length - 1, ia = a * n, ib = b * n;
    const lerp = t => { const i = Math.min(n - 1, Math.floor(t)), f = t - i; return [P[i][0] + (P[i+1][0] - P[i][0]) * f, P[i][1] + (P[i+1][1] - P[i][1]) * f]; };
    const pts = [lerp(ia)];
    for (let i = Math.floor(ia) + 1; i < ib; i++) pts.push(P[i]);
    pts.push(lerp(ib));
    if (pts.length >= 2) B.stroke(pts, col, w);
  }
  thorn(B, P, u, s, S) {
    const [p, a] = this.at(P, u), d = a + s * 2.3, L = S * 0.045;
    B.stroke([p, [p[0] + Math.cos(d) * L, p[1] + Math.sin(d) * L]], this.cc.blue, S * 0.022);
  }
  leaf(B, bx, by, a, L, bend) {
    if (L < 0.5) return;
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const ax = u => { const b = Math.sin(Math.PI * u) * bend * 0.15 * L; return [bx + ca * u * L + px * b, by + sa * u * L + py * b]; };
    const hw = u => L * 0.18 * Math.sin(Math.PI * Math.pow(u, 0.8));
    const N = 12, s1 = [], s2 = [];
    for (let i = 0; i <= N; i++) { const u = i / N, c = ax(u), w = hw(u); s1.push([c[0] + px * w, c[1] + py * w]); s2.push([c[0] - px * w, c[1] - py * w]); }
    const tip = ax(1), base = ax(0);
    B.fill([base, ...s1.slice(1, N), tip, tip, ...s2.slice(1, N).reverse(), base], this.cc.blue);
    if (L > 6) { const v = []; for (let i = 0; i <= 8; i++) v.push(ax(0.08 + 0.72 * i / 8)); B.stroke(v, this.cc.vein, Math.max(0.8, L * 0.03)); }
  }
  rose(B, cx, cy, R, rot, e, a, tl) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const tm = tl ? Math.hypot(tl[0], tl[1]) : 0, ux = tm ? tl[0] / tm : 0, uy = tm ? tl[1] / tm : 0, sq = -0.28 * tm;
    const T = (x, y, z = 0) => {
      let dx = x * cr - y * sr, dy = x * sr + y * cr;
      if (tm) { const k = (dx * ux + dy * uy) * sq; dx += k * ux + tl[0] * R * z; dy += k * uy + tl[1] * R * z; }
      return [cx + dx, cy + dy];
    };
    const P = [[0,-0.36,0.56,0.54,0,0,0],[-0.5,-0.06,0.6,0.6,-0.35,0,0],[0.52,-0.06,0.6,0.6,0.35,0,0],[-0.42,0.3,0.62,0.48,0.2,0.12,1],[0.47,0.3,0.62,0.48,-0.2,0.12,1],[0.05,0.42,0.56,0.38,0,0.14,0]];
    const ax0 = 0, ay0 = 0.5, lw = Math.max(0.8, R * 0.045), st = 85;
    P.forEach((q, i) => {
      const s = this.spr((a - i * st) / 1000, 8, 14); if (s <= 0.001) return;
      const open = (1 - Math.min(1, s)) * (q[0] < 0 ? 0.5 : -0.5), ang = q[4] + open, ca = Math.cos(ang), sa = Math.sin(ang);
      const pt = th => {
        const rr = 1 + 0.08 * Math.sin(3 * th + e.ph1 + i) + 0.04 * Math.sin(5 * th + e.ph2);
        const lx = Math.cos(th) * q[2] * rr, ly = Math.sin(th) * q[3] * rr;
        const px = q[0] + lx * ca - ly * sa, py = q[1] + lx * sa + ly * ca;
        return T((ax0 + (px - ax0) * s) * R, (ay0 + (py - ay0) * s) * R, q[5]);
      };
      const pts = []; for (let k = 0; k < 26; k++) pts.push(pt(k / 26 * Math.PI * 2));
      B.fill(pts, this.cc.red);
      if (q[6] && R >= 12 && s > 0.4) {
        const arc = []; for (let k = 0; k <= 14; k++) arc.push(pt(Math.PI * (1.18 + 0.64 * k / 14)));
        this.strokeRange(B, arc, 0, Math.min(1, (s - 0.4) / 0.5), this.cc.line, lw * 0.8);
      }
    });
    const fr = this.eo((a - P.length * st - 80) / 520);
    if (fr > 0 && R > 3) {
      const sp = [], scl = [], turns = R < 20 ? Math.min(e.turns, 1.3) : R < 32 ? e.turns * 0.8 : e.turns;
      for (let i = 0; i <= 70; i++) { const u = i / 70, th = e.ph1 + u * turns * Math.PI * 2, rr = R * (0.08 + 0.57 * u); sp.push(T(Math.cos(th) * rr * 1.05, Math.sin(th) * rr * 0.72 - 0.12 * R, 0.34 - 0.24 * u)); }
      this.strokeRange(B, sp, 0, fr, this.cc.line, lw);
      if (R >= 14) {
        for (let i = 0; i <= 36; i++) { const u = i / 36; scl.push(T((-0.72 + 1.5 * u) * R, 0.36 * R + 0.16 * R * Math.abs(Math.sin(u * Math.PI * 3)), 0.18)); }
        this.strokeRange(B, scl, 0, fr, this.cc.line, lw);
      }
    }
  }
  frame() {
    const now = performance.now(), dt = Math.min(64, now - (this.lt || now)); this.lt = now;
    if (!this.W) return;
    const k = 1 - Math.exp(-dt / 80);
    this.Sd += (this.St - this.Sd) * k;
    this.cx += (this.ctx_ - this.cx) * k; this.cy += (this.cty - this.cy) * k;
    for (const l of this.letters) if (!l.dead && l.tx != null) { l.x += (l.tx - l.x) * k; l.y += (l.ty - l.y) * k; }
    this.letters = this.letters.filter(l => !(l.dead && now - l.dead > 300));
    this.paint(now, true);
  }
  mainState() { return { letters: this.letters, S: this.Sd, C: this.pal().C, boil: props.boil, recoil: props.recoil, speed: 1, wither: 260, face: true }; }
  paint(now, caret) {
    const g = this.g, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = this.pal().bg; g.fillRect(0, 0, this.W, this.H);
    const B = this.backend(g), st = this.mainState();
    this.render(B, now, st); this.drawFlies(B, now, st.C);
    if (caret) {
      const S = this.Sd, on = now - this.lastKey < 500 || Math.floor(now / 530) % 2 === 0, hf = this.eo((now - this.t0) / 600);
      if (on && hf > 0) { const h = 0.8 * S * hf, w = Math.max(2, S * 0.03); B.rect(this.cx - w / 2, this.cy - h / 2, w, h, st.C.text); }
    }
  }
  render(B, now, st) {
    const S = st.S, L = st.letters, act = L.filter(l => !l.dead), sp = st.speed || 1;
    this.cc = st.C; this._now = now; this.perch = [];
    for (const l of L) {
      let tx = 0, ty = 0;
      if (this.mx != null && !l.dead && l.ch !== ' ' && l.ch !== '\n') {
        const dx = this.mx - l.x, dy = this.my - (l.y - S * 0.6), d = Math.hypot(dx, dy), reach = Math.max(260, S * 3.2);
        if (d < reach && d > 1) { const w = 1 - d / reach, s = w * w * (3 - 2 * w); tx = dx / d * s; ty = dy / d * s; }
      }
      const c = l.lean || (l.lean = [0, 0]);
      c[0] += (tx - c[0]) * 0.07; c[1] += (ty - c[1]) * 0.07;
    }
    const f = st.boil ? Math.floor(now / 120) : 0, amp = st.boil ? Math.max(0.8, S * 0.01) : 0;
    const kd = l => l.dead ? 1 - this.eo((now - l.dead) / st.wither) : 1;
    const draw = layer => {
      for (const l of L) {
        if (l.ch === ' ' || l.ch === '\n' || !l.els) continue;
        const age = (now - l.birth) * sp, kk = kd(l);
        const each = e => { if (e.t === 'stem') this.drawStem(B, e, l, age, kk, st, f, amp, layer); else if (e.layer === layer) this.drawEl(B, e, l, age, kk, st, f, amp); };
        l.els.forEach(each);
        if (l.endEls) l.endEls.forEach(each);
        const i = act.indexOf(l), nx = i >= 0 ? act[i + 1] : null;
        if (l.tend && (l.dead || !nx || nx.ch === ' ' || nx.ch === '\n')) {
          let fr = this.eo(((now - l.tb) * sp - 150) / 450);
          if (l.cut != null) fr *= 1 - this.eo((now - l.cut) * sp / 150) * Math.min(0.85, st.recoil / (0.6 * S));
          for (const e of l.tend) this.drawStem(B, e, l, age, kk, st, f, amp, layer, fr * kk);
        }
      }
    };
    draw(0);
    for (const l of L) if (l.ch !== ' ' && l.ch !== '\n' && !l.dead) B.text(l.ch, l.x, l.y, S, st.C.text);
    draw(1);
  }
  wpt(st, l, x, y) {
    const t = (this._now - l.birth) * (st.speed || 1) / 1000;
    if (t > 0 && t < 2.5) {
      const hh = Math.max(0, (l.y - y) / st.S), dmp = Math.exp(-t * 3.2), dir = (l.id % 2 ? 1 : -1);
      x += st.S * 0.07 * hh * dmp * Math.sin(t * 11) * dir;
      y += st.S * 0.035 * hh * dmp * Math.sin(t * 11 + 1.2);
    }
    if (st.face && l.lean) {
      const hh = Math.min(2.5, Math.max(0, (l.y - y) / st.S)), f = hh * hh * 0.5 + hh * 0.5;
      x += l.lean[0] * st.S * 0.1 * f; y += l.lean[1] * st.S * 0.05 * f;
    }
    return [x, y];
  }
  drawStem(B, e, l, age, kk, st, f, amp, layer, frO) {
    const S = st.S, fr = frO != null ? frO : this.eo((age - e.d0) / e.dur) * kk; if (fr <= 0) return;
    const j = this.jit(e.id, f, amp);
    const P = e.pts.map(p => this.wpt(st, l, l.x + p[0] * S + j[0], l.y + p[1] * S + j[1]));
    for (const sg of e.segs) {
      if (sg.layer !== layer) continue;
      const b = Math.min(sg.u1, fr); if (b <= sg.u0) continue;
      this.strokeRange(B, P, sg.u0, b, st.C.blue, S * 0.022 * (e.w || 1));
    }
    for (const th of e.thorns) if (fr > th.u && this.layerAt(e.segs, th.u) === layer) this.thorn(B, P, th.u, th.s, S);
  }
  drawEl(B, e, l, age, kk, st, f, amp) {
    const S = st.S, j = this.jit(e.id, f, amp), wx = (x, y) => this.wpt(st, l, l.x + x * S + j[0], l.y + y * S + j[1]);
    if (e.t === 'leaf') {
      const sc = this.spr((age - e.d0) / 1000, 7, 15) * kk; if (sc <= 0) return;
      const p = wx(e.x, e.y); this.leaf(B, p[0], p[1], e.a + j[2], e.L * S * sc, e.bend);
    } else if (e.t === 'rose') {
      const a = age - e.d0; if (a < 0 || kk <= 0.001) return;
      const p = wx(e.x, e.y), tl = this.faceTurn(e, p[0], p[1]);
      if (!l.dead && a > 700) this.perch.push({ id: e.id, x: p[0], y: p[1], R: e.R * S * kk });
      this.rose(B, p[0], p[1], e.R * S * kk, e.rot + j[2] + tl[0] * 0.22, e, a, tl);
    }
  }
  faceTurn(e, x, y) {
    let wx = 0, wy = 0;
    if (this.mx != null) {
      const dx = this.mx - x, dy = this.my - y, d = Math.hypot(dx, dy), reach = 300;
      if (d < reach && d > 0.001) { const w = 1 - d / reach, s = w * w * (3 - 2 * w) * Math.min(1, d / 40); wx = dx / d * s; wy = dy / d * s; }
    }
    const c = this.fa[e.id] || [0, 0];
    c[0] += (wx - c[0]) * 0.09; c[1] += (wy - c[1]) * 0.09;
    this.fa[e.id] = c; return c;
  }

  // ---------- butterflies (click the canvas) ----------
  spawnFly(cx, cy) {
    if (this.flies.length >= 6) { const o = this.flies.find(f => f.st !== 'leave'); if (o) this.flyOff(o); }
    const taken = new Set(this.flies.filter(f => f.st !== 'leave').map(f => f.pid));
    let best = null, bd = 1e9;
    for (const p of this.perch) { if (taken.has(p.id)) continue; const d = Math.hypot(p.x - cx, p.y - cy); if (d < bd) { bd = d; best = p; } }
    const left = cx < this.W / 2, sz = Math.max(9, this.Sd * 0.09);
    this.flies.push({ x: left ? -40 : this.W + 40, y: cy + (Math.random() - 0.5) * this.H * 0.4, vx: 0, vy: 0, st: best ? 'fly' : 'wander', pid: best ? best.id : null, hx: cx, hy: cy, t0: performance.now(), ph: Math.random() * 6, sz, seed: Math.random() * 100, ang: 0 });
  }
  flyOff(f) { f.st = 'leave'; f.pid = null; f.ex = f.x < this.W / 2 ? -80 : this.W + 80; f.ey = f.y - this.H * 0.3; }
  drawFlies(B, now, C) {
    const dt = Math.min(48, now - (this._fl || now)); this._fl = now;
    const byId = {}; for (const p of this.perch) byId[p.id] = p;
    this.flies = this.flies.filter(f => {
      const t = (now - f.t0) / 1000; let tx, ty;
      if (f.st === 'sit' || f.st === 'fly') { const p = byId[f.pid]; if (!p) this.flyOff(f); else { tx = p.x + p.R * 0.05; ty = p.y - p.R * 0.55; } }
      if (f.st === 'wander') { tx = f.hx + Math.sin(t * 1.3 + f.seed) * 70; ty = f.hy + Math.sin(t * 2.1 + f.seed) * 40; if (t > 3.5) this.flyOff(f); }
      if (f.st === 'leave') { tx = f.ex; ty = f.ey; }
      if (f.st === 'sit') {
        f.x += (tx - f.x) * 0.35; f.y += (ty - f.y) * 0.35; f.ang *= 0.85; f.ph += dt * 0.004;
        const burst = Math.sin(now / 1000 * 0.9 + f.seed) > 0.75;
        f.open = burst ? 0.2 + 0.8 * Math.abs(Math.cos(now / 1000 * 9 + f.seed)) : 0.25 + 0.15 * Math.sin(f.ph);
      } else {
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1, sp = f.st === 'leave' ? 0.42 : Math.min(0.34, 0.06 + d * 0.0016);
        const flut = Math.sin(t * 7 + f.seed) * 0.12, wob = Math.cos(t * 4.3 + f.seed) * 0.1;
        f.vx += ((dx / d * sp + wob) - f.vx) * 0.06 * dt / 16; f.vy += ((dy / d * sp + flut) - f.vy) * 0.06 * dt / 16;
        f.x += f.vx * dt; f.y += f.vy * dt + Math.sin(t * 13 + f.seed) * 0.6;
        f.ang += (Math.max(-0.5, Math.min(0.5, f.vx * 1.4)) - f.ang) * 0.1;
        f.open = Math.abs(Math.cos(t * 17 + f.seed));
        if (f.st === 'fly' && d < 5) { f.st = 'sit'; f.ph = 0; }
        if (f.st === 'leave' && (f.x < -60 || f.x > this.W + 60 || f.y < -60)) return false;
      }
      this.butterfly(B, f.x, f.y, f.sz, f.ang, f.open, C);
      return true;
    });
  }
  butterfly(B, x, y, s, ang, o, C) {
    const ca = Math.cos(ang), sa = Math.sin(ang), T = (px, py) => [x + (px * ca - py * sa) * s, y + (px * sa + py * ca) * s];
    const wing = (cx, cy, rx, ry, a, side) => {
      const pts = [], c = Math.cos(a), sn = Math.sin(a);
      for (let k = 0; k < 22; k++) { const th = k / 22 * Math.PI * 2, r = 1 + 0.08 * Math.sin(th * 3), lx = Math.cos(th) * rx * r, ly = Math.sin(th) * ry * r; pts.push(T(side * (cx + lx * c - ly * sn) * (0.12 + 0.88 * o), cy + lx * sn + ly * c)); }
      return pts;
    };
    for (const sd of [-1, 1]) {
      B.fill(wing(0.46, 0.28, 0.36, 0.3, 0.5, sd), C.text);
      B.fill(wing(0.55, -0.32, 0.55, 0.36, -0.55, sd), C.text);
      if (o > 0.35) B.fill(wing(0.66, -0.4, 0.13, 0.11, 0, sd), C.red);
    }
    const body = []; for (let k = 0; k < 18; k++) { const th = k / 18 * Math.PI * 2; body.push(T(Math.cos(th) * 0.08, Math.sin(th) * 0.48)); }
    B.fill(body, C.blue);
    const lw = Math.max(0.8, s * 0.05);
    B.stroke([T(0, -0.42), T(-0.14, -0.72), T(-0.24, -0.86)], C.blue, lw);
    B.stroke([T(0, -0.42), T(0.14, -0.72), T(0.24, -0.86)], C.blue, lw);
  }

  // ---------- diary ----------
  text() { return this.letters.filter(l => !l.dead).map(l => l.ch).join(''); }
  load(text, pal, ro) {
    this.letters = []; this.uid = 1; this.locked = !!ro;
    if (pal != null && PAL[pal]) { this.palette = pal; this.applyPal(); }
    const t = performance.now() - 4000; this._nl = true;
    for (const ch of text) this.add(ch, t);
    this._nl = false; this.layout(true);
  }

  // ---------- export ----------
  dl(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  savePNG() { this.paint(performance.now(), false); this.cv.toBlob(b => b && this.dl(b, 'garden.png')); }
  saveSVG() {
    const parts = [], n = v => Math.round(v * 100) / 100;
    const pb = () => ({ d: '', moveTo(x, y) { this.d += `M${n(x)} ${n(y)}`; }, lineTo(x, y) { this.d += `L${n(x)} ${n(y)}`; }, quadraticCurveTo(a, b, x, y) { this.d += `Q${n(a)} ${n(b)} ${n(x)} ${n(y)}`; }, closePath() { this.d += 'Z'; } });
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const fontCfg = this.getFontConfig();
    const B = {
      fill: (p, col) => { const b = pb(); this.path(b, p, true); parts.push(`<path d="${b.d}" fill="${col}"/>`); },
      stroke: (p, col, w) => { const b = pb(); this.path(b, p, false); parts.push(`<path d="${b.d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"/>`); },
      rect: () => {},
      text: (ch, x, y, S, col) => parts.push(`<text x="${n(x)}" y="${n(y)}" text-anchor="middle" font-family="${fontCfg.svgFamily}" font-weight="${fontCfg.weight}" font-size="${n(S)}" fill="${col}">${esc(ch)}</text>`)
    };
    this.render(B, performance.now(), this.mainState());
    const fontImport = `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontCfg.name).replace(/%20/g, '+')}:wght@${fontCfg.weight}&amp;display=swap');`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n(this.W)}" height="${n(this.H)}" viewBox="0 0 ${n(this.W)} ${n(this.H)}"><defs><style>${fontImport}</style></defs><rect width="100%" height="100%" fill="${this.pal().bg}"/>${parts.join('')}</svg>`;
    this.dl(new Blob([svg], { type: 'image/svg+xml' }), 'garden.svg');
  }
}
// ---------- app: auth + daily diary ----------
const $ = id => document.getElementById(id);
const garden = new Garden();
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nice = d => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
let me = null, mode = 'login', cur = '', past = false, saved = '', pend = '', pendAt = 0, saving = false;
const stamp = () => garden.text() + '|' + garden.palette;
const setSt = t => { $('st').textContent = t; };

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, keepalive: method === 'PUT' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed'), { status: r.status });
  return j;
}
function showAuth(msg) {
  me = null; garden.locked = true; garden.letters = []; garden.layout(true);
  $('top').hidden = true; $('drawer').hidden = true; $('auth').hidden = false;
  $('er').textContent = msg || ''; $('p').value = ''; $('u').focus();
}
async function save() {
  const k = stamp(); saving = true;
  try { await api('PUT', '/api/entries/' + cur, { text: garden.text(), palette: garden.palette }); saved = k; setSt('saved'); }
  catch (e) { if (e.status === 401) showAuth('Session expired. Log in again.'); else setSt('offline, retrying'); }
  saving = false;
}
async function openDay(d) {
  if (me && cur && !past && !garden.locked && stamp() !== saved) await save();
  const e = await api('GET', '/api/entries/' + d);
  cur = d; past = d !== today();
  garden.load(e.text, e.palette, past);
  saved = pend = stamp();
  $('dt').textContent = nice(d); setSt(past ? 'read only' : 'saved');
  $('drawer').hidden = true; garden.refocus();
}
async function start(name) {
  me = name; cur = ''; $('who').textContent = name; $('auth').hidden = true; $('top').hidden = false;
  await openDay(today());
}

setInterval(async () => {
  if (!me || garden.locked || saving) return;
  if (!past && cur !== today()) { if (stamp() !== saved) await save(); return openDay(today()).catch(() => {}); }
  const k = stamp(); if (k === saved) return;
  if (k !== pend) { pend = k; pendAt = Date.now(); setSt('typing…'); return; }
  if (Date.now() - pendAt >= 800) { setSt('saving…'); save(); }
}, 400);
addEventListener('pagehide', () => { if (me && !past && !garden.locked && stamp() !== saved) save(); });

$('af').onsubmit = async e => {
  e.preventDefault(); $('er').textContent = '';
  try { const r = await api('POST', '/api/auth/' + mode, { username: $('u').value, password: $('p').value }); $('p').value = ''; await startWithRecovery(r.username); }
  catch (err) { $('er').textContent = err.message; }
};
$('sw').onclick = () => {
  mode = mode === 'login' ? 'signup' : 'login';
  $('go').textContent = mode === 'login' ? 'Log in' : 'Create account';
  $('sw').textContent = mode === 'login' ? 'New here? Create account' : 'Have an account? Log in';
  $('p').autocomplete = mode === 'login' ? 'current-password' : 'new-password'; $('er').textContent = '';
};
$('out').onclick = async () => {
  if (!past && !garden.locked && stamp() !== saved) await save();
  await api('POST', '/api/auth/logout').catch(() => {}); showAuth();
};
$('dx').onclick = () => { $('drawer').hidden = true; garden.refocus(); };
$('days').onclick = async () => {
  const box = $('dl'); box.textContent = 'Loading…'; $('drawer').hidden = false;
  try {
    if (!past && stamp() !== saved) await save();
    const list = await api('GET', '/api/entries'), t = today(); box.textContent = '';
    if (!list.some(x => x.date === t)) list.unshift({ date: t, snippet: 'Nothing written yet', palette: garden.palette });
    for (const x of list) {
      const b = document.createElement('button'), pl = PAL[x.palette] || PAL[0];
      const i = document.createElement('i'), n = document.createElement('b'), s = document.createElement('span');
      i.style.background = pl[1]; i.style.borderColor = pl[2];
      n.textContent = x.date === t ? 'Today' : nice(x.date); s.textContent = x.snippet;
      b.className = 'item'; b.append(i, n, s); b.onclick = () => openDay(x.date).catch(err => { box.textContent = err.message; });
      box.append(b);
    }
  } catch (e) { box.textContent = e.message; }
};

api('GET', '/api/auth/me').then(r => startWithRecovery(r.username)).catch(() => showAuth());

// ── Ctrl/Cmd + S: manual save ────────────────────────────────────────
window._triggerSave = async () => {
  if (!me || garden.locked || past) return;
  setSt('saving…');
  await save();
};

// ── Esc: close any open overlay ──────────────────────────────────────
window._handleEsc = () => {
  if (!$('help-modal').hidden) { $('help-modal').hidden = true; garden.refocus(); return; }
  if (!$('find-bar').hidden)   { closeFindBar(); garden.refocus(); return; }
  if (!$('drawer').hidden)     { $('drawer').hidden = true; garden.refocus(); return; }
  if (document.body.classList.contains('focus-mode')) { document.body.classList.remove('focus-mode'); return; }
};

// ── Focus Mode ───────────────────────────────────────────────────────
window._toggleFocus = () => { document.body.classList.toggle('focus-mode'); };
$('focus-btn').onclick = () => { window._toggleFocus(); garden.refocus(); };

// ── Help Modal ───────────────────────────────────────────────────────
window._openHelp = () => { $('help-modal').hidden = false; };
$('help-btn').onclick = () => { window._openHelp(); };
$('help-close').onclick = () => { $('help-modal').hidden = true; garden.refocus(); };
$('help-modal').addEventListener('pointerdown', e => {
  if (e.target === $('help-modal')) { $('help-modal').hidden = true; garden.refocus(); }
});

// ── Find bar ─────────────────────────────────────────────────────────
let _findMatches = [], _findIdx = 0;

function buildFindMatches(query) {
  _findMatches = [];
  if (!query) return;
  const text = garden.text().toLowerCase();
  const q = query.toLowerCase();
  let pos = 0;
  while (true) {
    const i = text.indexOf(q, pos);
    if (i === -1) break;
    _findMatches.push(i);
    pos = i + 1;
  }
}

function updateFindInfo() {
  const info = $('find-info');
  if (!_findMatches.length) { info.textContent = $('find-inp').value ? '0 / 0' : ''; return; }
  info.textContent = `${_findIdx + 1} / ${_findMatches.length}`;
}

function openFindBar() {
  $('find-bar').hidden = false;
  const fi = $('find-inp');
  fi.value = '';
  _findMatches = [];
  updateFindInfo();
  fi.focus();
}

function closeFindBar() {
  $('find-bar').hidden = true;
  _findMatches = [];
  $('find-inp').value = '';
  updateFindInfo();
}

window._openFind = openFindBar;

$('find-inp').addEventListener('input', () => {
  buildFindMatches($('find-inp').value);
  _findIdx = 0;
  updateFindInfo();
});

$('find-inp').addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeFindBar(); garden.refocus(); e.preventDefault(); return; }
  if (e.key === 'Enter') {
    if (!_findMatches.length) return;
    if (e.shiftKey) _findIdx = (_findIdx - 1 + _findMatches.length) % _findMatches.length;
    else _findIdx = (_findIdx + 1) % _findMatches.length;
    updateFindInfo();
    e.preventDefault();
  }
});

$('find-prev').onclick = () => {
  if (!_findMatches.length) return;
  _findIdx = (_findIdx - 1 + _findMatches.length) % _findMatches.length;
  updateFindInfo();
};
$('find-next').onclick = () => {
  if (!_findMatches.length) return;
  _findIdx = (_findIdx + 1) % _findMatches.length;
  updateFindInfo();
};
$('find-close').onclick = () => { closeFindBar(); garden.refocus(); };

// ── Local draft recovery ──────────────────────────────────────────────
async function startWithRecovery(name) {
  await start(name);
  try {
    const raw = localStorage.getItem('tg_draft');
    if (!raw) return;
    const draft = JSON.parse(raw);
    const draftDate = new Date(draft.ts).toISOString().slice(0, 10);
    if (draftDate !== cur) { localStorage.removeItem('tg_draft'); return; }
    const serverText = garden.text();
    if (draft.text && draft.text.length > serverText.length) {
      const toast = document.createElement('div');
      toast.id = 'recovery-toast';
      toast.style.cssText = [
        'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
        'background:#111', 'border:1px solid #3a3a3a', 'border-radius:999px',
        "padding:10px 20px", "font:13px 'DM Mono',monospace", 'color:#eee',
        'z-index:25', 'display:flex', 'gap:12px', 'align-items:center',
        'box-shadow:0 4px 24px rgba(0,0,0,.6)'
      ].join(';');
      toast.innerHTML =
        '<span>Unsaved draft found.</span>' +
        '<button class="b" id="restore-yes" style="padding:4px 14px;font-size:12px">Restore</button>' +
        '<button class="b" id="restore-no"  style="padding:4px 14px;font-size:12px">Discard</button>';
      document.body.appendChild(toast);
      $('restore-yes').onclick = () => {
        garden.load(draft.text, draft.pal, false);
        saved = pend = '';
        setSt('draft restored');
        localStorage.removeItem('tg_draft');
        toast.remove();
      };
      $('restore-no').onclick = () => {
        localStorage.removeItem('tg_draft');
        toast.remove();
      };
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 12000);
    } else {
      localStorage.removeItem('tg_draft');
    }
  } catch (_) {}
}


