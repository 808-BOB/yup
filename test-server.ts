console.log("Test server is running.");
console.log("Environment variables:");
console.log("LINKEDIN_CLIENT_ID exists:", !!process.env.LINKEDIN_CLIENT_ID);
console.log("LINKEDIN_PRIMARY_CLIENT_SECRET exists:", !!process.env.LINKEDIN_PRIMARY_CLIENT_SECRET);
console.log("LINKEDIN_REDIRECT_URI exists:", !!process.env.LINKEDIN_REDIRECT_URI);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);