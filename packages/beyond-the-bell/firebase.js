
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, } = require('firebase-admin/firestore');

const serviceAccount = require('./config/serviceAccountKey.json');

/** Firestore DB instance */
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

module.exports = db;