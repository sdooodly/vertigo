import { Environment } from './components/Environment.js';
import { createScrollController } from './hooks/useScroll.js';

const env = new Environment(document.getElementById('app'));
const scroll = createScrollController(env);

// "Return to Surface" button
document.getElementById('btn-surface').addEventListener('click', () => {
  scroll.goToSurface();
});

function tick() {
  requestAnimationFrame(tick);
  scroll.update();
  env.update();
}
tick();
