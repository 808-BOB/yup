import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK with project configuration
// Note: For development purposes, we're initializing without service account credentials
// In production, you should use proper service account credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'yup-rsvp',
    // For development, using a minimal configuration
    // This will allow the app to run but with limited functionality
  });
}

export const auth = admin.auth();

// Simplified token verification for development
// In production, use proper token verification with service account credentials
export async function verifyFirebaseToken(idToken: string) {
  // For development, we'll just decode the token without verifying it
  // This simulates successful verification but is NOT secure for production
  try {
    // Just returning a basic object that matches what we need
    // In production, this should be replaced with actual verification
    return {
      uid: idToken.split('.')[0], // Simple placeholder
      email: null,
      email_verified: false
    };
  } catch (error) {
    console.error('Error with token:', error);
    throw new Error('Invalid authentication token');
  }
}