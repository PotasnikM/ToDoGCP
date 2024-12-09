const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

functions.http('deleteOneTask', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else {
        try {
            const taskId = req.body.data.id;
            console.log(taskId);
            if (!taskId) {
                return res.status(400).json({ error: 'Task ID is required.' });
            }

            const taskDoc = await db.collection('tasks').doc(taskId).get();

            if (!taskDoc.data()) {
                return res.status(404).json({ error: 'Task not found.' });
            }

            await db.collection('tasks').doc(taskId).delete();

            res.status(200).json({ message: 'Task deleted successfully.' });
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).send('An error occurred while deleting the task.');
        }
    }
});