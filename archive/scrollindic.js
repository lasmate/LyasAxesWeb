function oscillateArrows() {
    const arrow1 = document.getElementById('downarrow1');
    const arrow2 = document.getElementById('downarrow2');
    let position = 0;
    let direction = 1;
    const speed = 0.05; // Adjust speed for slower oscillation

    function animate() {
    position += direction * speed;
    if (position > 10 || position < 0) {
        direction *= -1;
    }
    arrow1.style.transform = `translateY(${position}px)`;
    arrow2.style.transform = `translateY(${-position}px)`;
    requestAnimationFrame(animate);
    }

    animate();
}

document.addEventListener('DOMContentLoaded', oscillateArrows);