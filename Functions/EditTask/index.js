const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

functions.http('EditTask', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else {
        try {
            const taskId = req.body.data.id;
            console.log('ID of task to edit:', taskId);
            const { title, content, created_at, due_to, group, is_done } = req.body.data;

            if (!taskId || !title || !content || !created_at || !due_to || group === undefined || is_done === undefined) {
                console.error('Task ID is required.');
                return res.status(400).json({ error: 'Task ID is required.' });
            }

            const taskDoc = await db.collection('tasks').doc(taskId).get();

            if (!taskDoc.data()) {
                console.error('Task not found.');
                return res.status(404).json({ error: 'Task not found.' });
            }

            const createdAtTimestamp = Timestamp.fromDate(new Date(created_at));
            const dueToTimestamp = Timestamp.fromDate(new Date(due_to));


            await db.collection('tasks').doc(taskId).update({
                title,
                content,
                created_at: createdAtTimestamp,
                due_to: dueToTimestamp,
                group,
                is_done
            });
            console.log('Task edited:', taskId);
            res.status(200).json({ message: 'Task edited successfully.' });
        } catch (error) {
            console.error('Error editing task:', error);
            res.status(500).send('An error occurred while editing the task.');
        }
    }
});