import { initializeApp } from 'firebase/app'

import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyCf429wZm4HDHUXAd1THk5znW-XrrI9KS8',
    authDomain: 'fireplace-store-9067d.firebaseapp.com',
    projectId: 'fireplace-store-9067d',
    storageBucket: 'fireplace-store-9067d.appspot.com',

    messagingSenderId: '569371806358',
    appId: '1:569371806358:web:9132dec75a17c4a8b710b7',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
