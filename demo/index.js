const field = document.querySelector("#field")
const ball = document.querySelector("#ball")
const w = field.clientWidth, h = field.clientHeight

animate = Animation.animate

animate({
    el: ball,
    draw: {
        left: [0, w - ball.clientWidth]
    },
    dur: 2000,
    ease: "easeOutQuad",
    loop: true
});

// Drop ball down
animate({
    el: ball,
    draw: {
        top: [0, h - ball.clientHeight]
    },
    dur: 2000,
    ease: "easeOutBounce",
    loop: true
});

// Rotate ball
animate({
    el: ball,
    draw: {
        rotate: [0, 360]
    },
    dur: 1200,
    loop: true
});