import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// initializeApp() alone won't throw on a missing/invalid config, but
// getAuth() does — synchronously, at call time. Since this file used to
// call getAuth()/getFirestore() at module top-level, importing it with no
// .env.local (or a real project) would crash the entire app during module
// evaluation, before React even mounts — not a per-feature error, all of
// it. Skipping initialization entirely when the config is incomplete is
// what keeps modules 1 and 2 working with zero Firebase setup.
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }
