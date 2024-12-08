const functions = require('@google-cloud/functions-framework');

const { Firestore } = require('@google-cloud/firestore');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(
    "b7b730fcdf3a30d3333e36c3c77becf0",
    "989626cb1e55bbff81f1d58530533191"
);


functions.http('emailNotifications', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else {
        try {
            const snapshot = await db.collection('tasks').get();
            const currentDate = new Date();
            const fourDaysFromNow = new Date();
            fourDaysFromNow.setDate(currentDate.getDate() + 3);

            const tasksWithDueDate = snapshot.docs
                .filter(doc => {
                    const dueDate = doc.data().due_to.toDate();
                    return dueDate < fourDaysFromNow;
                })
                .map(doc => ({ id: doc.id, ...doc.data() }));


            let message = "";
            tasksWithDueDate.map((item, index) => {
                message += item.title;
                message += " ";
                message += item.due_to.toDate().toDateString();
                message += "<br />";
            })

            const request = mailjet
                .post('send', { version: 'v3.1' })
                .request({
                    Messages: [
                        {
                            From: {
                                Email: "potasnik@student.agh.edu.pl",
                                Name: "GCP"
                            },
                            To: [
                                {
                                    Email: "nnn.2321a@gmail.com",
                                    Name: "TODO APP USER"
                                }
                            ],
                            Subject: "A reminder of the expiring task deadlines!",
                            TextPart: "Yo",
                            HTMLPart: "<h3>Tasks with expiring deadlines:</h3><br />" + message
                        }
                    ]
                })
            request
                .then((result) => {
                    console.log(result.body)
                })
                .catch((err) => {
                    console.log(err)
                })
            res.status(200).send('E-mail sent successfully');
        } catch (error) {
            console.error('Error when sending an email:', error);
            res.status(500).send('Error when sending an email');
        }
    }
});