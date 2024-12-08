const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

functions.http('AddNewTask', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else {
        try {
            const { title, content, created_at, due_to, group, is_done } = req.body.data;

            if (!title || !content || !created_at || !due_to || group === undefined || is_done === undefined) {
                console.error(req.body);
                return res.status(400).json({ error: 'All fields are required!', title: title, content, created_at, due_to, group, is_done });
            }

            const createdAtTimestamp = Timestamp.fromDate(new Date(created_at));
            const dueToTimestamp = Timestamp.fromDate(new Date(due_to));

            const taskRef = await db.collection('tasks').add({
                title,
                content,
                created_at: createdAtTimestamp,
                due_to: dueToTimestamp,
                group,
                is_done
            });

            res.status(201).json({ taskId: taskRef.id });
        } catch (error) {
            console.error('Error adding task:', error);
            res.status(500).send('An error occurred while adding a task.');
        }
    }
});