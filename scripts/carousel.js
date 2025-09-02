
class HDcarousel{
    // Minimal, robust carousel: fixed 20px gaps, responsive sizing, debounced resize,
    // automatic sliding where outgoing item fades while sliding out, and circular rotation.
    version = '0.3-slim';
    el = null;
    gap = 20; // px
    interval = 8000; // ms
    animDuration = 480; // ms
/**
 * Initializes a new HDcarousel instance
 * @param {string|Element} selector - CSS selector or DOM element for the carousel container
 */
constructor(selector){
    if (typeof selector === 'string') this.el = document.querySelector(selector);
    else this.el = selector;
    if (!this.el) return console.error('HDcarousel: container not found', selector);

    // debug handle
    this.el.__hdInstance = this;

    // bind handlers
    this._onResize = this.debounce(() => this.reflow(), 150);
    this._tick = null;

    // initialize
    this.init();
}

/**
 * Initializes the carousel by setting dimensions and preparing the initial display
 */
async init(){
    await this.waitForMediaLoad();
    // initial layout and start
    this.reflow();
    window.addEventListener('resize', this._onResize);
    this._tick = setInterval(() => this.next(), this.interval);
}

/**
 * Wait for all media elements (videos/images) to be loaded and have dimensions
 */
async waitForMediaLoad(){
    const items = Array.from(this.el.querySelectorAll('.hdcarousel_item'));
    const media = items.flatMap(it => Array.from(it.querySelectorAll('video, img')));
    if (media.length === 0) return;
    await Promise.all(media.map(m => new Promise(r => {
        if (m.tagName === 'VIDEO'){
            if (m.videoWidth>0) return r();
            m.addEventListener('loadedmetadata', r, { once:true });
        } else if (m.tagName === 'IMG'){
            if (m.complete && m.naturalWidth>0) return r();
            m.addEventListener('load', r, { once:true });
        } else r();
        setTimeout(r, 1200);
    })));
}

/**
 * Calculates the width for each carousel item based on container width and desired item count
 * @returns {number} The calculated width for each item with gap considerations
 */
// compute per-item width based on wrapper width and desired visible count (max 3)
getSize(){
    const wrapper = this.el.parentElement || this.el;
    const containerWidth = wrapper.clientWidth || this.el.clientWidth || 800;
    const itemsCount = Math.max(1, this.el.querySelectorAll('.hdcarousel_item').length);
    const visible = Math.max(1, Math.min(3, itemsCount));
    if (itemsCount === 1) return Math.max(0, containerWidth - 20);
    const totalGap = this.gap * (visible - 1);
    const available = Math.max(0, containerWidth - totalGap);
    return Math.floor(available / visible);
}

/**
 * Positions all carousel items horizontally with proper spacing
 */
// layout items: set sizes, positions, z-index and container width
layout(){
    const items = Array.from(this.el.querySelectorAll('.hdcarousel_item'));
    if (items.length === 0) return;
    const itemW = this.getSize();
    const gap = this.gap;
    this.el.style.position = 'relative';
    let left = 0;
    for (let i=0;i<items.length;i++){
        const it = items[i];
        it.style.boxSizing = 'border-box';
        it.style.position = 'absolute';
        it.style.width = itemW + 'px';
        it.style.left = left + 'px';
        it.style.margin = '0';
        it.style.padding = '0';
        it.style.overflow = 'hidden';
        Array.from(it.querySelectorAll('video,img')).forEach(m=>{
            m.style.width='100%'; m.style.height='100%'; m.style.objectFit='cover'; m.style.display='block';
        });
    // higher zIndex for earlier items so current front item stays on top
    it.style.zIndex = String(items.length - i);
        left += itemW + (i < items.length-1 ? gap : 0);
    }
    // set carousel width to the total width of its items + gaps
    this.el.style.width = left + 'px';
    // set height to match first item's rendered height
    this.el.style.height = items[0].clientHeight + 'px';
}

/**
 * Positions single carousel item statically (no movement)
 */
// single item layout is same as layout(), call layout()
buildStatic(){ this.layout(); }

/**
 * Debounce helper: returns a function that delays calls to fn until wait ms have passed
 */
debounce(fn, wait=150){ let t=null; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }

/**
 * Resize handler: recompute item sizes and rebuild layout
 */
reflow(){
    this.layout();
}

/**
 * Creates a transition effect by cloning an item from one end to the other
 * @param {string} pos - Direction of movement: "next" (default) or "prev"
 */
// move first element to the end (used after sliding out)
moveFirstToEnd(){
    const first = this.el.querySelector('.hdcarousel_item');
    if (!first) return;
    // place it visually under the others immediately to avoid a split-second flash
    try {
        first.style.transition = '';
        first.style.opacity = '1';
        first.style.zIndex = '0';
    } catch (e) { /* ignore readonly styles */ }
    this.el.appendChild(first);
}

/**
 * Advances the carousel to the next slide by cloning and rebuilding
 */
next(){ if ((this.el.querySelectorAll('.hdcarousel_item')||[]).length>1) this.slideNext(); }

/**
 * Animate sliding to the next item: items move left and the outgoing item fades out.
 * After animation finishes, we clone/remove to keep the circular buffer and rebuild positions.
 */
async slideNext(){
    const items = Array.from(this.el.querySelectorAll('.hdcarousel_item'));
    if (items.length <= 1) return;
    const itemW = this.getSize();
    const shift = itemW + this.gap;
    const dur = this.animDuration;

    // set transitions and compute current lefts
    items.forEach(it=>{
        it.style.transition = `left ${dur}ms cubic-bezier(.2,.9,.2,1), opacity ${dur}ms linear`;
    });
    // force reflow
    this.el.offsetHeight;
    // move left and fade first
    items.forEach((it, idx)=>{
        const cur = parseFloat(it.style.left) || 0;
        it.style.left = (cur - shift) + 'px';
        if (idx === 0) it.style.opacity = '0';
    });

    // wait animation
    await new Promise(r=> setTimeout(r, dur + 40));
    // reset inline transition/opacity
    items.forEach(it=>{ it.style.transition=''; it.style.opacity='1'; });
    // rotate DOM and relayout
    this.moveFirstToEnd();
    this.layout();
}
}

// Initialize all carousels on the page
document.addEventListener('DOMContentLoaded', () => {
    // Find all carousel containers
    const carousels = document.querySelectorAll('.hdcarousel');
    
    // Initialize each carousel
    carousels.forEach((carousel, index) => {
        new HDcarousel(carousel);
    });
    
    // For backward compatibility, also initialize #carousel_1 if it exists
    const legacyCarousel = document.getElementById("carousel_1");
    if (legacyCarousel && !legacyCarousel.classList.contains('hdcarousel')) {
        new HDcarousel(legacyCarousel);
    }
});