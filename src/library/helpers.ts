import { Breadcrumb, vehicleConfig, OverweightEvent } from "./models";
import * as memory from './memory'

export const testOverload = (config: vehicleConfig, data: Breadcrumb) => {
    const bridge = (config.length * 2.1) + 18
    const limit = Math.min(config.max_weight, bridge)
    return data.gross_payload > limit
}

// FROM HERE!
import * as globals from './globals'
import controller from 'node-pid-controller'

export const pid =  new controller({
    k_p: globals.LOADING_WEIGHT_THRESHOLD,
    k_i: globals.NOISE_THRESHOLD,
    i_max: globals.MAX_ERROR,
    dt: globals.INTERVAL
})
let step = 1 
let mse = 0 

export const deadreckoning = (b: Breadcrumb) => {

    const m: any[] = memory.getBuffer(b.imei, 'pid')

    // Check if we know anything about the system.
    // If this is true, do the following:
    // * save this breadcrumb.
    // * save what we know to a controller.
    // * assume the vehicle is empty.
    if (m.length === 0 ) {
        memory.setValue(b.imei, 'breadcrumb', b)
        memory.pushToBuffer(b.imei, 'pid', pid)
        pid.setTarget(globals.VEHICLE_MIN_WEIGHT)

        mse = pid.update(b.gross_total_payload)
        step += 1
    }
    // This assumes we already know something about the system.
    // Do the following:
    // * update the system with a new measurement.
    // * get what we know from memory.
    // * make an assumption about what will happen.
    // * Validate the assumption by check the max error is not reached
    else {
        mse = pid.update(b.gross_total_payload)
        const _b: any = memory.getValue(b.imei, 'breadcrumb')

        const slope = (_b.gross_total_payload - b.gross_total_payload) / step
        const assumption = slope * step + b.gross_total_payload
        memory.setValue(b.imei, 'breadcrumb', b)
        console.log(` @${step} | slope ${slope} | prediction ${assumption} | MSE ${pid.sumError} | weight ${b.gross_total_payload} | target ${pid.target}`)
        
        if (step === globals.RECKONING_STEP) {
            memory.pushToBuffer(b.imei, 'pid', pid)
            const absoluteerror = Math.abs(assumption - b.gross_total_payload) 
            const target = absoluteerror > globals.NOISE_THRESHOLD ? b.gross_total_payload : assumption
            pid.reset()
            // pid.setTarget(target)

            step = 1
        }
        // If it is not, do the following:
        // * add to step ticker
        // * add to memory for analysis
        else {
            step += 1  
            mse = pid.update(b.gross_total_payload)
            if ( Math.abs(pid.sumError) >= globals.MAX_ERROR ) {
                const buffer: any[] = memory.getBuffer(b.imei, 'pid')
                const _m = buffer[m.length - 1]

                console.log(`Change detection @${step}`)
                pid.setTarget(b.gross_total_payload)
                pid.reset()
                step = 1
            }
        }
    }
}


// const detection = (buffer: any[], b: Breadcrumb) => {
//     let restart = false

//     if (overload(buffer)) {
//         // Example on how to create an event and save it to db
//         const event = new OverweightEvent({
//             start : b.time,
//             end : b.time,
//             imei : b.imei,
//             max_weight : b.gross_payload
//         })
//         memory.saveEvent(event)
//     }

//     //Example on how to edit an event and update db
//     const eventUpdate = new OverweightEvent({
//         start : b.time,
//         end : b.time,
//         imei : b.imei,
//         max_weight : b.gross_payload + 5
//     })

//     memory.saveEvent(eventUpdate)
//     return restart
// }