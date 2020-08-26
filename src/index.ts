const INPUT_FILE = './354017110097371-1'
const OUTPUT_FILE = 'output.csv'

import {
    inputPipe,
    saveResult
} from './library/io'

import { Breadcrumb, OverweightEvent } from './library/models'
import * as memory from './library/memory'
import * as helpers from './library/helpers'


function handleBreadcrumbsSync(b: Breadcrumb) {
    helpers.deadreckoning(b)

    // const params = neural.network(memory.getBuffer, max, min, reckon, events.target)
    // new Overload(params)
    // console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)
}


/**
 * Program execution
 */
inputPipe(INPUT_FILE, handleBreadcrumbsSync)
    .on('end',() => {
        console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)
        saveResult(OUTPUT_FILE, memory.getEvents())
    })