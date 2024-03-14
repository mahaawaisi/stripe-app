import * as firebaseAdmin from 'firebase-admin';
firebaseAdmin.initializeApp(); // looking for account

export const db = firebaseAdmin.firestore(); // firestore sdk
export const auth = firebaseAdmin.auth(); // auth sdk

