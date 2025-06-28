/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { uuidv4 } from "@firebase/util";
import Cookies from 'js-cookie';
import { doc, getDoc, setDoc, GeoPoint, getDocs, collection } from "firebase/firestore"; 
import { ref, push, set, get } from "firebase/database";
import { db, realtimeDb } from "./firebase";
import { getStops, parseRawStopValue, randElementData } from "./stop_helpers";

const FIRESTORE_COLLECTION = 'laMetroStopIdsReviews'; 

let _uuid : string | undefined = undefined;
const COOKIE_KEY = 'bus-stops-uuid'

export function getUuid() : string {
    if (_uuid !== undefined) {
        return _uuid;
    }
    const cookie = Cookies.get(COOKIE_KEY);
    if (cookie !== undefined) {
        return cookie;
    }
    else {
        _uuid = uuidv4();
        Cookies.set(COOKIE_KEY, _uuid);
        return _uuid;
    }
}

let allReviewedIds : Set<unknown> | undefined = undefined;

async function getCachedAllReviewIds() : Promise<Set<unknown>> {
    if (!allReviewedIds) {
        const allReviewedIdsRaw = await get(ref(realtimeDb, 'reviewedStops'))
        allReviewedIds = new Set(Object.values(allReviewedIdsRaw.val()));
    }
    return allReviewedIds;
}

export async function getRandomStopForReview() {
    const allIds = getStops().map(x => parseRawStopValue(x));

    const _allReviewIds = await getCachedAllReviewIds();
    return randElementData(allIds.filter(x => !_allReviewIds.has(x.id)));
}

function getStopLocation(stopId: string) {
    const stopValue = getStops().map(x => parseRawStopValue(x)).find(x => x.id === stopId);
    if (!stopValue) {
        throw new Error('Stop value was not found! Throwing error');
    }
    else {
        return new GeoPoint(Number(stopValue.x), Number(stopValue.y));
    }
}

type AnswersInDb = [boolean, boolean, boolean, boolean, boolean, boolean];
type DBReviews = {[key: string] : {
    skipped: true
} | {
    skipped: false,
    answers: AnswersInDb
}};

function addArrays(arr1: Array<number>, arr2: Array<number>){
    const newArr = [];
    for (let i = 0; i < arr1.length && i < arr2.length; ++i) {
        newArr.push(arr1[i] + arr2[i]);
    }
    return newArr;
}

export async function getReviewFromDatabase(stopId: string) : Promise<{
    haveIReviewed: boolean,
    numPplSkipped: number,
    numPplReviewedAndNotSkipped: number,
    summedReviews: Array<number>,
}>{
    const docRef = doc(db, FIRESTORE_COLLECTION + '/' + stopId);
    const docData = (await getDoc(docRef)).data();
    const allReviews = docData?.reviews as DBReviews | undefined;

    const haveIReviewed = allReviews !== undefined && Object.keys(allReviews).includes(getUuid());
    const nonSkippedReviews = allReviews === undefined? [] : Object.values(allReviews).filter(x => x.skipped === false) as Array<{skipped: false, answers: AnswersInDb}>;
    const summedReviews = nonSkippedReviews.map(x => x.answers).map(answerArr => answerArr.map(a => Number(a))).reduce((prev, curr) => addArrays(prev, curr), [0, 0, 0, 0, 0, 0])
    const numPplReviewedAndNotSkipped = allReviews === undefined? 0 : Object.values(allReviews).filter(x => x.skipped === false).length;
    const numPplSkipped = allReviews === undefined? 0 : Object.values(allReviews).filter(x => x.skipped === true).length;


    return {
        haveIReviewed,
        numPplSkipped,
        numPplReviewedAndNotSkipped,
        summedReviews
    }

    
}

export async function getAllNonSkippedReviews() {
    const allDocs = await getDocs(collection(db, FIRESTORE_COLLECTION));
  
    const results: Array<{
      stop_id: string;
      review_id: string;
      hasSeating: boolean;
      hasShade: boolean;
      hasShelter: boolean;
      hasNoSign: boolean;
      hasMissingBlockedSidewalk: boolean;
      hasDirtyUnpleasantWaitingArea: boolean;
      rating: 'good' | 'meh' | 'bad' | null;
    }> = [];
  
    allDocs.forEach((docSnap) => {
      const stop_id = docSnap.id;
      const data = docSnap.data();
      const reviews = data.reviews ?? {};
  
      Object.entries(reviews).forEach(([review_id, review]: [string, any]) => {
        if (!review.skipped && Array.isArray(review.answers)) {
          console.log(review);
          results.push({
            stop_id,
            review_id,
            hasSeating: Boolean(review.answers[0]),
            hasShelter: Boolean(review.answers[1]),
            hasShade: Boolean(review.answers[2]),
            hasNoSign: Boolean(review.answers[3]),
            hasMissingBlockedSidewalk: Boolean(review.answers[4]),
            hasDirtyUnpleasantWaitingArea: Boolean(review.answers[5]),
            rating: review.rating ?? null,
          });
        }
      });
    });
  
    return results;
  }

export async function addReviewToDatabase(review: {
        isSkipped: true,
        stopId: string,
        stopComment: string | undefined,
    } | {
        isSkipped: false,
        stopId: string,
        answers: AnswersInDb,
        rating: 'good' | 'bad' | 'meh',
        stopComment: string | undefined,
    }) {

    const userId = getUuid();

    const docRef = doc(db, FIRESTORE_COLLECTION + '/' + review.stopId);
    
    // Check if doc exists
    let docData = (await getDoc(docRef)).data();
    if (!docData || !('loc' in docData) || !('reviews' in docData)) {
        docData = {
            loc: getStopLocation(review.stopId),
            reviews: {},
        }
    }
    let shouldAddToReviewed = false;
    if (docData && docData.reviews && Object.values(docData.reviews).filter(x => typeof x === 'object' && x !== null && 'skipped' in x && x.skipped === true).length > 1 && review.isSkipped) {
        // if we are currently skipped, we have enough skips to dq this record
        shouldAddToReviewed = true;
    }
    else if (!review.isSkipped) {
        shouldAddToReviewed = true;
    }
    else {
        shouldAddToReviewed = false;
    }

    // Update docData
    if (!review.isSkipped) {
        const answerArrayForDb = [...review.answers];
        const rating = review.rating;
        docData.reviews[userId] = {answers: answerArrayForDb, rating, skipped: false};
        if (review.stopComment) {
            docData.reviews[userId].stopComment = review.stopComment;
        }
    }
    else {
        docData.reviews[userId] = {skipped: true};
        if (review.stopComment) {
            docData.reviews[userId].stopComment = review.stopComment;
        }
    }

    // Update doc
    await setDoc(docRef, docData);

    // add it to reviewed if doc does exist
    if (shouldAddToReviewed) {
        const reviewedStops = ref(realtimeDb, 'reviewedStops')
        const newStopRef = push(reviewedStops);
        await set(newStopRef, review.stopId);
    }
}

// export async function allStops() : Promise<StopValue> {
//     const incompletes : Array<string> = (await getDoc(doc(db, 'laMetroStopIdsArrayOfIncompletes/incompletes'))).data()!.incompletes;
//     const stopId = randElement(incompletes);

// }


// export async function initializeReviewedStops() {
//     // const stops = getStops().map(x => parseRawStopValue(x)).map(y => y.id);
//     const postListRef = ref(realtimeDb, 'reviewedStops')
//     const newPostRef = push(postListRef);
//     set(newPostRef, 's-9q5cgbtrjr-wilshire~harvard');
// }

// NEED TO RERUN THIS TOMORROW
// export async function addAllStopIdsWithNoData() {
//     const stops = getStops().map(x => parseRawStopValue(x)).map(y => {
//         return {
//             id: y.id,
//             val: {
//                 loc: new GeoPoint(Number(y.x), Number(y.y)),
//                 reviews: {}
//             }
//         }
//     });

//     // const sortedStops = stops.sort((x, y) => x.id.localeCompare(y.id));
//     // alert(sortedStops[sortedStops.length - 1].id)

//     // alert(sortedStops.length);
//     // ^ 12k+

//     // alert((await getCountFromServer(collection(db, 'laMetroStopIds'))).data().count);
//     // 11577

//     // for (const stop of stops) {
//     //     await setDoc(doc(db, 'laMetroStopIds/' + stop.id), stop.val)l;
//     // }

//     // alert('done');
// }