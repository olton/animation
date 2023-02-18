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
        if (!el instanceof HTMLElement) return;
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
        onFrame: () => {},
        onDone: () => {}
    };

    const animate = function(args){
        return new Promise(function(resolve){
            let start;
            let {id, el, draw, dur, ease, loop, onFrame, onDone, pause, dir, defer} = Object.assign({}, defaultProps, args);
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
                loop: 0
            };

            const play = () => {
                if (typeof draw === "object") {
                    map = createAnimationMap(el, draw, direction);
                }
                start = performance.now();
                Animation.elements[animationID].loop += 1;
                Animation.elements[animationID].id = requestAnimationFrame(animate);
            };

            const done = () => {
                cancelAnimationFrame(Animation.elements[animationID].id);
                delete Animation.elements[id];
                exec(onDone, null, el);
                exec(resolve, [this], el);
            };

            const animate = (time) => {
                let p, t;
                const stop = Animation.elements[animationID].stop;

                if ( stop > 0) {
                    if (stop === 2) {
                        if (typeof draw === "function") {
                            draw.bind(el)(1, 1);
                        } else {
                            applyProps(el, map, 1);
                        }
                    }
                    done();
                    return
                }

                t = (time - start) / dur;

                if (t > 1) t = 1;
                if (t < 0) t = 0;

                p = easeFn.apply(null, easeArgs)(t);

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

    const stop = function(id, done = true){
        Animation.elements[id].stop = done === true ? 2 : 1;
    };

    async function chain(arr, loop) {
        for(let i = 0; i < arr.length; i ++) {
            const a = arr[i];
            a.loop = false;
            await animate(a);
        }
        if (typeof loop === "boolean" && loop) {
            await chain(arr, loop);
        } else if (typeof loop === "number") {
            loop--;
            if (loop > 0) {
                await chain(arr, loop);
            }
        }
    }

    Animation.animate = animate;
    Animation.stop = stop;
    Animation.chain = chain;
    Animation.easing = Easing;

    globalThis.Animation = Animation;

})();
