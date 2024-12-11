
/*!
 * Animation - Animate HTML elements with this simple, light-weight library.
 * Copyright 2024 by Serhii Pimenov
 * Licensed under MIT
 !*/

var Animation = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var src_exports = {};
  __export(src_exports, {
    Animation: () => Animation,
    Easing: () => easing_default,
    EffectOptions: () => EffectOptions,
    Effects: () => Effects,
    animate: () => animate,
    chain: () => chain,
    info: () => info,
    pause: () => pause,
    pauseAll: () => pauseAll,
    resume: () => resume,
    resumeAll: () => resumeAll,
    stop: () => stop,
    stopAll: () => stopAll,
    toggle: () => toggle,
    toggleAll: () => toggleAll
  });

  // src/tools.js
  var transformProps = ["translateX", "translateY", "translateZ", "rotate", "rotateX", "rotateY", "rotateZ", "scale", "scaleX", "scaleY", "scaleZ", "skew", "skewX", "skewY"];
  var numberProps = ["opacity", "zIndex"];
  var floatProps = ["opacity", "volume"];
  var scrollProps = ["scrollLeft", "scrollTop"];
  var colorProps = ["backgroundColor", "color"];
  var reverseProps = ["opacity"];
  var _getRelativeValue = (to, from) => {
    const operator = /^(\*=|\+=|-=)/.exec(to);
    if (!operator) return to;
    const u = getUnit(to) || 0;
    const x = parseFloat(from);
    const y = parseFloat(to.replace(operator[0], ""));
    switch (operator[0][0]) {
      case "+":
        return x + y + u;
      case "-":
        return x - y + u;
      case "*":
        return x * y + u;
    }
  };
  var _getStyle = (el, prop, pseudo) => {
    if (typeof el[prop] !== "undefined") {
      if (scrollProps.includes(prop)) {
        return prop === "scrollLeft" ? el === window ? pageXOffset : el.scrollLeft : el === window ? pageYOffset : el.scrollTop;
      } else {
        return el[prop] || 0;
      }
    }
    return el.style[prop] || getComputedStyle(el, pseudo)[prop];
  };
  var _setStyle = (el, key, val, unit, toInt = false) => {
    key = camelCase(key);
    if (toInt) {
      val = parseInt(val);
    }
    if (el instanceof HTMLElement) {
      if (typeof el[key] !== "undefined") {
        el[key] = val;
      } else {
        el.style[key] = key === "transform" || key.toLowerCase().includes("color") ? val : val + unit;
      }
    } else {
      el[key] = val;
    }
  };
  var _applyStyles = (el, mapProps, p) => {
    each(mapProps, (key, val) => {
      _setStyle(el, key, val[0] + val[2] * p, val[3], val[4]);
    });
  };
  var _getElementTransforms = (el) => {
    if (!(el instanceof HTMLElement)) return;
    const str = el.style.transform || "";
    const reg = /(\w+)\(([^)]*)\)/g;
    const transforms = /* @__PURE__ */ new Map();
    let m;
    while (m = reg.exec(str))
      transforms.set(m[1], m[2]);
    return transforms;
  };
  var _getColorArrayFromHex = (val) => Array.from(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(val ? val : "#000000")).slice(1).map((v) => parseInt(v, 16));
  var _getColorArrayFromElement = (el, key) => getComputedStyle(el)[key].replace(/[^\d.,]/g, "").split(",").map((v) => parseInt(v));
  var _applyTransform = (el, mapProps, p) => {
    let t = [];
    let elTransforms = _getElementTransforms(el);
    each(mapProps, (key, val) => {
      let from = val[0], to = val[1], delta = val[2], unit = val[3];
      if (key.includes("rotate") || key.includes("skew")) {
        if (unit === "") unit = "deg";
      } else if (key.includes("scale")) {
        unit = "";
      } else {
        unit = "px";
      }
      if (unit === "turn") {
        t.push(`${key}(${val[1] * p + unit})`);
      } else {
        t.push(`${key}(${from + delta * p + unit})`);
      }
    });
    elTransforms.forEach((val, key) => {
      if (mapProps[key] === void 0) {
        t.push(`${key}(${val})`);
      }
    });
    _setStyle(el, "transform", t.join(" "));
  };
  var _applyColors = function(el, mapProps, p) {
    each(mapProps, function(key, val) {
      let result = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        result[i] = Math.floor(val[0][i] + val[2][i] * p);
      }
      _setStyle(el, key, `rgb(${result.join(",")})`);
    });
  };
  var _expandColorValue = (val) => {
    const regExp = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    if (val[0] === "#" && val.length === 4) {
      return "#" + val.replace(regExp, (m, r, g, b) => {
        return r + r + g + g + b + b;
      });
    }
    return val[0] === "#" ? val : "#" + val;
  };
  var applyProps = function(el, map, p) {
    _applyStyles(el, map.props, p);
    _applyTransform(el, map.transform, p);
    _applyColors(el, map.color, p);
  };
  var createAnimationMap = (el, draw, dir = "normal") => {
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
      unit = el instanceof HTMLElement && to[1] === "" && !isNumProp && !isTransformProp ? "px" : to[1];
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
  var exec = (fn, args, context) => {
    let result, func;
    if (typeof fn === "function") {
      func = fn;
    } else if (/^[a-z]+[\w.]*[\w]$/i.test(fn)) {
      const ns = fn.split(".");
      func = global;
      for (let i = 0; i < ns.length; i++) {
        func = func[ns[i]];
      }
    } else {
      func = new Function("a", fn);
    }
    return func.apply(context, args);
  };
  var undef = (val) => typeof val === "undefined" || val === void 0 || val === null;
  var camelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  var each = (ctx, cb) => {
    let index = 0;
    if (isArrayLike(ctx)) {
      [].forEach.call(ctx, function(val, key) {
        cb.apply(val, [key, val]);
      });
    } else {
      for (let key in ctx) {
        if (ctx.hasOwnProperty(key))
          cb.apply(ctx[key], [key, ctx[key], index++]);
      }
    }
    return ctx;
  };
  var isArrayLike = (obj) => {
    return Array.isArray(obj) || typeof obj === "object" && "length" in obj && typeof obj.length === "number";
  };
  var getUnit = (val, und) => {
    const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
    return typeof split[1] !== "undefined" ? split[1] : und;
  };
  var parseUnit = (str) => {
    const out = [0, ""];
    str = "" + str;
    out[0] = parseFloat(str);
    out[1] = str.match(/[\d.\-+]*\s*(.*)/)[1] || "";
    return out;
  };
  var noop = () => {
  };

  // src/easing.js
  function minMax(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
  var Easing = {
    linear: () => (t) => t
  };
  Easing.default = Easing.linear;
  var eases = {
    Sine: () => (t) => 1 - Math.cos(t * Math.PI / 2),
    Circ: () => (t) => 1 - Math.sqrt(1 - t * t),
    Back: () => (t) => t * t * (3 * t - 2),
    Bounce: () => (t) => {
      let pow2, b = 4;
      while (t < ((pow2 = Math.pow(2, --b)) - 1) / 11) {
      }
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2);
    },
    Elastic: (amplitude = 1, period = 0.5) => {
      const a = minMax(amplitude, 1, 10);
      const p = minMax(period, 0.1, 2);
      return (t) => {
        return t === 0 || t === 1 ? t : -a * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - p / (Math.PI * 2) * Math.asin(1 / a)) * (Math.PI * 2) / p);
      };
    }
  };
  ["Quad", "Cubic", "Quart", "Quint", "Expo"].forEach((name, i) => {
    eases[name] = () => (t) => Math.pow(t, i + 2);
  });
  Object.keys(eases).forEach((name) => {
    const easeIn = eases[name];
    Easing["easeIn" + name] = easeIn;
    Easing["easeOut" + name] = (a, b) => (t) => 1 - easeIn(a, b)(1 - t);
    Easing["easeInOut" + name] = (a, b) => (t) => t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 1 - easeIn(a, b)(t * -2 + 2) / 2;
  });
  var easing_default = Easing;

  // src/effects.js
  var EffectOptions = {
    duration: 300,
    ease: "linear",
    onStart: () => {
    },
    onDone: () => {
    }
  };
  var Effects = {
    switchIn: function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
      op.onStart(el);
      el.setAttribute("hidden", true);
      el.style.display = "none";
      el.style.left = "0";
      el.style.top = "0";
      el.setAttribute("hidden", false);
      op.onDone(el);
    },
    switchOut: function(el) {
      const op = Object.assign({}, EffectOptions, o);
      op.onStart(el);
      el.setAttribute("hidden", true);
      op.onDone(el);
    },
    switch: function(current, next, o2) {
      this.switchOut(current, o2);
      this.switchIn(next, o2);
    },
    slideUpIn: async function(el, o2) {
      const parent = el.parentElement;
      const parentHeight = parent.offsetHeight;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideUpOut: async function(el, o2) {
      const parent = el.parentElement;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideUp: function(current, next, o2) {
      this.slideUpOut(current, o2).then(() => {
      });
      this.slideUpIn(next, o2).then(() => {
      });
    },
    slideDownIn: async function(el, o2) {
      const parent = el.parentElement;
      const parentHeight = parent.offsetHeight;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideDownOut: async function(el, o2) {
      const parent = el.parentElement;
      const parentHeight = parent.offsetHeight;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideDown: function(current, next, o2) {
      this.slideDownOut(current, o2).then(() => {
      });
      this.slideDownIn(next, o2).then(() => {
      });
    },
    slideLeftIn: async function(el, o2) {
      const parent = el.parentElement;
      const parentWidth = parent.offsetWidth;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideLeftOut: async function(el, o2) {
      const parent = el.parentElement;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideLeft: function(current, next, o2) {
      this.slideLeftOut(current, o2).then(() => {
      });
      this.slideLeftIn(next, o2).then(() => {
      });
    },
    slideRightIn: async function(el, o2) {
      const parent = el.parentElement;
      const parentWidth = parent.offsetWidth;
      const op = Object.assign({}, EffectOptions, o2);
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
    slideRightOut: async function(el, o2) {
      const parent = el.parentElement;
      const parentWidth = parent.offsetWidth;
      const op = Object.assign({}, EffectOptions, o2);
      op.onStart(el);
      el.style.zIndex = op.zIndex || "1";
      await animate({
        el,
        draw: {
          left: parentWidth,
          opacity: 0
        },
        dur: op.duration,
        ease: op.ease
      });
      op.onDone(el);
    },
    slideRight: function(current, next, o2) {
      this.slideRightOut(current, o2).then(() => {
      });
      this.slideRightIn(next, o2).then(() => {
      });
    },
    fadeIn: async function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
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
    fadeOut: async function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
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
    fade: function(current, next, o2) {
      this.fadeOut(current, o2).then(() => {
      });
      this.fadeIn(next, o2).then(() => {
      });
    },
    zoomIn: async function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
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
    zoomOut: async function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
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
    zoom: function(current, next, o2) {
      this.zoomOut(current, o2).then(() => {
      });
      this.zoomIn(next, o2).then(() => {
      });
    },
    swirlIn: async function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
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
    swirlOut: async function(el, o2) {
      const op = Object.assign({}, EffectOptions, o2);
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
    swirl: function(current, next, o2) {
      this.swirlOut(current, o2).then(() => {
      });
      this.swirlIn(next, o2).then(() => {
      });
    }
  };

  // src/index.js
  var Animation = {
    fx: true,
    elements: {}
  };
  var defaultProps = {
    id: null,
    el: null,
    draw: {},
    dur: 1e3,
    ease: "linear",
    loop: 0,
    pause: 0,
    dir: "normal",
    defer: 0,
    onFrame: noop,
    onDone: noop
  };
  var animate = function(args) {
    return new Promise(function(resolve) {
      let start;
      let {
        id,
        el,
        draw,
        dur,
        ease,
        loop,
        onFrame,
        onDone,
        pause: pause2,
        dir,
        defer
      } = Object.assign({}, defaultProps, args);
      let map = {};
      let easeName = "linear", easeArgs = [], easeFn = easing_default.linear, matchArgs;
      let direction = dir === "alternate" ? "normal" : dir;
      let replay = false;
      let animationID = id ? id : +(performance.now() * Math.pow(10, 14));
      if (undef(el)) {
        throw new Error("Unknown element!");
      }
      if (typeof el === "string") {
        el = document.querySelector(el);
      }
      if (typeof draw !== "function" && typeof draw !== "object") {
        throw new Error("Unknown draw object. Must be a function or object!");
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
        easeArgs = matchArgs ? matchArgs[1].split(",").map((p) => parseFloat(p)) : [];
        easeFn = easing_default[easeName];
      } else if (typeof ease === "function") {
        easeFn = ease;
      } else {
        easeFn = easing_default.linear;
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
        Animation.elements[animationID].id = requestAnimationFrame(animate2);
      };
      const done = () => {
        const el2 = Animation.elements[animationID].element;
        cancelAnimationFrame(Animation.elements[animationID].id);
        exec(onDone, null, el2);
        exec(resolve, [this], el2);
        delete Animation.elements[animationID];
      };
      const animate2 = (time) => {
        let p, t;
        let _stop = Animation.elements[animationID].stop;
        let _pause = Animation.elements[animationID].paused;
        let _start = Animation.elements[animationID].started;
        if (Animation.elements[animationID].paused) {
          Animation.elements[animationID].started = time - Animation.elements[animationID].t * dur;
        }
        if (_stop > 0) {
          if (_stop === 2) {
            if (typeof draw === "function") {
              draw.bind(el)(1, 1);
            } else {
              applyProps(el, map, 1);
            }
          }
          done();
          return;
        }
        t = (time - _start) / dur;
        if (t > 1) t = 1;
        if (t < 0) t = 0;
        p = easeFn.apply(null, easeArgs)(t);
        Animation.elements[animationID].t = t;
        Animation.elements[animationID].p = p;
        if (_pause) {
          Animation.elements[animationID].id = requestAnimationFrame(animate2);
          return;
        }
        if (typeof draw === "function") {
          draw.bind(el)(t, p);
        } else {
          applyProps(el, map, p);
        }
        exec(onFrame, [t, p], el);
        if (t < 1) {
          Animation.elements[animationID].id = requestAnimationFrame(animate2);
        }
        if (parseInt(t) === 1) {
          if (loop) {
            if (dir === "alternate") {
              direction = direction === "normal" ? "reverse" : "normal";
            }
            if (typeof loop === "boolean") {
              setTimeout(function() {
                play();
              }, pause2);
            } else {
              if (loop > Animation.elements[animationID].loop) {
                setTimeout(function() {
                  play();
                }, pause2);
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
        setTimeout(() => {
          play();
        }, defer);
      } else {
        play();
      }
    });
  };
  var pause = function(id) {
    Animation.elements[id].paused = true;
  };
  var resume = function(id) {
    Animation.elements[id].paused = false;
  };
  var toggle = function(id) {
    Animation.elements[id].paused = !Animation.elements[id].paused;
  };
  var pauseAll = function() {
    Object.keys(Animation.elements).forEach((id) => {
      pause(id);
    });
  };
  var resumeAll = function() {
    Object.keys(Animation.elements).forEach((id) => {
      resume(id);
    });
  };
  var toggleAll = function() {
    Object.keys(Animation.elements).forEach((id) => {
      toggle(id);
    });
  };
  var stop = function(id, done = true) {
    Animation.elements[id].stop = done === true ? 2 : 1;
  };
  var stopAll = function(done = true) {
    Object.keys(Animation.elements).forEach((id) => {
      stop(id, done);
    });
  };
  var defaultChainOptions = {
    loop: false,
    onChainItem: noop,
    onChainItemComplete: noop,
    onChainComplete: noop
  };
  async function chain(arr = [], options = {}) {
    const o2 = Object.assign({}, defaultChainOptions, options);
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      a.loop = false;
      o2.onChainItem.apply(a, [a, arr]);
      await animate(a);
      o2.onChainItemComplete.apply(a, [a, arr]);
    }
    o2.onChainComplete.apply(arr, [arr]);
    if (typeof o2.loop === "boolean" && o2.loop) {
      await chain(arr, o2.loop);
    } else if (typeof o2.loop === "number") {
      o2.loop--;
      if (o2.loop > 0) {
        await chain(arr, o2.loop);
      }
    }
  }
  var version = "0.4.0";
  var build_time = "11.12.2024, 19:46:25";
  var register_global = "true";
  var info = () => {
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
  Animation.easing = easing_default;
  Animation.effects = Effects;
  Animation.effectOptions = EffectOptions;
  Animation.animationOptions = defaultProps;
  Animation.chainOptions = defaultChainOptions;
  Animation.info = info;
  if (register_global === "true") {
    globalThis.Animation = Animation;
  }
  return __toCommonJS(src_exports);
})();
