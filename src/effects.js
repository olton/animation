import {animate} from "./index.js";

const EffectOptions = {
    duration: 300,
    ease: "linear",
    onStart: () => {},
    onDone: () => {},
}

const Effects = {
    switchIn: function(el, o){
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.setAttribute("hidden", true)
        el.style.display = "none"    
        el.style.left = "0"    
        el.style.top = "0"
        el.setAttribute("hidden", false)
        
        op.onDone(el)
    },

    switchOut: function(el){
        const op = Object.assign({}, EffectOptions, o);

        op.onStart(el)
        
        el.setAttribute("hidden", true)
        
        op.onDone(el)
    },

    switch: function(current, next, o){
        this.switchOut(current, o);
        this.switchIn(next, o);
    },

    slideUpIn: async function(el, o){
        const parent = el.parentElement
        const parentHeight = parent.offsetHeight
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.top = `${parentHeight}px`
        el.style.left = "0"
        el.style.zIndex = "2"
        
        await animate({
            el, 
            draw: {
                top: 0,
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideUpOut: async function(el, o){
        const parent = el.parentElement
        // const parentHeight = parent.offsetHeight
        const op = Object.assign({}, EffectOptions, o);

        op.onStart(el)
        
        el.style.zIndex = op.zIndex || "1"

        await animate({
            el, 
            draw: {
                top: -el.offsetHeight,
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideUp: function(current, next, o){
        this.slideUpOut(current, o).then(() => {});
        this.slideUpIn(next, o).then(() => {});
    },

    slideDownIn: async function(el, o){
        const parent = el.parentElement
        const parentHeight = parent.offsetHeight
        const op = Object.assign({}, EffectOptions, o);

        op.onStart(el)
        
        el.style.top = `-${parentHeight}px`
        el.style.left = "0"
        el.style.zIndex = op.zIndex || "2"
        
        await animate({
            el, 
            draw: {
                top: 0,
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideDownOut: async function(el, o){
        const parent = el.parentElement
        const parentHeight = parent.offsetHeight
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.zIndex = op.zIndex || "1"

        await animate({
            el, 
            draw: {
                top: parentHeight,
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideDown: function(current, next, o){
        this.slideDownOut(current, o).then(() => {});
        this.slideDownIn(next, o).then(() => {});
    },

    slideLeftIn: async function(el, o){
        const parent = el.parentElement
        const parentWidth = parent.offsetWidth
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.left = `${parentWidth}px`
        el.style.top = "0"
        el.style.zIndex = op.zIndex || "2"

        await animate({
            el, 
            draw: {
                left: 0,
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideLeftOut: async function(el, o){
        const parent = el.parentElement
        // const parentWidth = parent.offsetWidth
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.zIndex = op.zIndex || "1"

        await animate({
            el, 
            draw: {
                left: -el.offsetWidth,
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideLeft: function(current, next, o){
        this.slideLeftOut(current, o).then(() => {});
        this.slideLeftIn(next, o).then(() => {});
    },

    slideRightIn: async function(el, o){
        const parent = el.parentElement
        const parentWidth = parent.offsetWidth
        const op = Object.assign({}, EffectOptions, o);

        op.onStart(el)
        
        el.style.left = `-${parentWidth}px`
        el.style.top = "0"
        el.style.zIndex = op.zIndex || "2"
        
        await animate({
            el, 
            draw: {
                left: 0,
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideRightOut: async function(el, o){
        const parent = el.parentElement
        const parentWidth = parent.offsetWidth
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.zIndex = op.zIndex || "1"

        await animate({
            el, 
            draw: {
                left:  parentWidth,
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    slideRight: function(current, next, o){
        this.slideRightOut(current, o).then(() => {});
        this.slideRightIn(next, o).then(() => {});
    },

    fadeIn: async function(el, o){
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.top = "0"
        el.style.left = "0"
        el.style.opacity = "0"

        await animate({
            el,
            draw: {
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    fadeOut: async function(el, o){
        const op = Object.assign({}, EffectOptions, o);

        op.onStart(el)
        
        await animate({
            el, 
            draw: {
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    fade: function(current, next, o){
        this.fadeOut(current, o).then(() => {});
        this.fadeIn(next, o).then(() => {});
    },

    zoomIn: async function(el, o){
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.top = "0"
        el.style.left = "0"
        el.style.opacity = "0"
        el.style.transform = op.scale || "scale(3)"
        el.style.zIndex = op.zIndex || "2"

        await animate({
            el, 
            draw: {
                scale: 1,
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    zoomOut: async function(el, o){
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.zIndex = op.zIndex || "1"

        await animate({
            el, 
            draw: {
                scale: 3,
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    zoom: function(current, next, o){
        this.zoomOut(current, o).then(() => {});
        this.zoomIn(next, o).then(() => {});
    },

    swirlIn: async function(el, o){
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.top = "0"
        el.style.left = "0"
        el.style.opacity = "0"
        el.style.transform = `${op.scale || "scale(3)"} rotate(180deg)`
        el.style.zIndex = op.zIndex || "2"

        await animate({
            el, 
            draw: {
                scale: 1,
                rotate: 0,
                opacity: 1
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    swirlOut: async function(el, o){
        const op = Object.assign({}, EffectOptions, o);
        
        op.onStart(el)
        
        el.style.zIndex = op.zIndex || "1"

        await animate({
            el, 
            draw: {
                scale: 3,
                rotate: "180deg",
                opacity: 0
            },
            dur: op.duration,
            ease: op.ease
        });
        
        op.onDone(el)
    },

    swirl: function(current, next, o){
        this.swirlOut(current, o).then(() => {});
        this.swirlIn(next, o).then(() => {});
    }
}

export {
    Effects,
    EffectOptions,
}