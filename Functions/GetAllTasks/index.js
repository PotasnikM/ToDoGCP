const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

functions.http('getAllTasks', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else {
        try {
            const snapshot = await db.collection('tasks').get();
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.send({
                "status": 200,
                "data": tasks
            })
        } catch (error) {
            console.error('Error reading data from Firestore:', error);
            res.status(500).send('An error occurred while reading data from Firestore.');

        }
    }
});