export interface Breadcrumb {

    imei: string

    message_type: number

    device_total_payload: number

    gross_total_payload: number
    
    device_payload: number
    
    gross_payload: number
    
    device_serial: number

    channel_1: number

    channel_2: number

    channel_3: number

    channel_4: number

    time: Date

    device: number

}
/**
 * Simplified vehicle confirguration.
 */
export interface vehicleConfig {
    /* length of vehicle in meters **/
    length: number
    /** legal max weight in tons */
    max_weight: number
}

type EventType = 'overweight' | 'underweight' | 'loading' | 'tipping' | 'unexpected_weight_change'

interface BaseEventParams {
    start : Date
    
    end: Date
    
    imei: string

    type: EventType
}

abstract class BaseEvent {

    start: Date

    end: Date

    imei: string

    type: EventType

    get id() {
        return `${this.imei}::${this.type}::${this.start}`
    }

    constructor({ start, end, imei, type} : BaseEventParams) {
        this.start = start
        this.end = end
        this.imei =  imei
        this.type = type
    }

    toString() {
        return `"${this.imei}",${this.start.getTime()},${this.end.getTime()},${this.type}`
    }

}

export class OverweightEvent extends BaseEvent {
    max_weight: number

    constructor(params : Omit<BaseEventParams, 'type'> & { max_weight: number}) {
        super({...params, type: 'overweight'})

        this.max_weight = params.max_weight
    }

    toString() {
        return super.toString() + `,${this.max_weight}`
    }

}

export class UnderweightEvent extends BaseEvent {

    min_weight: number
    
    constructor(params : Omit<BaseEventParams, 'type'> & { min_weight: number}) {
        super({...params, type: 'underweight'})

        this.min_weight = params.min_weight
    }

    toString() {
        return super.toString() + `,${this.min_weight}`
    }
}

export class UnexpectedWeightChangeEvent extends BaseEvent {

    start_weight: number

    end_weight: number

    constructor(params : Omit<BaseEventParams, 'type'> & { start_weight: number, end_weight: number}) {
        super({...params, type: 'unexpected_weight_change'})

        this.start_weight = params.start_weight
        this.end_weight = params.end_weight
    }

    toString() {
        return super.toString() + `,${this.start_weight},${this.end_weight}`
    }
}

export class LoadingEvent extends BaseEvent {

    start_weight: number

    end_weight: number

    constructor(params : Omit<BaseEventParams, 'type'> & { start_weight: number, end_weight: number}) {
        super({...params, type: 'loading'})

        this.start_weight = params.start_weight
        this.end_weight = params.end_weight
    }

    toString() {
        return super.toString() + `,${this.start_weight},${this.end_weight}`
    }
}

export class TippingEvent extends BaseEvent {

    start_weight: number

    end_weight: number

    constructor(params : Omit<BaseEventParams, 'type'> & { start_weight: number, end_weight: number}) {
        super({...params, type: 'tipping'})

        this.start_weight = params.start_weight
        this.end_weight = params.end_weight
    }

    toString() {
        return super.toString() + `,${this.start_weight},${this.end_weight}`
    }
}

export type TuringEvent = OverweightEvent | UnderweightEvent | LoadingEvent | TippingEvent | UnexpectedWeightChangeEvent