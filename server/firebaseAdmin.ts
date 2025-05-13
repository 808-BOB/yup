import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'yup-rsvp',
    // Using application default credentials
    // No need for explicit credentials as Replit handles this seamlessly
  });
}

export const auth = admin.auth();

// Verify a Firebase ID token
export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid authentication token');
  }
}