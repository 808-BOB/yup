import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
if (!admin.apps || admin.apps.length === 0) {
  try {
    // Check if we have a service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT && 
        process.env.FIREBASE_SERVICE_ACCOUNT.includes('private_key')) {
      
      // Try to parse the service account JSON
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || 'yup-rsvp'
        });
        
        console.log('Firebase Admin SDK initialized with service account credentials');
      } catch (jsonError) {
        console.error('Error parsing service account JSON:', jsonError);
        throw jsonError; // Rethrow to use the fallback initialization
      }
    } else {
      // Initialize with application default credentials
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'yup-rsvp'
      });
      
      console.log('Firebase Admin SDK initialized with default configuration');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    
    // Last resort fallback - minimal initialization
    try {
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized with minimal configuration');
    } catch (fallbackError) {
      console.error('Fallback initialization failed:', fallbackError);
    }
  }
}

export const auth = admin.auth();

// Verify a Firebase ID token
export async function verifyFirebaseToken(idToken: string) {
  try {
    // Try to verify the token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Firebase token verified successfully');
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    
    // Development fallback - extract basic info from token without verification
    // This should NEVER be used in production
    if (process.env.NODE_ENV !== 'production') {
      console.warn('DEVELOPMENT MODE: Using unverified token data');
      try {
        // Extract data from token without verification
        const tokenParts = idToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          return {
            uid: payload.sub || payload.user_id,
            email: payload.email,
            email_verified: payload.email_verified || false,
            name: payload.name,
            picture: payload.picture
          };
        }
      } catch (fallbackError) {
        console.error('Development fallback also failed:', fallbackError);
      }
    }
    
    throw new Error('Invalid authentication token');
  }
}