
/*!
 * Animation - Library for animating HTML elements.
 * Copyright 2024 by Serhii Pimenov
 * Licensed under MIT
 !*/

(function () {
    'use strict';

    const transformProps = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY'];
    const numberProps = ['opacity', 'zIndex'];
    const floatProps = ['opacity', 'volume'];
    const scrollProps = ["scrollLeft", "scrollTop"];
    const colorProps = ["backgroundColor", "color"];
    const reverseProps = ["opacity"];

    const _getRelativeValue = (to, from) => {
        const operator = /^(\*=|\+=|-=)/.exec(to);
        if (!operator) return to;
        const u = getUnit(to) || 0;
        const x = parseFloat(from);
        const y = parseFloat(to.replace(operator[0], ''));
        switch (operator[0][0]) {
            case '+':
                return x + y + u;
            case '-':
                return x - y + u;
            case '*':
                return x * y + u;
        }
    };

    const _getStyle = (el, prop, pseudo) => {
        if (typeof el[prop] !== "undefined") {
            if (scrollProps.includes(prop)) {
                return prop === "scrollLeft" ? el === window ? pageXOffset : el.scrollLeft : el === window ? pageYOffset : el.scrollTop
            } else {
                return el[prop] || 0;
            }
        }
        return el.style[prop] || getComputedStyle(el, pseudo)[prop];
    };

    const _setStyle = (el, key, val, unit, toInt = false) => {
        key = camelCase(key);

        if (toInt) {
            val  = parseInt(val);
        }

        if (el instanceof HTMLElement) {
            if (typeof el[key] !== "undefined") {
                el[key] = val;
            } else {
                el.style[key] = key === "transform" || key.toLowerCase().includes('color') ? val : val + unit;
            }
        } else {
            el[key] = val;
        }
    };

    const _applyStyles = (el, mapProps, p) => {
        each(mapProps, (key, val) => {
            _setStyle(el, key, val[0] + (val[2] * p), val[3], val[4]);
        });
    };

    const _getElementTransforms = (el) => {
        if (!(el instanceof HTMLElement)) return;
        const str = el.style.transform || '';
        const reg = /(\w+)\(([^)]*)\)/g;
        const transforms = new Map();
        let m;
        while (m = reg.exec(str))
            transforms.set(m[1], m[2]);
        return transforms;
    };

    const _getColorArrayFromHex = (val) => Array.from(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(val ? val : "#000000")).slice(1).map((v) => parseInt(v, 16));
    const _getColorArrayFromElement = (el, key) => getComputedStyle(el)[key].replace(/[^\d.,]/g, '').split(',').map((v) => parseInt(v));

    const _applyTransform = (el, mapProps, p) => {
        let t = [];
        let elTransforms = _getElementTransforms(el);

        each(mapProps, (key, val) => {
            let from = val[0]; val[1]; let delta = val[2], unit = val[3];

            if ((key).includes("rotate") || (key).includes("skew")) {
                if (unit === "") unit = "deg";
            } else if ((key).includes("scale")) {
                unit = "";
            } else {
                unit = "px";
            }

            if (unit === "turn") {
                t.push(`${key}(${(val[1] * p) + unit})`);
            } else {
                t.push(`${key}(${from + (delta * p) + unit})`);
            }
        });

        elTransforms.forEach((val, key) => {
            if (mapProps[key] === undefined) {
                t.push(`${key}(${val})`);
            }
        });

        _setStyle(el, "transform", t.join(" "));
    };

    const _applyColors = function (el, mapProps, p) {
        each(mapProps, function (key, val) {
            let result = [0, 0, 0];
            for (let i = 0; i < 3; i++) {
                result[i] = Math.floor(val[0][i] + (val[2][i] * p));
            }
            _setStyle(el, key, `rgb(${result.join(",")})`);
        });
    };

    const _expandColorValue = (val) => {
        const regExp = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        if (val[0] === "#" && val.length === 4) {
            return "#" + val.replace(regExp, (m, r, g, b) => {
                return r + r + g + g + b + b;
            });
        }
        return val[0] === "#" ? val : "#"+val;
    };

    const applyProps = function (el, map, p) {
        _applyStyles(el, map.props, p);
        _applyTransform(el, map.transform, p);
        _applyColors(el, map.color, p);
    };

    const createAnimationMap = (el, draw, dir = "normal") => {
        const map = {
            props: {},
            transform: {},
            color: {}
        };
        let from, to, delta, unit;
        let elTransforms = _getElementTransforms(el);

        each(draw, (key, val) => {
            const isTransformProp = transformProps.includes(key);
            const isNumProp = numberProps.includes(key);
            const isColorProp = colorProps.includes(key);

            if (Array.isArray(val) && val.length === 1) {
                val = val[0];
            }

            if (!Array.isArray(val)) {
                if (isTransformProp) {
                    from = elTransforms.get(key) || 0;
                } else if (isColorProp) {
                    from = _getColorArrayFromElement(el, key);
                } else {
                    from = _getStyle(el, key);
                }
                from = !isColorProp ? parseUnit(from) : from;
                to = !isColorProp ? parseUnit(_getRelativeValue(val, Array.isArray(from) ? from[0] : from)) : _getColorArrayFromHex(val);
            } else {
                from = !isColorProp ? parseUnit(val[0]) : _getColorArrayFromHex(_expandColorValue(val[0]));
                to = !isColorProp ? parseUnit(val[1]) : _getColorArrayFromHex(_expandColorValue(val[1]));
            }

            if (reverseProps.includes(key) && from[0] === to[0]) {
                from[0] = to[0] > 0 ? 0 : 1;
            }

            if (dir === "reverse") {
                [to, from] = [from, to];
            }

            unit = el instanceof HTMLElement && to[1] === '' && !isNumProp && !isTransformProp ? 'px' : to[1];

            if (isColorProp) {
                delta = [0, 0, 0];
                for (let i = 0; i < 3; i++) {
                    delta[i] = to[i] - from[i];
                }
            } else {
                delta = to[0] - from[0];
            }

            if (isTransformProp) {
                map.transform[key] = [from[0], to[0], delta, unit];
            } else if (isColorProp) {
                map.color[key] = [from, to, delta, unit];
            } else {
                map.props[key] = [from[0], to[0], delta, unit, !floatProps.includes(key)];
            }
        });

        return map;
    };

    const exec = (fn, args, context) => {
        let func;

        if (typeof fn === "function") {
            func = fn;
        } else
        if (/^[a-z]+[\w.]*[\w]$/i.test(fn)) {
            const ns = fn.split(".");
            func = global;

            for(let i = 0; i < ns.length; i++) {
                func = func[ns[i]];
            }
        } else {
            func = new Function("a", fn);
        }

        return func.apply(context, args);
    };

    const undef = (val) => typeof val === "undefined" || val === undefined || val === null;

    const camelCase = (str) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

    const each = (ctx, cb) => {
        let index = 0;
        if (isArrayLike(ctx)) {
            [].forEach.call(ctx, function(val, key) {
                cb.apply(val, [key, val]);
            });
        } else {
            for(let key in ctx) {
                if (ctx.hasOwnProperty(key))
                    cb.apply(ctx[key], [key, ctx[key],  index++]);
            }
        }

        return ctx;
    };

    const isArrayLike = (obj) => {
        return (
            Array.isArray(obj) || (
                typeof obj === "object" &&
                "length" in obj &&
                typeof obj.length === "number"
            )
        );
    };

    const getUnit = (val, und) => {
        const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
        return typeof split[1] !== "undefined" ? split[1] : und;
    };

    const parseUnit = (str) => {
        const out = [ 0, '' ];
        str = ""+str;
        out[0] = parseFloat(str);
        out[1] = str.match(/[\d.\-+]*\s*(.*)/)[1] || '';
        return out;
    };

    const noop = () => {};

    // Based on anime.js by Julian Garnier (https://github.com/juliangarnier/anime)

    function minMax(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }

    const Easing = {
        linear: () => t => t
    };

    Easing.default = Easing.linear;

    const eases = {
        Sine: () => t => 1 - Math.cos(t * Math.PI / 2),
        Circ: () => t => 1 - Math.sqrt(1 - t * t),
        Back: () => t => t * t * (3 * t - 2),
        Bounce: () => t => {
            let pow2, b = 4;
            while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
            return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
        },
        Elastic: (amplitude = 1, period = .5) => {
            const a = minMax(amplitude, 1, 10);
            const p = minMax(period, .1, 2);
            return t => {
                return (t === 0 || t === 1) ? t :
                    -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
            }
        }
    };

    ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'].forEach((name, i) => {
        eases[name] = () => t => Math.pow(t, i + 2);
    });

    Object.keys(eases).forEach(name => {
        const easeIn = eases[name];
        Easing['easeIn' + name] = easeIn;
        Easing['easeOut' + name] = (a, b) => t => 1 - easeIn(a, b)(1 - t);
        Easing['easeInOut' + name] = (a, b) => t => t < 0.5 ? easeIn(a, b)(t * 2) / 2 :
            1 - easeIn(a, b)(t * -2 + 2) / 2;
    });

    const EffectOptions = {
        duration: 300,
        ease: "linear",
        onStart: () => {},
        onDone: () => {},
    };

    const Effects = {
        switchIn: function(el, o){
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.setAttribute("hidden", true);
            el.style.display = "none";    
            el.style.left = "0";    
            el.style.top = "0";
            el.setAttribute("hidden", false);
            
            op.onDone(el);
        },

        switchOut: function(el){
            const op = Object.assign({}, EffectOptions, o);

            op.onStart(el);
            
            el.setAttribute("hidden", true);
            
            op.onDone(el);
        },

        switch: function(current, next, o){
            this.switchOut(current, o);
            this.switchIn(next, o);
        },

        slideUpIn: async function(el, o){
            const parent = el.parentElement;
            const parentHeight = parent.offsetHeight;
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.top = `${parentHeight}px`;
            el.style.left = "0";
            el.style.zIndex = "2";
            
            await animate({
                el, 
                draw: {
                    top: 0,
                    opacity: 1
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideUpOut: async function(el, o){
            el.parentElement;
            // const parentHeight = parent.offsetHeight
            const op = Object.assign({}, EffectOptions, o);

            op.onStart(el);
            
            el.style.zIndex = op.zIndex || "1";

            await animate({
                el, 
                draw: {
                    top: -el.offsetHeight,
                    opacity: 0
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideUp: function(current, next, o){
            this.slideUpOut(current, o).then(() => {});
            this.slideUpIn(next, o).then(() => {});
        },

        slideDownIn: async function(el, o){
            const parent = el.parentElement;
            const parentHeight = parent.offsetHeight;
            const op = Object.assign({}, EffectOptions, o);

            op.onStart(el);
            
            el.style.top = `-${parentHeight}px`;
            el.style.left = "0";
            el.style.zIndex = op.zIndex || "2";
            
            await animate({
                el, 
                draw: {
                    top: 0,
                    opacity: 1
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideDownOut: async function(el, o){
            const parent = el.parentElement;
            const parentHeight = parent.offsetHeight;
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.zIndex = op.zIndex || "1";

            await animate({
                el, 
                draw: {
                    top: parentHeight,
                    opacity: 0
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideDown: function(current, next, o){
            this.slideDownOut(current, o).then(() => {});
            this.slideDownIn(next, o).then(() => {});
        },

        slideLeftIn: async function(el, o){
            const parent = el.parentElement;
            const parentWidth = parent.offsetWidth;
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.left = `${parentWidth}px`;
            el.style.top = "0";
            el.style.zIndex = op.zIndex || "2";

            await animate({
                el, 
                draw: {
                    left: 0,
                    opacity: 1
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideLeftOut: async function(el, o){
            el.parentElement;
            // const parentWidth = parent.offsetWidth
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.zIndex = op.zIndex || "1";

            await animate({
                el, 
                draw: {
                    left: -el.offsetWidth,
                    opacity: 0
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideLeft: function(current, next, o){
            this.slideLeftOut(current, o).then(() => {});
            this.slideLeftIn(next, o).then(() => {});
        },

        slideRightIn: async function(el, o){
            const parent = el.parentElement;
            const parentWidth = parent.offsetWidth;
            const op = Object.assign({}, EffectOptions, o);

            op.onStart(el);
            
            el.style.left = `-${parentWidth}px`;
            el.style.top = "0";
            el.style.zIndex = op.zIndex || "2";
            
            await animate({
                el, 
                draw: {
                    left: 0,
                    opacity: 1
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideRightOut: async function(el, o){
            const parent = el.parentElement;
            const parentWidth = parent.offsetWidth;
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.zIndex = op.zIndex || "1";

            await animate({
                el, 
                draw: {
                    left:  parentWidth,
                    opacity: 0
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        slideRight: function(current, next, o){
            this.slideRightOut(current, o).then(() => {});
            this.slideRightIn(next, o).then(() => {});
        },

        fadeIn: async function(el, o){
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.top = "0";
            el.style.left = "0";
            el.style.opacity = "0";

            await animate({
                el,
                draw: {
                    opacity: 1
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        fadeOut: async function(el, o){
            const op = Object.assign({}, EffectOptions, o);

            op.onStart(el);
            
            await animate({
                el, 
                draw: {
                    opacity: 0
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        fade: function(current, next, o){
            this.fadeOut(current, o).then(() => {});
            this.fadeIn(next, o).then(() => {});
        },

        zoomIn: async function(el, o){
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.top = "0";
            el.style.left = "0";
            el.style.opacity = "0";
            el.style.transform = op.scale || "scale(3)";
            el.style.zIndex = op.zIndex || "2";

            await animate({
                el, 
                draw: {
                    scale: 1,
                    opacity: 1
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        zoomOut: async function(el, o){
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.zIndex = op.zIndex || "1";

            await animate({
                el, 
                draw: {
                    scale: 3,
                    opacity: 0
                },
                dur: op.duration,
                ease: op.ease
            });
            
            op.onDone(el);
        },

        zoom: function(current, next, o){
            this.zoomOut(current, o).then(() => {});
            this.zoomIn(next, o).then(() => {});
        },

        swirlIn: async function(el, o){
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.top = "0";
            el.style.left = "0";
            el.style.opacity = "0";
            el.style.transform = `${op.scale || "scale(3)"} rotate(180deg)`;
            el.style.zIndex = op.zIndex || "2";

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
            
            op.onDone(el);
        },

        swirlOut: async function(el, o){
            const op = Object.assign({}, EffectOptions, o);
            
            op.onStart(el);
            
            el.style.zIndex = op.zIndex || "1";

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
            
            op.onDone(el);
        },

        swirl: function(current, next, o){
            this.swirlOut(current, o).then(() => {});
            this.swirlIn(next, o).then(() => {});
        }
    };

    const Animation = {
        fx: true,
        elements: {}
    };

    const defaultProps = {
        id: null,
        el: null,
        draw: {},
        dur: 1000,
        ease: "linear",
        loop: 0,
        pause: 0,
        dir: "normal",
        defer: 0,
        onFrame: noop,
        onDone: noop
    };

    const animate = function(args){
        return new Promise(function(resolve){
            let {
                id, 
                el, 
                draw, 
                dur, 
                ease, 
                loop, 
                onFrame, 
                onDone, 
                pause, 
                dir, 
                defer
            } = Object.assign({}, defaultProps, args);
            let map = {};
            let easeName = "linear", easeArgs = [], easeFn = Easing.linear, matchArgs;
            let direction = dir === "alternate" ? "normal" : dir;
            let replay = false;
            let animationID = id ? id : +(performance.now() * Math.pow(10, 14));

            if (undef(el)) {
                throw new Error("Unknown element!")
            }

            if (typeof el === "string") {
                el = document.querySelector(el);
            }

            if (typeof draw !== "function" && typeof draw !== "object") {
                throw new Error("Unknown draw object. Must be a function or object!")
            }

            if (dur === 0 || !Animation.fx) {
                dur = 1;
            }

            if (dir === "alternate" && typeof loop === "number") {
                loop *= 2;
            }

            if (typeof ease === "string") {
                matchArgs = /\(([^)]+)\)/.exec(ease);
                easeName = ease.split("(")[0];
                easeArgs = matchArgs ? matchArgs[1].split(',').map(p => parseFloat(p)) : [];
                easeFn = Easing[easeName];
            } else if (typeof ease === "function") {
                easeFn = ease;
            } else {
                easeFn = Easing.linear;
            }

            Animation.elements[animationID] = {
                element: el,
                id: null,
                stop: 0,
                pause: 0,
                loop: 0,
                t: -1,
                started: 0,
                paused: 0
            };

            const play = () => {
                if (typeof draw === "object") {
                    map = createAnimationMap(el, draw, direction);
                }
                Animation.elements[animationID].loop += 1;
                Animation.elements[animationID].started = performance.now();
                Animation.elements[animationID].duration = dur;
                Animation.elements[animationID].paused = false;
                Animation.elements[animationID].id = requestAnimationFrame(animate);
            };

            const done = () => {
                const el = Animation.elements[animationID].element;
                cancelAnimationFrame(Animation.elements[animationID].id);
                exec(onDone, null, el);
                exec(resolve, [this], el);
                delete Animation.elements[animationID];
            };

            const animate = (time) => {
                let p, t;
                let _stop = Animation.elements[animationID].stop;
                let _pause = Animation.elements[animationID].paused;
                let _start = Animation.elements[animationID].started;

                if (Animation.elements[animationID].paused) {
                    Animation.elements[animationID].started = time - Animation.elements[animationID].t * dur;
                }
                
                if ( _stop > 0) {
                    if (_stop === 2) {
                        if (typeof draw === "function") {
                            draw.bind(el)(1, 1);
                        } else {
                            applyProps(el, map, 1);
                        }
                    }
                    done();
                    return
                }

                t = (time - _start) / dur;

                if (t > 1) t = 1;
                if (t < 0) t = 0;

                p = easeFn.apply(null, easeArgs)(t);

                Animation.elements[animationID].t = t;
                Animation.elements[animationID].p = p;

                if (_pause) {
                    Animation.elements[animationID].id = requestAnimationFrame(animate);
                    return;
                }
                
                if (typeof draw === "function") {
                    draw.bind(el)(t, p);
                } else {
                    applyProps(el, map, p);
                }

                exec(onFrame, [t, p], el);

                if (t < 1) {
                    Animation.elements[animationID].id = requestAnimationFrame(animate);
                }

                if (parseInt(t) === 1) {
                    if (loop) {
                        if (dir === "alternate") {
                            direction = direction === "normal" ? "reverse" : "normal";
                        }

                        if (typeof loop === "boolean") {
                            setTimeout(function () {
                                play();
                            }, pause);
                        } else {
                            if (loop > Animation.elements[animationID].loop) {
                                setTimeout(function () {
                                    play();
                                }, pause);
                            } else {
                                done();
                            }
                        }
                    } else {
                        if (dir === "alternate" && !replay) {
                            direction = direction === "normal" ? "reverse" : "normal";
                            replay = true;
                            play();
                        } else {
                            done();
                        }
                    }
                }
            };
            if (defer > 0) {
                setTimeout(()=>{
                    play();
                }, defer);
            } else {
                play();
            }
        })
    };

    const pause = function(id){
        Animation.elements[id].paused = true;
    };

    const resume = function(id){
        Animation.elements[id].paused = false;
    };

    const toggle = function(id){
        Animation.elements[id].paused = !Animation.elements[id].paused;
    };

    const pauseAll = function(){
        Object.keys(Animation.elements).forEach(id => {
            pause(id);
        });
    };

    const resumeAll = function(){
        Object.keys(Animation.elements).forEach(id => {
            resume(id);
        });
    };

    const toggleAll = function(){
        Object.keys(Animation.elements).forEach(id => {
            toggle(id);
        });
    };

    const stop = function(id, done = true){
        Animation.elements[id].stop = done === true ? 2 : 1;
    };

    const stopAll = function(done = true){
        Object.keys(Animation.elements).forEach(id => {
            stop(id, done);
        });    
    };

    const defaultChainOptions = {
        loop: false,
        onChainItem: noop,
        onChainItemComplete: noop,
        onChainComplete: noop,
    };

    async function chain(arr = [], options = {}) {
        const o = Object.assign({}, defaultChainOptions, options);
        
        for(let i = 0; i < arr.length; i ++) {
            const a = arr[i];
            a.loop = false;
            
            o.onChainItem.apply(a,  [a, arr]);
            
            await animate(a);
            
            o.onChainItemComplete.apply(a, [a, arr]);
        }
        
        o.onChainComplete.apply(arr, [arr]);
        
        if (typeof o.loop === "boolean" && o.loop) {
            await chain(arr, o.loop);
        } else if (typeof o.loop === "number") {
            o.loop--;
            if (o.loop > 0) {
                await chain(arr, o.loop);
            }
        }
    }

    const version = "0.4.0";
    const build_time = "09.12.2024, 19:54:06";

    const info = () => {
        console.info(`%c Animation %c v${version} %c ${build_time} `, "color: #ffffff; font-weight: bold; background: #468284", "color: white; background: darkgreen", "color: white; background: #0080fe;");
    };

    Animation.animate = animate;
    Animation.stop = stop;
    Animation.stopAll = stopAll;
    Animation.chain = chain;
    Animation.pause = pause;
    Animation.resume = resume;
    Animation.toggle = toggle;
    Animation.pauseAll = pauseAll;
    Animation.resumeAll = resumeAll;
    Animation.toggleAll = toggleAll;
    Animation.easing = Easing;
    Animation.effects = Effects;
    Animation.effectOptions = EffectOptions;
    Animation.info = info;

    globalThis.Animation = Animation;

    Animation.info();

})();
