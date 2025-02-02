const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

const frameCount = 240;
const currentFrame = index => `imgscrl/${index.toString().padStart(4, '0')}.webp`;

const preloadImages = () => {
    for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
    }
};
preloadImages();

const img = new Image();
img.src = currentFrame(1);
canvas.width = 2048;
canvas.height = 1066;
img.onload = () => context.drawImage(img, 0, 0);

const updateImage = index => {
    img.src = currentFrame(index);
    context.drawImage(img, 0, 0);
};

window.addEventListener('scroll', () => {
    const scrollTop = html.scrollTop;
    const maxScrollTop = html.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScrollTop;
    const frameIndex = Math.min(frameCount - 1, Math.ceil(scrollFraction * frameCount));

    requestAnimationFrame(() => updateImage(frameIndex + 1));

    if (frameIndex === 239) {
        window.scrollTo(-1, 0);
    }
});
