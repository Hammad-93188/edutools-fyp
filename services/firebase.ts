import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutUser = () => signOut(auth);

// Returns which sign-in methods already exist for an email: e.g. ['password'], ['google.com'], or []
export const getSignInMethods = async (email: string): Promise<string[]> => {
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch {
    return [];
  }
};

export const signupWithEmail = async (email: string, pass: string, fullName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCredential.user, { displayName: fullName });

  // Create user profile in Firestore
  try {
    const { setDoc, doc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      userId: userCredential.user.uid,
      email: email,
      displayName: fullName,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error creating user profile:", err);
  }

  // Send verification email, then sign out so the user must verify before entering
  try {
    await sendEmailVerification(userCredential.user);
  } catch (err) {
    console.error("Error sending verification email:", err);
  }
  await signOut(auth);

  return userCredential;
};

// Login that enforces email verification for password accounts
export const loginWithEmail = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  if (!cred.user.emailVerified) {
    // Re-send a fresh verification link, then block entry
    try { await sendEmailVerification(cred.user); } catch { /* ignore */ }
    await signOut(auth);
    const e: any = new Error('Please verify your email first. We just sent you a new verification link.');
    e.code = 'auth/email-not-verified';
    throw e;
  }
  return cred;
};

export const sendPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

export { onAuthStateChanged };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic data saving helper
export const saveUserActivity = async (path: string, data: any) => {
  if (!auth.currentUser) return;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error(`Error saving to ${path}:`, err);
    handleFirestoreError(err, OperationType.CREATE, path);
  }
};