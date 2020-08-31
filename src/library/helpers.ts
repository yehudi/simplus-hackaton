import { Breadcrumb } from "./models";
import * as memory from './memory'

export const testOverload = (config: any, data: Breadcrumb) => {
    const limit = gvm(config)
    return data.gross_payload > limit
}

export const gvm = (config: {
    length: number
    max_weight: number
}): number => {
    const bridge = (config.length * 2.1) + 18
    return Math.min(config.max_weight, bridge)
}

// FROM HERE!
import * as globals from './globals'
import controller from 'node-pid-controller'
export const pid =  new controller({
    k_p: globals.CONTROLLER_PROPORTINAL_GAIN,
    k_i: globals.CONTROLLER_INTEGRAL_GAIN,
    i_max: globals.CONTROLLER_MAX_ERROR,
    dt: globals.MEASUREMENT_DT_INTERVAL
})

export const deadreckoning = (b: Breadcrumb) => {

    const tick = memory.getValue(b.imei, 'tick')
    memory.setValue(b.imei, 'modified', false)

    // Check if we know anything about the system.
    // If this is true, do the following:
    // * save this breadcrumb.
    // * assume the vehicle is empty.
    // * save assumptions to a controller.
    if (! tick ) {
        memory.setValue(b.imei, 'breadcrumb', b)
        memory.setValue(b.imei, 'tick', 1)
        
        pid.setTarget(globals.VEHICLE_WEIGHT)
        pid.update(b.gross_total_payload)
        
        memory.pushToBuffer(b.imei, 'pid', Object.assign({
            tick: 1,
            type: 0, // 'bootstrap',
            time: b.time,
            _timestamp: Date.now(),
            _tag: (b as any).tag
        }, pid))
        memory.setValue(b.imei, 'modified', true)
    }

    // This assumes we already know something about the system.
    // Do the following:
    // * update the system with a new measurement.
    // * get what we know from memory.
    // * make an assumption about what will happen.
    // * Validate the assumption by check the max error is not reached
    else {
        pid.update(b.gross_total_payload)
        const _b: any = memory.getValue(b.imei, 'breadcrumb')

        // model the next step
        const slope = (_b.gross_total_payload - b.gross_total_payload) / tick
        const model = slope * tick + b.gross_total_payload

        memory.setValue(b.imei, 'breadcrumb', b)
        // console.log(` tick @${tick} | Error ${pid.sumError} | prediction ${model}  | target ${pid.target} | weight ${b.gross_total_payload} \n`)
        
        if (tick === globals.RECKON_STEP) {
            memory.pushToBuffer(b.imei, 'pid', Object.assign({
                tick,
                type: 1 , // 'reckon',
                time: b.time,
                _timestamp: Date.now(),
                _tag: (b as any).tag
            }, pid))
            pid.reset()
            memory.setValue(b.imei, 'tick', 1)
            memory.setValue(b.imei, 'modified', true)
        }
        else {
            const tick = memory.getValue(b.imei, 'tick')
            memory.setValue(b.imei, 'tick', tick + 1)
            pid.update(b.gross_total_payload)
            if ( Math.abs(pid.sumError) >= globals.CONTROLLER_MAX_ERROR ) {
                // console.log(`Change detected @${tick}`)
                memory.pushToBuffer(b.imei, 'pid', Object.assign({
                    tick,
                    type: 2, //'change',
                    time: b.time,
                    _timestamp: Date.now(),
                    _tag: (b as any).tag
                }, pid))

                const absoluteerror = Math.abs(model - pid.target) 
                const target = absoluteerror > globals.PREDICTION_NOISE_THRESHOLD ? b.gross_total_payload : model
                pid.setTarget(target)
                pid.reset()
                memory.setValue(b.imei, 'tick', 1)
                memory.setValue(b.imei, 'modified', true)
            }
        }
    }
}

interface Events {
    start_weight: number
    end_weight: number
    start_time: string
    end_time: string
    type: 'loading' | 'tipping' | 'unexpected-weight-change'
}

export const tag = (b: Breadcrumb, events: Events[]) : {
    tipping: number
    loading: number
    unexpected: number
} => {
    const res = {
        tipping: 0,
        loading: 0,
        unexpected: 0
    }
    const  tip = events.filter(e => b.time >= new Date(e.start_time) && b.time <= new Date(e.end_time) && e.type === 'tipping')[0]
    if (tip) {
        res.tipping = 1
    }
    const  load = events.filter(e => b.time >= new Date(e.start_time) && b.time <= new Date(e.end_time) && e.type === 'loading')[0]
    if (load) {
        res.loading = 1
    }
    const  unexpected = events.filter(e => b.time >= new Date(e.start_time) && b.time <= new Date(e.end_time) && e.type === 'unexpected-weight-change')[0]
    if (unexpected) {
        res.unexpected = 1
    }
    return res

}

export const fill = (input: number[]) => {
    if (input.length < memory.MAX_BUFFER_SIZE) {
        const fill = memory.MAX_BUFFER_SIZE - input.length - 1
        const d = new Array(fill)
        for (let i = 0; i < fill; i++) {
            d.push(-1)
        }

        input.concat(d)
    }
    return input
}

