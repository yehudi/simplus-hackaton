const INPUT_FILE = './354017110097371-1'
const OUTPUT_FILE = 'brain.json'

import {
    inputPipe,
    // saveResult,
    saveToFile
} from './library/io'

import { Breadcrumb, MemoryBuffer } from './library/models'
import * as memory from './library/memory'
import * as helpers from './library/helpers'
import * as globals from './library/globals'

import brain from 'brain.js'
const events = require('../train.json')

// create a simple feed forward neural network with backpropagation
const net = new brain.NeuralNetwork({
    binaryThresh: 0.65,
    hiddenLayers: [ 3, memory.MAX_BUFFER_SIZE , 3 ]
});
const set: any[] = []


function train(b: Breadcrumb) {
    const _b = Object.assign(b , { tag : helpers.tag(b, events)})
    helpers.deadreckoning(_b)
    const p : MemoryBuffer [] = memory.getBuffer(b.imei, 'pid')
    const i = p
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
    
    const o = p
    /**
     * MAP input
     * Object {
     *  loading: number,
     *  tipping: number,
     *  unexpected: number,
     * }[]
     */
    .map(_ => ({..._._tag}))
    /**
     * Reduce to single input
     * {
     *  loading: number,
     *  tipping: number,
     *  unexpected: number,
     * }
     */
    .reduce((curr, t) => {
        curr.loading = t.loading
        curr.tipping = t.tipping
        curr.unexpected = t.unexpected
        return curr
    }, { loading: 0, tipping: 0, unexpected: 0 })


    const m = memory.getValue(b.imei, 'modified')
    if ( m && p.length === memory.MAX_BUFFER_SIZE) {
        // // set.push(i)
        // console.log(`input => ${JSON.stringify(i)}`)
        // console.log(`output => ${JSON.stringify(o)} \n\n`)
        set.push({input: i, output: o})
    }
}


/**
 * Program execution
 */
inputPipe(INPUT_FILE, train)
    .on('end',() => {
        net.train(set, {
            callback: (s) => {
                console.log(s)
                return
            },
            iterations: 2000,
            errorThresh: 0.005,
            learningRate: 0.3, // scales with delta to effect training rate --> number between 0 and 1
            momentum: 0.1, // scales with next layer's change value --> number between 0 and 1
            callbackPeriod: 100, // the number of iterations through the training data between callback calls --> number greater than 0
            // log: false, // true to use console.log, when a function is supplied it is used --> Either true or a function
            // logPeriod: 10, // iterations between logging out --> number greater than 0
            // callback: null, // a periodic call back that can be triggered while training --> null or function
            // timeout: Infinity, // the max number of milliseconds to train for --> number greater than 0
        })
        saveToFile(OUTPUT_FILE, [net.toJSON()])
        console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)
    })