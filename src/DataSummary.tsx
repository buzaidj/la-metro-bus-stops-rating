import { useEffect, useState } from "react"
import { getAllNonSkippedReviews } from "./db_layer"

export function DataSummary() {
    const [reviews, setReviews] = useState<any>();

    useEffect(() => {
        getAllNonSkippedReviews().then(reviews => {
            setReviews(reviews);
        })
    })
    return <div>
        {
            reviews && <div>
                <p>Got reviews</p>
            </div>
        }
        <p>Hello</p>
    </div>
}