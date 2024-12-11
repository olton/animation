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
    })
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
        let from = val[0], to = val[1], delta = val[2], unit = val[3];

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
    })
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

export const applyProps = function (el, map, p) {
    _applyStyles(el, map.props, p);
    _applyTransform(el, map.transform, p);
    _applyColors(el, map.color, p);
};

export const createAnimationMap = (el, draw, dir = "normal") => {
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

export const exec = (fn, args, context) => {
    let result, func;

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
}

export const undef = (val) => typeof val === "undefined" || val === undefined || val === null;

export const camelCase = (str) => str.replace(/-([a-z])/g, g => g[1].toUpperCase())

export const each = (ctx, cb) => {
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
}

export const isArrayLike = (obj) => {
    return (
        Array.isArray(obj) || (
            typeof obj === "object" &&
            "length" in obj &&
            typeof obj.length === "number"
        )
    );
}

export const getUnit = (val, und) => {
    const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
    return typeof split[1] !== "undefined" ? split[1] : und;
}

export const parseUnit = (str) => {
    const out = [ 0, '' ];
    str = ""+str;
    out[0] = parseFloat(str);
    out[1] = str.match(/[\d.\-+]*\s*(.*)/)[1] || '';
    return out;
}

export const noop = () => {};