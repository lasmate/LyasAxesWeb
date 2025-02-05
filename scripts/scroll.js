var totalImages = 240;
var images = [];
for (var i = 0; i < totalImages; i++) {
    var formattedIndex = ('0000' + i).slice(-4);
    var img = new Image();
    img.src = 'imgscrl/' + formattedIndex + '.webp';
    images.push(img);
}

document.addEventListener('scroll', function() {
    var scrollPosition = window.scrollY;
    var heroElement = document.getElementById('hero-lightpass');
    var imageIndex = Math.min(Math.floor(scrollPosition / 10), totalImages - 1); // Adjust the divisor as needed
    var formattedIndex = ('0000' + imageIndex).slice(-4); // Format the index to be four digits
    var newImage = 'imgscrl/' + formattedIndex + '.webp'; // Create the new image path

    heroElement.style.backgroundImage = 'url(' + newImage + ')';

    if (imageIndex === totalImages - 1) {
        window.scrollTo(0, 0); // Reset scroll position to 0 when the last image is reached
    }
});