import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from 'firebase/auth'
import { auth } from '../firebase'

export async function signInEmail(email: string, password: string) {
    if (!email || !password) throw new Error('Введіть email і пароль')
    return await signInWithEmailAndPassword(auth, email, password)
}

export async function signUpEmail(email: string, password: string) {
    if (!email || !password) throw new Error('Введіть email і пароль')
    if (password.length < 6) throw new Error('Пароль має містити щонайменше 6 символів')
    return await createUserWithEmailAndPassword(auth, email, password)
}

export async function signInGoogle() {
    const provider = new GoogleAuthProvider()
    return await signInWithPopup(auth, provider)
}

export async function logout() {
    await signOut(auth)
}
