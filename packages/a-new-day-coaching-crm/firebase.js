const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, } = require('firebase-admin/firestore');

const serviceAccount = require('./config/serviceAccountKey.json');

/** Firestore DB instance */
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// glados can't hold the long-lived gRPC stream Firestore's default transport
// wants for realtime listeners (routes/users.js, tools.js, invoices.js all
// cache their collections via onSnapshot): the stream backs off until
// "Exceeded maximum number of retries allowed" and the in-memory cache never
// populates, so every route reads back {} — this is what "profiles are gone"
// in WL-3 actually was. One-shot reads/writes were never affected. REST
// transport avoids the persistent stream and lets onSnapshot succeed here.
db.settings({ preferRest: true });

module.exports = db;