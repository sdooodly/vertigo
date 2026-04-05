import { Environment } from './components/Environment.js';
import { createScrollController } from './hooks/useScroll.js';

const env = new Environment(document.getElementById('app'));
const scroll = createScrollController(env);

// ── Start page ──
const startPage = document.getElementById('start-page');
document.getElementById('start-btn')
  ?.addEventListener('click', () => startPage?.classList.add('hidden'));

// ── Nav toggle ──
const nav = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
navToggle?.addEventListener('click', () => {
  nav?.classList.toggle('open');
  navToggle?.classList.toggle('shifted');
});

// ── Nav items → jump to norm ──
nav?.addEventListener('click', (e) => {
  const el = e.target.closest('[data-norm]');
  if (!el) return;
  const norm = parseFloat(el.dataset.norm);
  if (!isNaN(norm)) {
    scroll.jumpTo(norm);
    // Close nav on mobile
    if (window.innerWidth < 768) {
      nav.classList.remove('open');
      navToggle?.classList.remove('shifted');
    }
    // Hide start page if visible
    startPage?.classList.add('hidden');
  }
});

// ── Nav home → show start page ──
document.getElementById('nav-home')
  ?.addEventListener('click', () => {
    startPage?.classList.remove('hidden');
    nav?.classList.remove('open');
    navToggle?.classList.remove('shifted');
  });

// ── Buttons ──
document.getElementById('btn-surface')
  ?.addEventListener('click', () => scroll.goToSurface());
document.getElementById('jump-down')
  ?.addEventListener('click', () => scroll.jumpDown());
document.getElementById('jump-up')
  ?.addEventListener('click', () => scroll.jumpUp());

// ── Highlight active nav item ──
function updateActiveNav() {
  const norm = env.currentY / 5000;
  let closest = null, minDist = Infinity;
  nav?.querySelectorAll('[data-norm]').forEach(el => {
    el.classList.remove('active');
    const n = parseFloat(el.dataset.norm);
    const d = Math.abs(n - norm);
    if (d < minDist) { minDist = d; closest = el; }
  });
  if (closest && minDist < 0.04) closest.classList.add('active');
}

// ── Render loop ──
let frameCount = 0;
function tick() {
  requestAnimationFrame(tick);
  scroll.update();
  env.update();
  // Update nav highlight every 10 frames (perf)
  if (++frameCount % 10 === 0) updateActiveNav();
}
tick();
