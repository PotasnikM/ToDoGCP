const functions = require('@google-cloud/functions-framework');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sgMail = require('@sendgrid/mail');


initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();


// sgMail.setApiKey(API_KEY);

functions.http('Notify', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
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
      tasksWithDueDate.forEach((item) => {
        message += item.title + " - " + item.due_to.toDate().toDateString() + "<br />";
      });

      const msg = {
        to: 'nnn.2321a@gmail.com',
        from: 'potasnik@student.agh.edu.pl',
        subject: 'A reminder of the expiring task deadlines!',
        text: 'Tasks with expiring deadlines.',
        html: `<h3>Tasks with expiring deadlines:</h3><br />${message}`
      };

      await sgMail.send(msg);
      console.log("Email sent successfully");
      res.status(200).send('E-mail sent successfully');
    } catch (error) {
      console.error('Error when sending an email:', error);
      res.status(500).send('Error when sending an email');
    }
  }
});
