import {applyProps, createAnimationMap, exec, undef} from "./tools"
import Easing from "./easing"

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
    onFrame: () => {},
    onDone: () => {}
}

const animate = function(args){
    return new Promise(function(resolve){
        let start
        let {id, el, draw, dur, ease, loop, onFrame, onDone, pause, dir, defer} = Object.assign({}, defaultProps, args)
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
            loop: 0
        }

        const play = () => {
            if (typeof draw === "object") {
                map = createAnimationMap(el, draw, direction)
            }
            start = performance.now()
            Animation.elements[animationID].loop += 1
            Animation.elements[animationID].id = requestAnimationFrame(animate)
        }

        const done = () => {
            cancelAnimationFrame(Animation.elements[animationID].id)
            delete Animation.elements[id]
            exec(onDone, null, el)
            exec(resolve, [this], el)
        }

        const animate = (time) => {
            let p, t
            const stop = Animation.elements[animationID].stop

            if ( stop > 0) {
                if (stop === 2) {
                    if (typeof draw === "function") {
                        draw.bind(el)(1, 1)
                    } else {
                        applyProps(el, map, 1)
                    }
                }
                done()
                return
            }

            t = (time - start) / dur

            if (t > 1) t = 1
            if (t < 0) t = 0

            p = easeFn.apply(null, easeArgs)(t)

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

const stop = function(id, done = true){
    Animation.elements[id].stop = done === true ? 2 : 1
}

async function chain(arr, loop) {
    for(let i = 0; i < arr.length; i ++) {
        const a = arr[i]
        a.loop = false
        await animate(a)
    }
    if (typeof loop === "boolean" && loop) {
        await chain(arr, loop)
    } else if (typeof loop === "number") {
        loop--
        if (loop > 0) {
            await chain(arr, loop)
        }
    }
}

Animation.animate = animate
Animation.stop = stop
Animation.chain = chain
Animation.easing = Easing

const easing = Easing

export {
    animate,
    stop,
    chain,
    easing
}

export default Animation