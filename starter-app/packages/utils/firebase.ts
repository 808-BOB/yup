import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

// Firebase configuration
// Hardcoded configuration for this specific project
const firebaseConfig = {
  apiKey: "AIzaSyB5MIhnHQNQSqaP-mvakggAJ-ttJPzdEzM",
  authDomain: "yup-rsvp.firebaseapp.com",
  projectId: "yup-rsvp",
  storageBucket: "yup-rsvp.appspot.com",
  appId: "1:689967075419:web:c23b303db9a4d8ae8e6f7e"
};

// Debug Firebase configuration
console.log('Firebase config check:');
console.log('- API Key:', firebaseConfig.apiKey ? 'Set' : 'Not set');
console.log('- Auth Domain:', firebaseConfig.authDomain ? 'Set' : 'Not set');
console.log('- Project ID:', firebaseConfig.projectId ? 'Set' : 'Not set');
console.log('- Storage Bucket:', firebaseConfig.storageBucket ? 'Set' : 'Not set');
console.log('- App ID:', firebaseConfig.appId ? 'Set' : 'Not set');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Helper functions for authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Provide more specific error messages
    if (error.code === 'auth/configuration-not-found') {
      throw new Error("Google sign-in is not properly configured in Firebase. Please ensure Google is enabled in the Firebase Authentication console.");
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error("This domain is not authorized for Firebase Authentication. Please add it to the authorized domains in the Firebase console.");
    } else {
      throw error;
    }
  }
};

export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Apple:", error);
    
    // Provide more specific error messages
    if (error.code === 'auth/configuration-not-found') {
      throw new Error("Apple sign-in is not properly configured in Firebase. Please ensure Apple is enabled in the Firebase Authentication console.");
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error("This domain is not authorized for Firebase Authentication. Please add it to the authorized domains in the Firebase console.");
    } else {
      throw error;
    }
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Observer for auth state changes
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };