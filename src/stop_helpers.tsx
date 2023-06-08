import {stops} from './stops'

export type StopValue = {
    x: string,
    y: string,
    id: string
  }
  
export function findStopId(stopLines: Array<string>, stopId: string): StopValue { 
    return stopLines.map(x => parseRawStopValue(x)).find(
    x => x.id === stopId
    ) ?? parseRawStopValue(stopLines[0])
}
  
// stops are stored as y, x, then id
export function parseRawStopValue(rawValue: string): StopValue{
    const arr = rawValue.split(',')
    return {
        y: arr[0],
        x: arr[1],
        id: arr[2],
    }
}
  
export function randElement(arr: Array<string>) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

export function randElementData(arr: Array<StopValue>) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}


export function getStops() {
    return stops.split('\n').filter(x => x.length >= 1);
}
  