import { Environment } from './components/Environment.js';
import { createScrollController } from './hooks/useScroll.js';

const env = new Environment(document.getElementById('app'));
const scroll = createScrollController(env);

// Start page
const startPage = document.getElementById('start-page');
document.getElementById('start-btn')?.addEventListener('click', () => {
  startPage?.classList.add('hidden');
});

// Surface button
document.getElementById('btn-surface')?.addEventListener('click',
  () => scroll.goToSurface());

// Jump buttons
document.getElementById('jump-down')?.addEventListener('click',
  () => scroll.jumpDown());
document.getElementById('jump-up')?.addEventListener('click',
  () => scroll.jumpUp());

function tick() {
  requestAnimationFrame(tick);
  scroll.update();
  env.update();
}
tick();
