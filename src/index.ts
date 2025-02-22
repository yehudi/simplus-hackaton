const INPUT_FILE = './354017110097371-1'
const OUTPUT_FILE = 'output.csv'

import {
    inputPipe,
    saveResult
} from './library/io'

import { Breadcrumb, OverweightEvent } from './library/models'
import * as memory from './library/memory'
import * as globals from './library/globals'

console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)

function handleBreadcrumbsSync(b: Breadcrumb) {
    // ###############################
    // Put your code here
    // ###############################
    console.log(b)

    // Example on how to create an event and save it to db
    const event = new OverweightEvent({
        start : b.time,
        end : b.time,
        imei : b.imei,
        max_weight : b.gross_payload
    })
    memory.saveEvent(event)

    //Example on how to edit an event and update db
    const eventUpdate = new OverweightEvent({
        start : b.time,
        end : b.time,
        imei : b.imei,
        max_weight : b.gross_payload + 5
    })

    memory.saveEvent(eventUpdate)

    // example on how to delete an event from db

    if(eventUpdate.max_weight < 50) memory.removeEvent(eventUpdate) 

    // example on how to attach a value to the vehicle in memory
    memory.setValue(b.imei, 'last_breadcrumb', b)

    // example on how to get a value attached to a vehicle
    memory.getValue(b.imei, 'last_breadcrumb')

    // example of saving value in a buffer in memory
    memory.pushToBuffer(b.imei, 'last_weights', b.gross_payload)

    // example on fetching a buffer from memory
    const prev_weights = memory.getBuffer(b.imei, 'last_weights')

    console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)
}



/**
 * Program execution
 */
inputPipe(INPUT_FILE, handleBreadcrumbsSync)
    .on('end',() => {
        console.log('Memory used', (process.memoryUsage().heapUsed) / 1024 / 1024)
        saveResult(OUTPUT_FILE, memory.getEvents())
    })