/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
// const functions = require('firebase-functions');
const cors = require('cors')({origin: true});

exports.retrieveStopId = onRequest(async (req, res) => {
    cors(req, res, async () => {
        const transitLandStopId = req.query.stopId;
        try {
            const apiKey = 'kuQgdDebgrO1GHRGV0CwjTMs0xa2unZD';
            const url = 'https://transit.land/api/v2/rest/' + transitLandStopId;
    
            const response = await axios.get(url, {
                headers: {
                apikey: apiKey,
                },
            });
    
            res.send(response.data);
        } catch (error) {
            console.error(error);
            logger.error(error);
            res.status(500).send('An error occurred');
        }
    })
  });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
