import * as fs from 'fs'
import es from 'event-stream'
import { Breadcrumb, TuringEvent } from './models'

/**
 * Read from input file and handle breadcrumbs through a stream in a synchronous manner
 * @param file_path path to the data file
 * @param handleBreadcrumbs the breadcrumb handler
 */
export function inputPipe(file_path: string, handleBreadcrumbs: (b: Breadcrumb, s: es.MapStream) => void) {
    const s = fs.createReadStream(file_path, {encoding : 'utf16le'})
        .pipe(es.split('\n'))
        .pipe(es.mapSync((line: string, cb: any) => {
            try {
                let breadcrumb = JSON.parse(line)
                return {...breadcrumb, time : new Date(breadcrumb.time)}
            } catch (err) {
                return null
            }
        }))
        .pipe(es.mapSync(function (breadcrumb: Breadcrumb|null, cb: any){
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
    fs.writeFileSync(`${file_path}.json`, JSON.stringify(events))
}
/**
 * @param file_path path of the output file
 * @param objects the list of objects for json export
 */
export function saveToFile(file_path: string, objects: any[]) {
    fs.writeFileSync(`${file_path}`, JSON.stringify(objects))
}