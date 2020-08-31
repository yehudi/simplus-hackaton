const INPUT_FILE = './359632105185844-1'
const OUTPUT_FILE = 'output.csv'

import {
    inputPipe,
    saveResult
} from './library/io'

import { Breadcrumb, OverweightEvent, LoadingEvent } from './library/models'
import * as memory from './library/memory'
import * as helpers from './library/helpers'
import * as globals from './library/globals'
import brain from 'brain.js'

// feed forward
const net = new brain.NeuralNetwork();
net.fromJSON(require('../brain.json')[0]);


function handleBreadcrumbsSync(b: Breadcrumb) {
    helpers.deadreckoning(b)
    const p = memory.getBuffer(b.imei, 'pid')
    const m = memory.getValue(b.imei, 'modified')

    if( m && p.length === memory.MAX_BUFFER_SIZE) {
        const input = p
        /**
         * MAP input
         * Object {
         *  [v + k]: number,
         *  [e + k]: number,
         *  [t + k]: number,
         * }[]
         */
        .map((_ , i) => ({
            [`v${i}`]:Number((_.currentValue / helpers.gvm({
                max_weight: globals.VEHICLE_WEIGHT_LIMIT,
                length: globals.VEHICLE_LENGTH
            })).toFixed(2)),
            [`e${i}`]:Number((_.sumError / globals.CONTROLLER_MAX_ERROR).toFixed(2)),
            [`t${i}`]:Number((_.tick / globals.RECKON_STEP).toFixed(2))
        }))
        /**
         * Reduce into single object
         * {
         *  ... Object
         * }
         */
        .reduce((curr, _) => {
            return Object.assign(curr, _)
        }, {});

        const guess: any = net.run(input)
        if( guess.loading > 0.94) {
            const l = {
                imei: b.imei,
                end_weight: p[0].currentValue,
                start_weight: p[memory.MAX_BUFFER_SIZE - 1].currentValue,
                start: p[0].time,
                end: p[memory.MAX_BUFFER_SIZE - 1].time,
            }
            console.log(`loading => ${JSON.stringify(l)}\n`)
            console.log(`guess => ${JSON.stringify(guess)}\n\n`)

            memory.saveEvent(new LoadingEvent(l))
        }
        if(guess.tipping > 0.94) {
            console.log(`tipping => ${JSON.stringify(input)}\n`)
            console.log(`guess => ${JSON.stringify(guess)}\n\n`)
        }
        if(guess.unexpected > 0.95) {
            console.log(`unexpected => ${JSON.stringify(input)}\n`)
            console.log(`guess => ${JSON.stringify(guess)}\n\n`)
        }
    }

}


/**
 * Program execution
 */
inputPipe(INPUT_FILE, handleBreadcrumbsSync)
    .on('end',() => {
        console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)
        saveResult(OUTPUT_FILE, memory.getEvents())
    })