
class HDcarousel{
    version = 0.2;
    el = null;
    items=[];
    size =3;
    gap = 0;//margin between items
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
    
    // Set carousel to match its wrapper's width and prevent overflow
    this.el.style.width = '100%';
    this.el.style.overflow = 'hidden';
    
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
    
    // For multi-item carousels, calculate spacing to fit within wrapper
    this.gap = Math.max(containerWidth * 0.015, 10); // 1.5% of wrapper width, minimum 10px
    
    // Calculate individual item width to fit within the wrapper
    const availableWidth = containerWidth - (this.gap * (this.size - 1));
    const baseItemWidth = availableWidth / this.size;
    
    console.log(`Carousel ${this.el.id}: wrapper=${containerWidth}px, items=${this.items.length}, itemWidth=${baseItemWidth}px, gap=${this.gap}px`);
    
    return baseItemWidth;
}

/**
 * Positions all carousel items horizontally with proper spacing
 */
async build(){
    let l = 0; // Start from left edge
    for (let i = 0; i < this.items.length; i++){
        this.items[i].style.width = this.item.width + "px";
        this.items[i].style.left = l + "px";
        l = l + this.item.width;
        if (i < this.items.length - 1){ // Add gap except after the last item
            l = l + this.gap;
        }
    }
}

/**
 * Positions single carousel item statically (no movement)
 */
async buildStatic(){
    this.items[0].style.width = this.item.width + "px";
    this.items[0].style.left = "0px"; // Align to the left edge
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
        await this.clone("next");
        await this.build();
    }
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