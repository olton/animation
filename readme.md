# Animation.JS
Animation.js - is a small library for animating HTML elements.

## Install
```shell
npm install @olton/animation
```

## Using example
![](https://raw.githubusercontent.com/olton/animationjs/master/public/images/animating-ball.gif?token=GHSAT0AAAAAAB6BLCLN7XLLTPZMTSWSGMU2Y7QVIRA)

Style
```style
body {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
}

#field {
    width: 500px;
    height: 500px;
    border: 1px solid #1e2128;
    position: relative;
}

#ball {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: red;
    position: absolute;
    background: url("ball.svg") center no-repeat;
    background-size: cover;
}
```
Html
```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="index.css">
</head>
<body>
    <div id="field">
        <div id="ball"></div>
    </div>
    <script src="index.js" type="module"></script>
</body>
</html>
```
JavaScript
```javascript
import {animate} from "@olton/animation"

const field = document.querySelector(".wrapper");
const w = field.clientWidth, h = field.clientHeight;
const ball = document.querySelector(".ball");

// Move ball left
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
```

## License
This software is free to use under the MIT license. See the [LICENSE](LICENSE) file for license text and copyright information.