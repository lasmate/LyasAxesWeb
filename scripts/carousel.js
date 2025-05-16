
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
    
    this.items = this.el.getElementsByClassName("hdcarousel_item");
    
    if (this.items.length === 0) {
        console.error("No carousel items found in:", selector);
        return;
    }

    this.init();
    console.log(this);
}

/**
 * Initializes the carousel by setting dimensions and preparing the initial display
 */
async init(){
    this.item.width = await this.getSize();
    this.el.style.height = this.items[0].clientHeight + "px";

    await this.clone("next");
    await this.build();
    // Set up automatic sliding every 8 seconds
    setInterval(() => {
        this.next();
    }, 8000);
}

/**
 * Calculates the width for each carousel item based on container width and desired item count
 * @returns {number} The calculated width for each item with gap considerations
 */
async getSize(){
    let w = this.el.clientWidth;
    w = w / this.size;
    let diff= this.gap * this.size ;
    w = w - diff;
    return w;
}

/**
 * Positions all carousel items horizontally with proper spacing
 */
async build(){
    let l=this.items.length*-1
    for (let i = 0; i < this.items.length; i++){
        this.items[i].style.width = this.item.width + "px";
        this.items[i].style.left = l + "px";
        l = l + this.item.width 
        if (i >0){
            l=l + this.gap;
        }
    }
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
    await this.clone("next");
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