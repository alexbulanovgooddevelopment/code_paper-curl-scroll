import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders.js";

// Модули выполняются после скриптов с defer, поэтому GSAP и Lenis уже есть
gsap.registerPlugin(ScrollTrigger);

// Отгибание идёт только вслед за прокруткой, поэтому
// при уменьшенном движении отключаем лишь плавный скролл
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const lenis = new Lenis();

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const PAD = 0.25; // отступ страницы внутри холста, в долях
const SCALE = 1 / (1 - 2 * PAD);

const container = document.querySelector(".hero-image-container");
const image = document.querySelector(".hero-image");

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  premultipliedAlpha: false,
});
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const canvas = renderer.domElement;
canvas.classList.add("hero-canvas");
canvas.setAttribute("aria-hidden", "true");
container.appendChild(canvas);

const uniforms = {
  uTexture: { value: null },
  uImageSize: { value: new THREE.Vector2(1, 1) },
  uPlaneSize: { value: new THREE.Vector2(1, 1) },
  uPad: { value: new THREE.Vector2(PAD, PAD) },
  uProgress: { value: 0 },
};

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  transparent: true,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

const render = () => renderer.render(scene, camera);

new THREE.TextureLoader().load(image.currentSrc || image.src, (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  uniforms.uTexture.value = texture;
  uniforms.uImageSize.value.set(texture.image.width, texture.image.height);

  document.documentElement.classList.add("is-webgl");
  render();
});

function resize() {
  const { width, height } = container.getBoundingClientRect();
  if (!width || !height) return;

  const w = width * SCALE;
  const h = height * SCALE;

  renderer.setSize(w, h, false);
  uniforms.uPlaneSize.value.set(w, h); // размер всей плоскости, а не страницы
  render(); // setSize очищает холст
}

resize();
window.addEventListener("resize", resize);

// Перерисовываем только при прокрутке, а не на каждом кадре
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: "+=85%",
  scrub: true,
  pin: true,
  onUpdate: ({ progress }) => {
    uniforms.uProgress.value = progress;
    render();
  },
});
