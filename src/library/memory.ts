import { TuringEvent } from './models'

const MEMORY = new Map<string, any>()
const BUFFER_MEMORY = new Map<string, any[]>()
const EVENT_DB = new Map<string, TuringEvent>()

export const MAX_BUFFER_SIZE = 5

/**
 * Push to a capped buffer
 * @param imei the imei of the vehicle
 * @param variable the name of the variable 
 * @param value the value to push inside the buffer
 */
export function pushToBuffer<T = any>(imei: string, variable: string, value: T) : void {
    const key = `${imei}::${variable}`

    if(!BUFFER_MEMORY.has(key)) BUFFER_MEMORY.set(key, [])

    if((BUFFER_MEMORY.get(key)?.length || 0) >= MAX_BUFFER_SIZE) BUFFER_MEMORY.set(key, BUFFER_MEMORY.get(key)?.slice(1) || [])

    BUFFER_MEMORY.get(key)?.push(value)
}

/**
 * get the buffer associated to the variable and imei
 * @param imei the imei of the vehicle
 * @param variable the name of the variable 
 */
export function getBuffer<T = any>(imei: string, variable: string): T[]{
    const key = `${imei}::${variable}`
    
    return BUFFER_MEMORY.get(key) || []
}

/**
 * get the value associated to an imei and a key
 * @param imei the imei of the vehicle
 * @param variable the name of the variable/key 
 */
export function getValue<T= any>(imei: string, variable :string): T|null{
    const key = `${imei}::${variable}`

    return MEMORY.get(key) || null
}

/**
 * get the value associated to an imei and a key
 * @param imei the imei of the vehicle
 * @param variable the name of the variable/key
 * @param value the value that needs to be associated 
 */
export function setValue<T= any>(imei: string, variable :string, value: T): void{
    const key = `${imei}::${variable}`

    MEMORY.set(key, value)
}

/**
 * saves a new event if not exist, otherwise just updates its values
 * @param event the event that needs to be saved
 * @returns true if created false if updated
 */
export function saveEvent(event: TuringEvent): boolean {
    const exists = !EVENT_DB.has(event.id)
    EVENT_DB.set(event.id, event)

    return exists
}

/**
 * Removes an event from memory
 * @param event the event that needs to be deleted
 * @return true if event existed false otherwise
 */
export function removeEvent(event: TuringEvent): boolean {
    const exists = EVENT_DB.has(event.id)
    EVENT_DB.delete(event.id)
    return exists
}

/**
 * Get all the events in db
 */
export function getEvents(): TuringEvent[] {
    const events = [...EVENT_DB.values()].sort((a, b) => {
        if(a.start < b.start)
            return -1
        else if(a.start > b.start)
            return 1
        else 
            return 0
    })

    return events
}
