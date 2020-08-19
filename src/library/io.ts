import * as fs from 'fs'
import es from 'event-stream'
import { Breadcrumb, TuringEvent } from './models'

/**
 * Read from input file and handle breadcrumbs through a stream in a synchronous manner
 * @param file_path path to the data file
 * @param handleBreadcrumbs the breadcrumb handler
 */
export function inputPipe(file_path: string, handleBreadcrumbs: (b: Breadcrumb, s: es.MapStream) => void) {
    const s = fs.createReadStream(file_path)
        .pipe(es.split())
        .pipe(es.mapSync((line: string, cb: any) => {
            return line.split(',')
        }))
        .pipe(es.mapSync((line: string[], cb: any) => {
            if(line.length >= 12 && line[0] !== 'message_type'){  
                const breadcrumb: Breadcrumb = {
                    message_type: parseInt(line[0]),
                    device_total_payload: parseFloat(line[1]),
                    gross_total_payload: parseFloat(line[2]),
                    device_payload: parseFloat(line[3]),
                    gross_payload: parseFloat(line[4]),
                    device_serial: parseInt(line[5]),
                    channel_1: parseFloat(line[6]),
                    channel_2: parseFloat(line[7]),
                    channel_3: parseFloat(line[8]),
                    channel_4: parseFloat(line[9]),
                    imei: JSON.parse(line[10]),
                    time: new Date(JSON.parse(line[11])),
                    device: parseInt(line[12]),
                }
                return breadcrumb
            }
            return null
        })).pipe(es.mapSync(function (breadcrumb: Breadcrumb|null, cb: any){
            if(breadcrumb) {
                s.pause()
                handleBreadcrumbs(breadcrumb, s)
                s.resume()
            }
            return breadcrumb
        }))
    return s
}

/**
 * @param file_path path of the output file
 * @param events the list of turing events
 */
export function saveResult(file_path: string, events: TuringEvent[]) {
    const eventText = events.map(event => {
        return event.toString()
    }).join('\n')

    fs.writeFileSync(file_path, eventText)
}