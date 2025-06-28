import { useEffect, useState } from "react"
import { getAllNonSkippedReviews } from "./db_layer"

export function DataSummary() {
    const [reviews, setReviews] = useState<any>();

    useEffect(() => {
        getAllNonSkippedReviews().then(reviews => {
            setReviews(reviews);
            console.log('reviews: ', reviews);
        })
    }, [])

    const downloadJSON = () => {
        const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "reviews.json";
        link.click();
        URL.revokeObjectURL(url); // Clean up
    };

    return (
        <div>
            {reviews && (
                <div>
                    <p>Fetched the reviews! Click the button or check the console to see the JSONL file of responses.</p>
                    <button onClick={downloadJSON}>Download JSON</button>
                </div>
            )}
        </div>
    );
}