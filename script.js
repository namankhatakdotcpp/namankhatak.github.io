const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const loader = document.querySelector('.loader');
const loadingBar = document.querySelector('.loading-bar');
const loadingPercent = document.querySelector('.loading-percent');
const scrollyContainer = document.querySelector('.scrolly-container');

// Text Scenes
const scene1 = document.querySelector('[data-scene="1"]');
const scene2 = document.querySelector('[data-scene="2"]');
const scene3 = document.querySelector('[data-scene="3"]');
const scene4 = document.querySelector('[data-scene="4"]');

const FRAME_COUNT = 120;
const images = [];
let imagesLoaded = 0;

// State
let scrollProgress = 0;
let smoothedProgress = 0;
let currentFrameIndex = 0;

// Preload Images
const preloadImages = () => {
    const promises = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        const promise = new Promise((resolve) => {
            const img = new Image();
            const padIndex = i.toString().padStart(3, '0');
            img.src = `sequence/frame_${padIndex}.png`;
            img.onload = () => {
                imagesLoaded++;
                const pct = Math.round((imagesLoaded / FRAME_COUNT) * 100);
                loadingBar.style.width = `${pct}%`;
                loadingPercent.innerText = `${pct}%`;
                resolve(img);
            };
            img.onerror = () => resolve(null);
            images[i] = img;
        });
        promises.push(promise);
    }
    return Promise.all(promises);
};

// Rendering
const renderFrame = (index) => {
    const img = images[index];
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgRatio = img.width / img.height;
    const canvasRatio = cw / ch;

    let dw, dh, ox, oy;

    if (canvasRatio > imgRatio) {
        dw = cw;
        dh = cw / imgRatio;
        ox = 0;
        oy = (ch - dh) / 2;
    } else {
        dw = ch * imgRatio;
        dh = ch;
        ox = (cw - dw) / 2;
        oy = 0;
    }

    ctx.drawImage(img, ox, oy, dw, dh);
};

const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(currentFrameIndex);
};

window.addEventListener('resize', handleResize);

// Scroll Calculation
const updateScroll = () => {
    const rect = scrollyContainer.getBoundingClientRect();
    const viewHeight = window.innerHeight;
    const totalDist = scrollyContainer.offsetHeight - viewHeight;
    const scrolled = -rect.top;

    let p = scrolled / totalDist;
    p = Math.max(0, Math.min(1, p));
    scrollProgress = p;
};

// Core Animation Loop
const animate = () => {
    smoothedProgress += (scrollProgress - smoothedProgress) * 0.05;

    const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(smoothedProgress * FRAME_COUNT)
    );

    if (frameIndex !== currentFrameIndex) {
        currentFrameIndex = frameIndex;
        renderFrame(currentFrameIndex);
    }

    // 3D Canvas Transforms (Subtle)
    const tilt = (smoothedProgress - 0.5) * 5;
    const scale = 1.05 - (smoothedProgress * 0.05);
    const zCanvas = -100 + (smoothedProgress * 100);

    canvas.style.transform = `scale(${scale}) translateZ(${zCanvas}px) rotateX(${tilt}deg)`;

    // 4-Stage Scene Logic
    // Divide 0-1 into 4 sections roughly
    // Scene 1: 0 - 0.2
    // Scene 2: 0.25 - 0.45
    // Scene 3: 0.5 - 0.7
    // Scene 4: 0.75 - 0.95

    updateScene(scene1, smoothedProgress, 0, 0.22);
    updateScene(scene2, smoothedProgress, 0.25, 0.47);
    updateScene(scene3, smoothedProgress, 0.5, 0.72);
    updateScene(scene4, smoothedProgress, 0.75, 1.0);

    requestAnimationFrame(animate);
};

const updateScene = (el, p, start, end) => {
    if (!el) return;

    const range = end - start;
    const fade = range * 0.15;
    const fadeInEnd = start + fade;
    const fadeOutStart = end - fade;

    let opacity = 0;
    let blur = 0;
    let y = 0;

    if (p >= start && p <= end) {
        // Parallax Movement (Upward drift)
        const localP = (p - start) / range;
        y = 50 - (localP * 100); // Move from +50px to -50px

        if (p < fadeInEnd) {
            opacity = (p - start) / fade;
            blur = 10 * (1 - opacity);
        } else if (p > fadeOutStart) {
            opacity = (end - p) / fade;
            blur = 10 * (1 - opacity);
        } else {
            opacity = 1;
            blur = 0;
        }
    } else {
        opacity = 0;
        // Optimization
    }

    el.style.opacity = opacity;
    el.style.filter = `blur(${blur}px)`;
    el.style.transform = `translate3d(0, ${y}px, 0)`;
    el.style.pointerEvents = opacity > 0 ? 'auto' : 'none';
};

// --- CARD TILT LOGIC ---
const cards = document.querySelectorAll('.work-card');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate percentages -0.5 to 0.5
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg tilt
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // Move Glow
        const glow = card.querySelector('.card-glow');
        if (glow) {
            glow.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
        }
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
    });
});

// Initialization
const init = async () => {
    handleResize();
    try {
        await preloadImages();
        loader.classList.add('hidden');
        window.addEventListener('scroll', updateScroll, { passive: true });
        animate();
    } catch (e) {
        console.error(e);
    }
};

init();
