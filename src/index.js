import {applyProps, createAnimationMap, exec, undef, noop} from "./tools"
import Easing from "./easing"
import {Effects, EffectOptions} from "./effects.js";

const Animation = {
    fx: true,
    elements: {}
}

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
}

const animate = function(args){
    return new Promise(function(resolve){
        let start
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
        } = Object.assign({}, defaultProps, args)
        let map = {}
        let easeName = "linear", easeArgs = [], easeFn = Easing.linear, matchArgs
        let direction = dir === "alternate" ? "normal" : dir
        let replay = false
        let animationID = id ? id : +(performance.now() * Math.pow(10, 14))

        if (undef(el)) {
            throw new Error("Unknown element!")
        }

        if (typeof el === "string") {
            el = document.querySelector(el)
        }

        if (typeof draw !== "function" && typeof draw !== "object") {
            throw new Error("Unknown draw object. Must be a function or object!")
        }

        if (dur === 0 || !Animation.fx) {
            dur = 1
        }

        if (dir === "alternate" && typeof loop === "number") {
            loop *= 2
        }

        if (typeof ease === "string") {
            matchArgs = /\(([^)]+)\)/.exec(ease)
            easeName = ease.split("(")[0]
            easeArgs = matchArgs ? matchArgs[1].split(',').map(p => parseFloat(p)) : []
            easeFn = Easing[easeName]
        } else if (typeof ease === "function") {
            easeFn = ease
        } else {
            easeFn = Easing.linear
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
        }

        const play = () => {
            if (typeof draw === "object") {
                map = createAnimationMap(el, draw, direction)
            }
            Animation.elements[animationID].loop += 1;
            Animation.elements[animationID].started = performance.now();
            Animation.elements[animationID].duration = dur;
            Animation.elements[animationID].paused = false;
            Animation.elements[animationID].id = requestAnimationFrame(animate);
        }

        const done = () => {
            const el = Animation.elements[animationID].element
            cancelAnimationFrame(Animation.elements[animationID].id)
            exec(onDone, null, el)
            exec(resolve, [this], el)
            delete Animation.elements[animationID]
        }

        const animate = (time) => {
            let p, t
            let _stop = Animation.elements[animationID].stop
            let _pause = Animation.elements[animationID].paused;
            let _start = Animation.elements[animationID].started;

            if (Animation.elements[animationID].paused) {
                Animation.elements[animationID].started = time - Animation.elements[animationID].t * dur;
            }
            
            if ( _stop > 0) {
                if (_stop === 2) {
                    if (typeof draw === "function") {
                        draw.bind(el)(1, 1)
                    } else {
                        applyProps(el, map, 1)
                    }
                }
                done()
                return
            }

            t = (time - _start) / dur

            if (t > 1) t = 1
            if (t < 0) t = 0

            p = easeFn.apply(null, easeArgs)(t)

            Animation.elements[animationID].t = t;
            Animation.elements[animationID].p = p;

            if (_pause) {
                Animation.elements[animationID].id = requestAnimationFrame(animate);
                return;
            }
            
            if (typeof draw === "function") {
                draw.bind(el)(t, p)
            } else {
                applyProps(el, map, p)
            }

            exec(onFrame, [t, p], el)

            if (t < 1) {
                Animation.elements[animationID].id = requestAnimationFrame(animate)
            }

            if (parseInt(t) === 1) {
                if (loop) {
                    if (dir === "alternate") {
                        direction = direction === "normal" ? "reverse" : "normal"
                    }

                    if (typeof loop === "boolean") {
                        setTimeout(function () {
                            play()
                        }, pause)
                    } else {
                        if (loop > Animation.elements[animationID].loop) {
                            setTimeout(function () {
                                play()
                            }, pause)
                        } else {
                            done()
                        }
                    }
                } else {
                    if (dir === "alternate" && !replay) {
                        direction = direction === "normal" ? "reverse" : "normal"
                        replay = true
                        play()
                    } else {
                        done()
                    }
                }
            }
        }
        if (defer > 0) {
            setTimeout(()=>{
                play()
            }, defer)
        } else {
            play()
        }
    })
}

const pause = function(id){
    Animation.elements[id].paused = true
}

const resume = function(id){
    Animation.elements[id].paused = false
}

const toggle = function(id){
    Animation.elements[id].paused = !Animation.elements[id].paused
}

const pauseAll = function(){
    Object.keys(Animation.elements).forEach(id => {
        pause(id)
    })
}

const resumeAll = function(){
    Object.keys(Animation.elements).forEach(id => {
        resume(id)
    })
}

const toggleAll = function(){
    Object.keys(Animation.elements).forEach(id => {
        toggle(id)
    })
}

const stop = function(id, done = true){
    Animation.elements[id].stop = done === true ? 2 : 1
}

const stopAll = function(done = true){
    Object.keys(Animation.elements).forEach(id => {
        stop(id, done)
    })    
}

const defaultChainOptions = {
    loop: false,
    onChainItem: noop,
    onChainItemComplete: noop,
    onChainComplete: noop,
}

async function chain(arr = [], options = {}) {
    const o = Object.assign({}, defaultChainOptions, options)
    
    for(let i = 0; i < arr.length; i ++) {
        const a = arr[i]
        a.loop = false
        
        o.onChainItem.apply(a,  [a, arr])
        
        await animate(a)
        
        o.onChainItemComplete.apply(a, [a, arr])
    }
    
    o.onChainComplete.apply(arr, [arr])
    
    if (typeof o.loop === "boolean" && o.loop) {
        await chain(arr, o.loop)
    } else if (typeof o.loop === "number") {
        o.loop--
        if (o.loop > 0) {
            await chain(arr, o.loop)
        }
    }
}

const version = "0.4.0"
const build_time = "09.12.2024, 19:54:06"

const info = () => {
    console.info(`%c Animation %c v${version} %c ${build_time} `, "color: #ffffff; font-weight: bold; background: #468284", "color: white; background: darkgreen", "color: white; background: #0080fe;")
}

Animation.animate = animate
Animation.stop = stop
Animation.stopAll = stopAll
Animation.chain = chain
Animation.pause = pause
Animation.resume = resume
Animation.toggle = toggle
Animation.pauseAll = pauseAll
Animation.resumeAll = resumeAll
Animation.toggleAll = toggleAll
Animation.easing = Easing
Animation.effects = Effects
Animation.effectOptions = EffectOptions
Animation.info = info

export {
    Animation,
    animate,
    stop,
    stopAll,
    chain,
    pause,
    resume,
    toggle,
    pauseAll,
    resumeAll,
    toggleAll,
    Easing,
    Effects,
    EffectOptions,
    info,
}
