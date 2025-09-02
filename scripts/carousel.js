
class HDcarousel{
    version = 0.2;
    el = null;
    items=[];
    size =3;
    gap = 20;// fixed margin between items (px)
    item = {
        width:0,
        gap:0,
        left:0,
    }
/**
 * Initializes a new HDcarousel instance
 * @param {string|Element} selector - CSS selector or DOM element for the carousel container
 */
constructor(selector){
    console.log("HDcarousel v" + this.version + " init")
    if (typeof selector === 'string') {
        this.el = document.querySelector(selector);
    } else {
        this.el = selector; // If an element is directly passed
    }
    
    if (!this.el) {
        console.error("Could not find element with selector:", selector);
        return;
    }

    // expose instance for easier debugging from console
    this.el.__hdInstance = this;

    // prepare debounced resize handler (bound to this)
    this._onResize = this.debounce(this.onResize, 150);
    
    // Set carousel to match its wrapper's width and prevent overflow
    this.el.style.width = '90%';
    this.el.style.overflow = 'hidden';
    // ensure positioning context for absolute children
    if (!this.el.style.position) this.el.style.position = 'relative';
    
    this.items = this.el.getElementsByClassName("hdcarousel_item");
    
    // If no hdcarousel_item found, also look for hdcarousel_item_idle
    if (this.items.length === 0) {
        this.items = this.el.querySelectorAll(".hdcarousel_item, .hdcarousel_item_idle");
    }
    
    if (this.items.length === 0) {
        console.error("No carousel items found in:", selector);
        return;
    }

    // Set size based on actual number of items (but keep minimum display of 1)
    this.size = Math.max(1, Math.min(3, this.items.length));

    this.init();
    console.log(this);
}

/**
 * Initializes the carousel by setting dimensions and preparing the initial display
 */
async init(){
    // Wait for all video elements to be ready
    await this.waitForMediaLoad();
    
    this.item.width = await this.getSize();
    this.el.style.height = this.items[0].clientHeight + "px";

    // Only initialize carousel behavior if there are multiple items
    if (this.items.length > 1) {
        await this.clone("next");
        await this.build();
        // Set up automatic sliding every 8 seconds
        setInterval(() => {
            this.next();
        }, 8000);
    } else {
        // For single items, just position them statically
        await this.buildStatic();
    }
    
    // Register resize listener so carousel rebuilds on window resize (debounced)
    if (typeof window !== 'undefined' && this._onResize) {
        window.addEventListener('resize', this._onResize);
    }

    // Show the carousel now that it's properly initialized
    this.el.style.opacity = '1';
    this.el.style.visibility = 'visible';
    this.el.style.transition = 'opacity 0.3s ease-in-out';
}

/**
 * Wait for all media elements (videos/images) to be loaded and have dimensions
 */
async waitForMediaLoad() {
    const mediaElements = Array.from(this.items).filter(item => 
        item.tagName === 'VIDEO' || item.tagName === 'IMG'
    );
    
    if (mediaElements.length === 0) return;
    
    const promises = mediaElements.map(media => {
        return new Promise((resolve) => {
            if (media.tagName === 'VIDEO') {
                if (media.videoWidth > 0 && media.videoHeight > 0) {
                    resolve();
                } else {
                    media.addEventListener('loadedmetadata', resolve, { once: true });
                    // Fallback timeout
                    setTimeout(resolve, 1000);
                }
            } else if (media.tagName === 'IMG') {
                if (media.complete && media.naturalWidth > 0) {
                    resolve();
                } else {
                    media.addEventListener('load', resolve, { once: true });
                    // Fallback timeout
                    setTimeout(resolve, 1000);
                }
            } else {
                resolve();
            }
        });
    });
    
    await Promise.all(promises);
    
    // Additional small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Calculates the width for each carousel item based on container width and desired item count
 * @returns {number} The calculated width for each item with gap considerations
 */
async getSize(){
    // Get the wrapper's width instead of the carousel's width
    const wrapper = this.el.parentElement;
    let containerWidth = wrapper ? wrapper.clientWidth : this.el.clientWidth;
    
    // Make sure carousel uses full wrapper width
    this.el.style.width = '100%';
    
    // For single items, use the full wrapper width minus padding
    if (this.items.length === 1) {
        this.gap = 0;
        const itemWidth = containerWidth - 20; // Leave some padding
        return itemWidth;
    }
    
    // Use a fixed gap to avoid variable spacing issues that can cause overlap
    this.gap = 20; // px

    // Calculate individual item width so that items + gaps fit within the container
    const availableWidth = Math.max(0, containerWidth - (this.gap * (this.size - 1)));
    // Floor the width to ensure we never exceed container width due to fractions
    const baseItemWidth = Math.floor(availableWidth / this.size);

    console.log(`Carousel ${this.el.id}: wrapper=${containerWidth}px, items=${this.items.length}, itemWidth=${baseItemWidth}px, gap=${this.gap}px`);

    return baseItemWidth;
}

/**
 * Positions all carousel items horizontally with proper spacing
 */
async build(){
    // Ensure container is positioned relative so absolute children are placed correctly
    this.el.style.position = 'relative';

    // Use precise arithmetic and enforce box-sizing so borders/padding don't change layout
    let l = 0; // Start from left edge
    const gap = Number(this.gap) || 20;
    for (let i = 0; i < this.items.length; i++){
        const it = this.items[i];
        // enforce layout-safe styles
        it.style.boxSizing = 'border-box';
        it.style.margin = '0';
        it.style.padding = '0';
        it.style.overflow = 'hidden';
        it.style.position = 'absolute';

        // set width and left
        it.style.width = this.item.width + "px";
        it.style.left = l + "px";

        // ensure media inside the item fit their container
        Array.from(it.querySelectorAll('video, img')).forEach(m => {
            m.style.width = '100%';
            m.style.height = '100%';
            m.style.objectFit = 'cover';
            m.style.display = 'block';
        });

        // set z-index so earlier items (index 0) are on top of later ones
        // higher value for lower index
        try{ it.style.zIndex = String(this.items.length - i); }catch(e){}

        // advance left position by item width + gap
        l = l + this.item.width + (i < this.items.length - 1 ? gap : 0);
    }
    // After positioning items, set the carousel element width to total required width
    // so that the wrapper can clip/scroll it appropriately.
    try { this.el.style.width = l + 'px'; } catch(e) { /* ignore */ }
}

/**
 * Positions single carousel item statically (no movement)
 */
async buildStatic(){
    this.items[0].style.width = this.item.width + "px";
    this.items[0].style.left = "0px"; // Align to the left edge
    // set carousel width to match single item
    try { this.el.style.width = this.item.width + 'px'; } catch(e){}
}

/**
 * Debounce helper: returns a function that delays calls to fn until wait ms have passed
 */
debounce(fn, wait = 150){
    let timer = null;
    return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            // call async functions without awaiting here
            (async () => {
                try { await fn.apply(this, args); } catch(e){ console.error(e); }
            })();
        }, wait);
    };
}

/**
 * Resize handler: recompute item sizes and rebuild layout
 */
async onResize(){
    // compute new size
    this.item.width = await this.getSize();
    // rebuild appropriate layout
    if (this.items.length > 1) await this.build();
    else await this.buildStatic();
    // update container height to match first item
    if(this.items[0]) this.el.style.height = this.items[0].clientHeight + "px";
}

/**
 * Creates a transition effect by cloning an item from one end to the other
 * @param {string} pos - Direction of movement: "next" (default) or "prev"
 */
async clone(pos="prev"){
    let item = 0;
    if (pos === "prev"){
        item = this.items[0]

    }else{
        item = this.items[this.items.length - 1];
    }
    let c = item.cloneNode(true);

    if( pos === "prev"){
        this.el.appendChild(c);
    }else{
        this.el.prepend(c);
    }
    item.remove();
}

/**
 * Advances the carousel to the next slide by cloning and rebuilding
 */
async next(){
    // Only advance if there are multiple items
    if (this.items.length > 1) {
        await this.slideNext();
    }
}

/**
 * Animate sliding to the next item: items move left and the outgoing item fades out.
 * After animation finishes, we clone/remove to keep the circular buffer and rebuild positions.
 */
async slideNext(){
    if (this.items.length <= 1) return;
    const gap = Number(this.gap) || 20;
    const shift = this.item.width + gap;
    const duration = 480; // ms, matches CSS transition below

    // ensure we have numeric lefts for all items
    for(let i=0;i<this.items.length;i++){
        const it = this.items[i];
        const cur = parseFloat(it.style.left) || 0;
        it.style.left = cur + 'px'; // normalize
        it.style.transition = `left ${duration}ms cubic-bezier(.2,.9,.2,1), opacity ${duration}ms linear`;
    }

    // trigger layout then set new positions
    // move every item left by `shift` and fade out the leftmost one
    // pick the outgoing element (current leftmost) - index 0
    const outgoing = this.items[0];
    // Force reflow
    this.el.offsetHeight;

    for(let i=0;i<this.items.length;i++){
        const it = this.items[i];
        const cur = parseFloat(it.style.left) || 0;
        it.style.left = (cur - shift) + 'px';
    }
    // fade outgoing
    try{ outgoing.style.opacity = '0'; }catch(e){}

    // wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration + 40));

    // cleanup transitions and opacities
    for(let i=0;i<this.items.length;i++){
        const it = this.items[i];
        it.style.transition = '';
        it.style.opacity = '1';
    }

    // rotate DOM: move the outgoing (first) element to the end so sequence continues
    await this.clone("prev");
    await this.build();
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