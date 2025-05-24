import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
// Import auth systems
import { setupAuth as setupLinkedInAuth } from "./auth";
import { verifyFirebaseToken } from "./firebaseAdmin";
import session from "express-session";
import passport from "passport";
import { generateUsername } from "@shared/utils";
import { users } from "@shared/schema";

import Stripe from "stripe";
import { createCheckoutSession, createCustomerPortalSession } from "./stripe";

// Debug Stripe environment variables
console.log('Stripe environment variables check:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set');
console.log('- STRIPE_PRO_PRICE_ID:', process.env.STRIPE_PRO_PRICE_ID ? 'Set' : 'Not set');
console.log('- STRIPE_PREMIUM_PRICE_ID:', process.env.STRIPE_PREMIUM_PRICE_ID ? 'Set' : 'Not set');
console.log('- APP_URL:', process.env.APP_URL ? process.env.APP_URL : 'Not set');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Stripe features will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any, // Type assertion to avoid version mismatch in typings
  }) : null;

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session and passport
  app.use(session({
    secret: process.env.SESSION_SECRET || 'yup-rsvp-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, user);
      } else {
        done(new Error("User not found"), null);
      }
    } catch (err) {
      done(err, null);
    }
  });
  
  // Setup LinkedIn auth (temporarily hidden)
  // setupLinkedInAuth(app);
  
  // Firebase authentication handler
  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    try {
      const { idToken, displayName, email, photoURL, uid, provider } = req.body;
      
      // Verify the Firebase token using Admin SDK
      const decodedToken = await verifyFirebaseToken(idToken);
      
      // The UID from the token should match the UID from the client
      if (decodedToken.uid !== uid) {
        return res.status(401).json({ message: "Invalid authentication token" });
      }
      
      console.log("Firebase authentication successful for:", { email, uid });
      
      // Check if user exists
      let user = email ? await storage.getUserByEmail(email) : null;
      if (!user) {
        user = await storage.getUser(uid);
      }
      
      if (!user) {
        // Generate a username if the user doesn't exist
        const username = generateUsername(email, uid);
        
        // Create a new user directly with SQL to avoid column mapping issues
        try {
          await db.execute(sql`
            INSERT INTO users (
              id, username, display_name, email, profile_image_url,
              is_admin, is_pro, is_premium
            ) VALUES (
              ${uid}, ${username}, ${displayName || 'User'}, ${email || null}, ${photoURL || null},
              false, false, false
            )
            ON CONFLICT (id) DO UPDATE SET
              display_name = ${displayName || 'User'},
              email = ${email || null},
              profile_image_url = ${photoURL || null}
          `);
          
          // Get the user we just created/updated
          const [newUser] = await db.select().from(users).where(eq(users.id, uid));
          user = newUser;
        } catch (sqlError) {
          console.error("SQL Error creating Firebase user:", sqlError);
          return res.status(500).json({ message: "Database error creating user", error: String(sqlError) });
        }
      } else if (user.id !== uid) {
        // If email exists but with different ID, update directly with SQL
        try {
          // First update the user ID and other fields
          await db.execute(sql`
            UPDATE users SET 
              id = ${uid},
              profile_image_url = ${photoURL || user.profile_image_url || null},
              display_name = ${displayName || user.display_name || 'User'}
            WHERE id = ${user.id}
          `);
          
          // Get the updated user
          const [updatedUser] = await db.select().from(users).where(eq(users.id, uid));
          user = updatedUser;
        } catch (sqlError) {
          console.error("SQL Error updating Firebase user:", sqlError);
          return res.status(500).json({ message: "Database error updating user", error: String(sqlError) });
        }
      }
      
      // Set user in session instead of using req.login since we removed passport
      req.session.userId = user.id;
      console.log("Firebase auth: Set session userId to:", user.id);
      
      try {
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error("Firebase auth: Session save error:", err);
              reject(err);
            } else {
              console.log("Firebase auth: Session saved successfully");
              resolve();
            }
          });
        });
        
        // Return user data to client (converting from snake_case DB fields to camelCase response)
        return res.status(200).json({
          id: user.id,
          username: user.username,
          displayName: user.display_name || "",
          email: user.email,
          profileImageUrl: user.profile_image_url,
          isAdmin: !!user.is_admin,
          isPro: !!user.is_pro,
          isPremium: !!user.is_premium
        });
      } catch (sessionErr) {
        console.error("Firebase auth: Session save error:", sessionErr);
        return res.status(500).json({ message: "Login session error", error: String(sessionErr) });
      }
    } catch (error) {
      console.error("Firebase authentication error:", error);
      return res.status(401).json({ message: "Authentication failed" });
    }
  });
  
  // User authentication & session
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password, displayName, phoneNumber, email } = req.body;

      // Validate that at least phone or email is provided
      if (!phoneNumber && !email) {
        return res.status(400).json({ message: "Please provide either a phone number or email address" });
      }

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email is already taken (if provided)
      if (email) {
        const existingEmailUser = await storage.getUserByEmail(email);
        if (existingEmailUser) {
          return res.status(400).json({ message: "Email address already registered" });
        }
      }
      
      // Generate a unique numeric ID for the user (shorter to fit integer range)
      const userId = Math.floor(Date.now() / 1000); // Use seconds instead of milliseconds

      // Create the new user using SQL to avoid column mapping issues
      try {
        await db.execute(sql`
          INSERT INTO users (
            id, username, password, display_name, email, phone_number,
            is_admin, is_pro, is_premium
          ) VALUES (
            ${userId}, ${username}, ${password}, ${displayName}, ${email || null}, ${phoneNumber || null},
            false, false, false
          )
        `);
      } catch (sqlError) {
        console.error("SQL Error creating user:", sqlError);
        return res.status(500).json({ message: "Database error creating user", error: String(sqlError) });
      }
      
      // Get the user we just created
      const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);

      // Add user to session and save it
      req.session.userId = user.id;
      
      // Save the session to ensure it persists
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Failed to save session after signup:", err);
            reject(err);
          } else {
            console.log("Session saved successfully after signup for user:", user.username);
            resolve();
          }
        });
      });

      // Return user info without password (converting from snake_case DB fields to camelCase response)
      return res.status(201).json({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        phoneNumber: user.phone_number,
        isAdmin: user.is_admin,
        isPro: user.is_pro,
        isPremium: user.is_premium,
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Error creating account" });
    }
  });

  // Simplified direct login endpoint for the test user only
  app.post("/api/direct-login", express.json(), async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (username === "subourbon" && password === "events") {
        // Create the test user if it doesn't exist
        console.log("Creating test user record directly:", username);
        
        try {
          // First check if user exists
          const existingUsers = await db.select().from(users).where(eq(users.username, username));
          
          let userId = "";
          
          if (existingUsers.length === 0) {
            // Create user with only the columns we know exist in the database
            try {
              await db.execute(sql`
                INSERT INTO users (id, username, password, display_name, is_admin, is_pro, is_premium, profile_image_url)
                VALUES ('subourbon-test-123', 'subourbon', 'events', 'Sub Ourbon', true, true, true, null)
              `);
              userId = "subourbon-test-123";
              console.log("Created test user successfully with ID:", userId);
            } catch (insertError) {
              console.error("Detailed SQL insert error:", insertError);
              return res.status(500).json({ message: "SQL Error creating user", error: String(insertError) });
            }
          } else {
            userId = existingUsers[0].id;
            console.log("Test user already exists with ID:", userId);
          }
          
          // Set session directly
          req.session.userId = userId;
          
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error("Failed to save session:", err);
                reject(err);
              } else {
                console.log("Session saved successfully");
                resolve();
              }
            });
          });
          
          return res.json({ 
            success: true,
            message: "Logged in as test user",
            id: userId,
            username: "subourbon"
          });
        } catch (err) {
          console.error("Emergency login error:", err);
          return res.status(500).json({ message: "Emergency login failed", error: String(err) });
        }
      } else {
        return res.status(401).json({ message: "This endpoint only works for the test user" });
      }
    } catch (error) {
      console.error("Direct login error:", error);
      return res.status(500).json({ message: "Direct login failed", error: String(error) });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt:", { username: req.body.username, password: req.body.password ? "provided" : "missing" });
      const { username, password } = req.body;

      if (!username || !password) {
        console.log("Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }

      // For the test user, use a special direct approach
      if (username === "subourbon" && password === "events") {
        console.log("Using special login flow for test user");
        
        // Create if not exists
        try {
          console.log("Checking for existing subourbon user");
          const existingUsers = await db.select().from(users).where(eq(users.username, "subourbon"));
          
          console.log("Existing user check result:", { count: existingUsers.length });
          
          let userId = "";
          
          if (existingUsers.length === 0) {
            console.log("Creating subourbon test user");
            try {
              // Use raw SQL to avoid type errors
              await db.execute(sql`
                INSERT INTO users (id, username, password, display_name, is_admin, is_pro, is_premium, profile_image_url)
                VALUES ('subourbon-123', 'subourbon', 'events', 'Sub Ourbon', true, true, true, null)
              `);
              
              userId = "subourbon-123";
              console.log("Created user with ID:", userId);
            } catch (insertErr) {
              console.error("Error inserting test user:", insertErr);
              return res.status(500).json({ message: "Error creating test user", error: String(insertErr) });
            }
          } else {
            userId = existingUsers[0].id;
            console.log("Found existing test user with ID:", userId);
          }
          
          // Set the session
          req.session.userId = userId;
          console.log("Set session userId to:", userId);
          
          try {
            await new Promise<void>((resolve, reject) => {
              req.session.save((err) => {
                if (err) {
                  console.error("Session save error:", err);
                  reject(err);
                } else {
                  console.log("Session saved successfully");
                  resolve();
                }
              });
            });
            
            // Return a simplified response with proper field names matching the database
            return res.json({
              id: userId,
              username: "subourbon",
              display_name: "Sub Ourbon",
              is_admin: true,
              is_pro: true,
              is_premium: true
            });
          } catch (sessionErr) {
            console.error("Error saving session:", sessionErr);
            return res.status(500).json({ message: "Session save error", error: String(sessionErr) });
          }
        } catch (testUserErr) {
          console.error("Error in test user flow:", testUserErr);
          return res.status(500).json({ message: "Test user error", error: String(testUserErr) });
        }
      }
      
      // Standard login flow for non-test users
      console.log("Using standard login flow");
      
      try {
        // Find user by username directly using raw SQL to avoid column mapping issues
        const result = await db.execute(sql`
          SELECT * FROM users WHERE username = ${username}
        `);
        
        const user = result.rows && result.rows.length > 0 ? result.rows[0] : null;
        console.log("User lookup result:", { found: !!user });
        
        if (!user) {
          console.log("User not found");
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        if (user.password !== password) {
          console.log("Password mismatch");
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Set session
        req.session.userId = user.id;
        
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              reject(err);
            } else {
              console.log("Session saved successfully for user:", user.username);
              resolve();
            }
          });
        });
        
        // Return user data in the expected format, converting from snake_case db columns to camelCase response
        return res.json({
          id: user.id,
          username: user.username,
          displayName: user.display_name || "",
          isAdmin: !!user.is_admin,
          isPro: !!user.is_pro,
          isPremium: !!user.is_premium,
          profileImageUrl: user.profile_image_url || null,
          brandTheme: user.brand_theme || "{}",
          logoUrl: user.logo_url || null
        });
      } catch (standardErr) {
        console.error("Error in standard login flow:", standardErr);
        return res.status(500).json({ message: "Login error", error: String(standardErr) });
      }
    } catch (error) {
      console.error("Login route error:", error);
      return res.status(500).json({ message: "Fatal error during login", error: String(error) });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      return res.json({ message: "Logged out successfully" });
    });
  });

  // Password reset request endpoint
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { contact, type } = req.body;

      if (!contact) {
        return res.status(400).json({ message: "Contact information is required" });
      }

      // Find user by email or phone number
      let user;
      if (type === "email") {
        user = await storage.getUserByEmail(contact);
      } else {
        // For phone numbers, we need to find users by phone
        const result = await db.execute(sql`SELECT * FROM users WHERE phone_number = ${contact}`);
        user = result.rows?.[0];
      }

      if (!user) {
        // Don't reveal whether the user exists or not for security
        return res.json({ 
          message: "If an account with that contact information exists, password reset instructions have been sent." 
        });
      }

      // Generate a password reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Store the reset token in the database
      try {
        await db.execute(sql`
          UPDATE users 
          SET reset_token = ${resetToken}, reset_token_expiry = ${resetExpiry.toISOString()}
          WHERE id = ${user.id}
        `);
      } catch (dbError) {
        console.error("Error storing reset token:", dbError);
        return res.status(500).json({ message: "Failed to process password reset request" });
      }

      if (type === "email") {
        // Log the reset information for development
        console.log(`Password reset requested for email: ${contact}`);
        console.log(`Reset token: ${resetToken}`);
        
        res.json({ 
          message: "Password reset instructions have been sent to your email address.",
          // For development only
          resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
      } else {
        // For SMS reset
        const resetCode = resetToken.substring(0, 6).toUpperCase();
        console.log(`Password reset requested for phone: ${contact}`);
        console.log(`Reset code: ${resetCode}`);
        
        res.json({ 
          message: "Password reset code has been sent to your phone number.",
          // For development only
          resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
        });
      }

    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.get(
    "/api/auth/me",
    async (req: Request, res: Response) => {
      try {
        console.log("GET /api/auth/me - Auth state:", { 
          isPassportAuthenticated: req.isAuthenticated(),
          hasSessionUserId: !!req.session?.userId,
          sessionID: req.sessionID,
          userInPassport: !!req.user
        });
        
        // First try session-based auth which should work for traditional login
        if (req.session && req.session.userId) {
          console.log("Using session userId:", req.session.userId);
          
          try {
            // Get user directly from database using raw SQL to avoid typing issues
            const result = await db.execute(sql`SELECT * FROM users WHERE id = ${req.session.userId}`);
            
            if (result.rows && result.rows.length > 0) {
              const user = result.rows[0];
              console.log("Found user from session:", user.username);
              // Since we're using raw SQL, we get snake_case column names
              // that we need to map to camelCase for the client
              return res.json({
                id: user.id,
                username: user.username,
                displayName: user.display_name || "",
                isAdmin: !!user.is_admin,
                isPro: !!user.is_pro,
                isPremium: !!user.is_premium,
                brandTheme: user.brand_theme || "{}",
                logoUrl: user.logo_url || null,
                profileImageUrl: user.profile_image_url || null
              });
            } else {
              console.log("User not found for session ID:", req.session.userId);
            }
          } catch (dbError) {
            console.error("Database error:", dbError);
          }
        } 
        // Then check Passport (used by Firebase/OpenID authentication)
        else if (req.isAuthenticated() && req.user) {
          console.log("User is authenticated via Passport:", req.user);
          
          const user = req.user as any;
          const userId = user.id || (user.claims && user.claims.sub);
          
          if (!userId) {
            console.error("No user ID found in authenticated user");
            return res.status(500).json({ message: "Invalid user data" });
          }
          
          try {
            // Get the actual database record using raw SQL
            const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
            
            if (result.rows && result.rows.length > 0) {
              const dbUser = result.rows[0];
              console.log("Database user:", dbUser);
              // Use the database record with snake_case properties
              return res.json({
                id: dbUser.id,
                username: dbUser.username,
                displayName: dbUser.display_name || "",
                isAdmin: !!dbUser.is_admin,
                isPro: !!dbUser.is_pro,
                isPremium: !!dbUser.is_premium,
                brandTheme: dbUser.brand_theme || "{}",
                logoUrl: dbUser.logo_url || null,
                profileImageUrl: dbUser.profile_image_url || null
              });
            } else {
              // Fall back to Passport user if needed
              console.log("Using passport user object directly (not ideal):", user);
              return res.json({
                id: userId,
                username: user.username || "",
                displayName: user.display_name || "",
                is_admin: false,
                is_pro: false,
                is_premium: false,
                brandTheme: "{}",
                logoUrl: null,
                profileImageUrl: user.profileImageUrl || null
              });
            }
          } catch (dbError) {
            console.error("Database error:", dbError);
            return res.status(500).json({ message: "Database error" });
          }
        }

        console.log("No valid authentication found");
        return res.status(401).json({ message: "Not authenticated" });
      } catch (error) {
        console.error("Get current user error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // User operations
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.put(
    "/api/users/:id",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        
        // Only allow users to update their own profile
        if (req.session.userId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        
        const { display_name, password } = req.body;
        
        // Update user
        const updatedUser = await storage.updateUser(userId, {
          display_name,
          password,
        });
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Return user without password (converting from snake_case DB fields to camelCase response)
        return res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.display_name,
          isAdmin: updatedUser.is_admin,
          isPro: updatedUser.is_pro,
          isPremium: updatedUser.is_premium,
        });
      } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  // User branding settings
  app.put(
    "/api/users/:id/branding",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        
        // Only allow users to update their own branding
        if (req.session.userId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        
        const { brandTheme, logoUrl } = req.body;
        
        // Update branding (this method checks for premium status)
        const updatedUser = await storage.updateUserBranding(userId, {
          brandTheme: brandTheme,
          logoUrl: logoUrl,
        });
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Return updated branding info (converting from snake_case DB fields to camelCase response)
        return res.json({
          brandTheme: updatedUser.brand_theme,
          logoUrl: updatedUser.logo_url,
        });
      } catch (error) {
        console.error("Update branding error:", error);
        return res.status(500).json({ message: "Failed to update branding" });
      }
    }
  );

  // Set admin status for testing purposes
  app.get("/api/admin/set-bob-admin", async (_req: Request, res: Response) => {
    try {
      // Get the user by username
      const user = await storage.setAdminStatus("bob", true);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "Bob is now an admin", 
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          isAdmin: user.is_admin
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set admin status" });
    }
  });

  // Set premium status for testing purposes
  app.get("/api/make-premium/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      // Get the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update to make user premium
      const updatedUser = await storage.updateUser(user.id, { is_premium: true, is_pro: true });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        message: `User ${username} is now a premium member`, 
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.display_name,
          isPro: updatedUser.is_pro,
          isPremium: updatedUser.is_premium
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set premium status" });
    }
  });
  
  // Set pro status for testing purposes
  app.get("/api/make-pro/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      // Get the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update to make user pro
      const updatedUser = await storage.updateUser(user.id, { is_pro: true, is_premium: false });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        message: `User ${username} is now a pro member`, 
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.display_name,
          isPro: updatedUser.is_pro,
          isPremium: updatedUser.is_premium
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set pro status" });
    }
  });
  
  // Reset to free tier for testing purposes
  app.get("/api/make-free/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      // Get the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update to make user free
      const updatedUser = await storage.updateUser(user.id, { is_pro: false, is_premium: false });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        message: `User ${username} is now a free user`, 
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.display_name,
          isPro: updatedUser.is_pro,
          isPremium: updatedUser.is_premium
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set free status" });
    }
  });

  // Temporary route to fix the image for the Former Colleagues event
  app.get("/api/fix-former-colleagues-image", async (_req: Request, res: Response) => {
    try {
      // Find the event by slug
      const event = await storage.getEventBySlug("cocktails-with-friends-of-former-colleagues--bdb95e23");
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Use an embedded base64 image for the cocktail event
      const cocktailImageBase64 = "data:image/jpeg;base64,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.....";
          
      // Update the event
      const updatedEvent = await storage.updateEvent(event.id, {
        imageUrl: cocktailImageBase64
      });
      
      if (!updatedEvent) {
        return res.status(500).json({ message: "Failed to update event" });
      }
      
      res.json({ message: "Event image updated", success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update event image" });
    }
  });

  // Route for creating test invites
  app.get("/api/create-test-invites", async (req: Request, res: Response) => {
    try {
      const eventId = 1; // Assuming event ID 1 exists
      const userIds = [2, 3, 4]; // Assuming user IDs 2, 3, 4 exist
      
      for (const userId of userIds) {
        await storage.createInvitation(eventId, userId);
      }
      
      res.json({ message: "Test invites created", success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to create test invites" });
    }
  });

  // Events
  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.get("/api/events", async (_req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get the host information to include branding
      const host = await storage.getUser(String(event.hostId));
      
      // Add debugging to see what's coming from the database
      console.log("Event data from DB (by ID):", {
        id: event.id,
        title: event.title,
        customYesText: event.customYesText,
        customNoText: event.customNoText,
        useCustomRsvpText: event.useCustomRsvpText
      });
      
      // Add host branding information to the response if the host is premium
      const eventWithBranding = {
        ...event,
        hostDisplayName: host?.display_name || "Event Host",
        hostBranding: host?.is_premium ? {
          logoUrl: host.logo_url,
          brandTheme: host.brand_theme
        } : null,
        // Include custom RSVP text fields regardless of premium status
        // so they're available on the client
        customYesText: event.customYesText || null,
        customNoText: event.customNoText || null,
        useCustomRsvpText: event.useCustomRsvpText || false
      };
      
      res.json(eventWithBranding);
    } catch (error) {
      console.error("Error getting event by ID:", error);
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  // Endpoint to get LinkedIn connections for an event
  app.get("/api/events/:id/connections", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const userId = req.session.userId!;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.linkedin_id || !currentUser.linkedin_access_token || !currentUser.linkedin_connections) {
        return res.status(400).json({ message: "LinkedIn not connected or no connections available" });
      }
      
      // Get all responses to the event
      const responses = await storage.getResponsesByEvent(eventId);
      
      // Get the user IDs of all attendees who have responded "yup"
      const attendeeIds = responses
        .filter(response => response.response === "yup")
        .map(response => response.user_id)
        .filter((id): id is string => id !== null);
      
      // Get the users who are attending
      const attendees = await Promise.all(
        attendeeIds.map(id => storage.getUser(id))
      );
      
      // Parse the current user's LinkedIn connections
      const myConnections = JSON.parse(currentUser.linkedin_connections);
      
      // Filter for attendees with LinkedIn IDs and check if they're connected
      const connections = attendees
        .filter(user => user && user.linkedin_id)
        .map(user => ({
          id: user!.id,
          displayName: user!.display_name,
          linkedinId: user!.linkedin_id!,
          linkedinProfileUrl: user!.linkedin_profile_url || `https://www.linkedin.com/in/${user!.linkedin_id}`,
          isConnected: myConnections.includes(user!.linkedin_id)
        }));
      
      return res.json(connections);
    } catch (error) {
      console.error("Error fetching LinkedIn connections:", error);
      return res.status(500).json({ message: "Failed to fetch LinkedIn connections" });
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.updateEvent(
        parseInt(req.params.id),
        req.body
      );
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.get("/api/events/slug/:slug", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get the host information to include branding
      const host = await storage.getUser(event.hostId);
      
      // Add debugging to see what's coming from the database
      console.log("Event data from DB:", {
        id: event.id,
        title: event.title,
        customYesText: event.customYesText,
        customNoText: event.customNoText,
        useCustomRsvpText: event.useCustomRsvpText
      });
      
      // Add host branding information to the response if the host is premium
      const eventWithBranding = {
        ...event,
        hostDisplayName: host?.display_name || "Event Host",
        hostBranding: host?.is_premium ? {
          logoUrl: host.logo_url,
          brandTheme: host.brand_theme
        } : null,
        // Include custom RSVP text fields regardless of premium status
        // so they're available on the client
        customYesText: event.customYesText || null,
        customNoText: event.customNoText || null,
        useCustomRsvpText: event.useCustomRsvpText || false
      };
      
      res.json(eventWithBranding);
    } catch (error) {
      console.error("Error getting event by slug:", error);
      res.status(500).json({ error: "Failed to get event by slug" });
    }
  });

  // User events
  app.get("/api/users/:userId/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getUserEvents(parseInt(req.params.userId));
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user events" });
    }
  });

  // Invitations
  app.get("/api/users/:userId/invites", async (req: Request, res: Response) => {
    try {
      const events = await storage.getEventsUserInvitedTo(
        parseInt(req.params.userId)
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invites" });
    }
  });

  // RSVP
  app.post("/api/responses", async (req: Request, res: Response) => {
    try {
      const response = await storage.createResponse(req.body);
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to create response" });
    }
  });

  // Guest RSVP (no login required)
  app.post("/api/guest-responses", async (req: Request, res: Response) => {
    try {
      // Set isGuest to true for all guest responses
      const guestResponse = {
        ...req.body,
        isGuest: true,
      };
      
      const response = await storage.createResponse(guestResponse);
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to create guest response" });
    }
  });

  // Get event responses
  app.get(
    "/api/events/:id/responses",
    async (req: Request, res: Response) => {
      try {
        const responses = await storage.getResponsesByEvent(
          parseInt(req.params.id)
        );
        res.json(responses);
      } catch (error) {
        res.status(500).json({ error: "Failed to get responses" });
      }
    }
  );

  // Get response counts
  app.get(
    "/api/events/:id/responses/count",
    async (req: Request, res: Response) => {
      try {
        const counts = await storage.getEventResponses(parseInt(req.params.id));
        res.json(counts);
      } catch (error) {
        res.status(500).json({ error: "Failed to get response counts" });
      }
    }
  );

  // Get user's response to an event
  app.get(
    "/api/events/:eventId/users/:userId/response",
    async (req: Request, res: Response) => {
      try {
        const response = await storage.getUserEventResponse(
          parseInt(req.params.eventId),
          parseInt(req.params.userId)
        );
        res.json(response || null);
      } catch (error) {
        res.status(500).json({ error: "Failed to get user response" });
      }
    }
  );

  // Create invitation
  app.post(
    "/api/events/:eventId/invitations/:userId",
    async (req: Request, res: Response) => {
      try {
        await storage.createInvitation(
          parseInt(req.params.eventId),
          parseInt(req.params.userId)
        );
        res.status(201).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to create invitation" });
      }
    }
  );

  // Get invitations for an event
  app.get(
    "/api/events/:eventId/invitations",
    async (req: Request, res: Response) => {
      try {
        const userIds = await storage.getEventInvitations(
          parseInt(req.params.eventId)
        );
        res.json(userIds);
      } catch (error) {
        res.status(500).json({ error: "Failed to get invitations" });
      }
    }
  );

  // Stripe subscription management
  if (stripe) {
    // Create a Stripe Checkout session for subscription
    app.post('/api/create-checkout-session', isAuthenticated, async (req: Request, res: Response) => {
      try {
        const { priceId } = req.body;
        
        if (!priceId) {
          return res.status(400).json({ message: 'Price ID is required' });
        }
        
        const userId = req.session.userId!; // Non-null assertion (we know it exists because of isAuthenticated)
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const session = await createCheckoutSession(priceId, userId);
        res.json({ url: session.url });
      } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Failed to create checkout session' });
      }
    });
    
    // Create a customer portal session for subscription management
    app.post('/api/create-customer-portal', isAuthenticated, async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!; // Non-null assertion (we know it exists because of isAuthenticated)
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.stripe_customer_id) {
          return res.status(400).json({ message: 'No Stripe customer ID found for this user' });
        }
        
        const session = await createCustomerPortalSession(user.stripe_customer_id);
        res.json({ url: session.url });
      } catch (error) {
        console.error('Error creating customer portal session:', error);
        res.status(500).json({ message: 'Failed to create customer portal session' });
      }
    });
    
    // Webhook for Stripe events
    app.post('/api/stripe-webhook', async (req: Request, res: Response) => {
      const sig = req.headers['stripe-signature'] as string;
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ message: 'Webhook secret is not configured' });
      }
      
      let event;
      
      try {
        // For production, you would use the raw body
        // Here we're using the parsed body for simplicity
        const payload = JSON.stringify(req.body);
        
        event = stripe.webhooks.constructEvent(
          payload,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          // Find user from client_reference_id
          if (session.client_reference_id) {
            const userId = parseInt(session.client_reference_id);
            const user = await storage.getUser(userId);
            
            if (user) {
              // Update user with Stripe customer ID
              await storage.updateStripeCustomerId(user.id, session.customer as string);
              
              // Check subscription level and update user status
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
              
              if (subscription) {
                await storage.updateStripeSubscriptionId(user.id, subscription.id);
                
                // Update user tier based on price
                const item = subscription.items.data[0];
                const priceId = item.price.id;
                
                if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
                  await storage.updateUser(user.id, { is_premium: true, is_pro: true });
                } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                  await storage.updateUser(user.id, { is_pro: true, is_premium: false });
                }
              }
            }
          }
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          // Find user by Stripe customer ID
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          
          if (user) {
            // Update subscription ID
            await storage.updateStripeSubscriptionId(user.id, subscription.id);
            
            // Update user tier based on price
            const item = subscription.items.data[0];
            const priceId = item.price.id;
            
            if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
              await storage.updateUser(user.id, { is_premium: true, is_pro: true });
            } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              await storage.updateUser(user.id, { is_pro: true, is_premium: false });
            }
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          // Find user by Stripe customer ID
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          
          if (user) {
            // Downgrade user to free tier
            await storage.updateUser(user.id, { is_pro: false, is_premium: false });
            // Pass empty string instead of null for TypeScript compatibility
            await storage.updateStripeSubscriptionId(user.id, "");
          }
          break;
        }
      }
      
      // Return a 200 response to acknowledge receipt of the event
      res.send({ received: true });
    });
  }

  // Payment Intent for one-time payments (if needed)
  app.post('/api/create-payment-intent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: 'Stripe is not configured' });
      }
      
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: 'Amount is required' });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          userId: req.session.userId!.toString()
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Debug endpoint to check database connection and users
  app.get("/api/debug/users", async (_req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      console.log("Debug - Total users in database:", allUsers.length);
      
      if (allUsers.length > 0) {
        console.log("Debug - First user:", {
          id: allUsers[0].id,
          username: allUsers[0].username,
          password: allUsers[0].password 
        });
      } else {
        console.log("Debug - No users found in database!");
      }
      
      // Create test users if none exist
      if (allUsers.length === 0 || !allUsers.find(u => u.username === "subourbon")) {
        // Create subourbon test user with SQL to avoid column mapping issues
        console.log("Debug - Creating test user 'subourbon'");
        const userId = "subourbon_" + Date.now();
        
        try {
          // Use raw SQL to avoid type errors
          await db.execute(sql`
            INSERT INTO users (
              id, username, password, display_name, email, 
              is_admin, is_pro, is_premium
            ) VALUES (
              ${userId}, 'subourbon', 'events', 'Sub Ourbon', 'subourbon@example.com',
              true, true, true
            )
          `);
          
          console.log("Debug - Created subourbon user with ID:", userId);
        } catch (insertErr) {
          console.error("Error inserting test user:", insertErr);
          return res.status(500).json({ message: "Error creating test user", error: String(insertErr) });
        }
      }
      
      // Always ensure testuser exists
      if (allUsers.length === 0 || !allUsers.find(u => u.username === "testuser")) {
        console.log("Debug - Creating test user 'testuser'");
        const userId = "testuser_" + Date.now();
        
        try {
          // Use raw SQL to avoid type errors
          await db.execute(sql`
            INSERT INTO users (
              id, username, password, display_name, 
              is_admin, is_pro, is_premium
            ) VALUES (
              ${userId}, 'testuser', 'password', 'Test User',
              false, false, false
            )
          `);
          
          console.log("Debug - Created testuser with ID:", userId);
        } catch (insertErr) {
          console.error("Error inserting testuser:", insertErr);
          return res.status(500).json({ message: "Error creating testuser", error: String(insertErr) });
        }
      }
      
      return res.json({
        userCount: allUsers.length,
        users: allUsers.map(u => ({
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          password: u.password // Only showing in debug endpoint
        }))
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      return res.status(500).json({ error: String(error) });
    }
  });
  
  // Debug endpoint to force login as a user
  app.get("/api/debug/force-login/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      console.log("Force login as:", username);
      
      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (!user) {
        console.log("User not found for force login:", username);
        return res.status(404).send(`
          <html>
            <head>
              <title>Force Login Failed</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
                h1 { color: #ef4444; }
                .error { color: #ef4444; font-weight: bold; }
                a { color: #4f46e5; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <h1>Force Login Failed</h1>
              <p class="error">User "${username}" not found.</p>
              <p><a href="/login">Return to login page</a></p>
            </body>
          </html>
        `);
      }
      
      // Print out the user object to see what properties we're getting
      console.log("User data from DB for debugging:", JSON.stringify(user, null, 2));
      
      // Set user ID in session - this is the critical part
      req.session.userId = user.id;
      
      console.log("Force login successful for:", username, "with ID:", user.id);
      
      return res.send(`
        <html>
          <head>
            <title>Force Login Successful</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
              h1 { color: #10b981; }
              .success { color: #10b981; font-weight: bold; }
              .code { background: #f1f5f9; padding: 0.5rem; border-radius: 0.25rem; font-family: monospace; }
              a { color: #4f46e5; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>Force Login Successful</h1>
            <p class="success">You are now logged in as ${username}.</p>
            <p><a href="/my-events">Go to My Events</a></p>
            <p><a href="/">Go to Homepage</a></p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in force login:", error);
      return res.status(500).send(`
        <html>
          <head>
            <title>Force Login Error</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
              h1 { color: #ef4444; }
              .error { color: #ef4444; font-weight: bold; }
              pre { background: #f1f5f9; padding: 1rem; border-radius: 0.25rem; overflow: auto; }
              a { color: #4f46e5; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>Force Login Error</h1>
            <p class="error">An error occurred while trying to force login.</p>
            <pre>${String(error)}</pre>
            <p><a href="/login">Return to login page</a></p>
          </body>
        </html>
      `);
    }
  });
  
  // Apple Sign In notification endpoint
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    try {
      console.log("Received Apple server-to-server notification:", req.body);
      
      // Handle different notification types
      const eventType = req.body.type;
      const subType = req.body.sub_type;
      const userId = req.body.sub; // Apple User ID
      
      switch (eventType) {
        case 'email-disabled':
        case 'email-enabled':
          console.log(`User ${userId} email preferences changed to: ${eventType}`);
          break;
          
        case 'consent-revoked':
          console.log(`User ${userId} revoked consent`);
          // You might want to delete the user's data or mark them as inactive
          break;
          
        case 'account-delete':
          console.log(`User ${userId} deleted their Apple account`);
          // Delete the user's account or mark it as deleted
          break;
          
        default:
          console.log(`Unhandled Apple notification type: ${eventType}`);
      }
      
      // Always return 200 to acknowledge receipt
      return res.status(200).send();
    } catch (error) {
      console.error("Error processing Apple notification:", error);
      // Still return 200 to prevent Apple from retrying
      return res.status(200).send();
    }
  });
  
  // Create a test user with known credentials
  // Removed duplicate endpoint - using the subourbon one below
  
  // Debug endpoint to check login credentials
  app.get("/api/debug/check-login/:username/:password", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.params;
      console.log("Checking credentials for:", username);
      
      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (!user) {
        console.log("User not found:", username);
        return res.json({ 
          success: false, 
          message: "User not found",
          username
        });
      }
      
      // Check if password matches
      console.log("Password check:", {
        storedPassword: user.password,
        providedPassword: password,
        matches: user.password === password
      });
      
      if (user.password !== password) {
        return res.json({ 
          success: false, 
          message: "Password incorrect",
          username
        });
      }
      
      return res.json({ 
        success: true, 
        message: "Login credentials valid",
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      });
    } catch (error) {
      console.error("Error checking credentials:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error",
        error: String(error)
      });
    }
  });
  
  // Special endpoint just for creating the test user
  app.get("/api/create-test-user", async (_req: Request, res: Response) => {
    try {
      // Check if the test user already exists - use raw SQL for reliable column names
      const result = await db.execute(sql`
        SELECT * FROM users WHERE username = 'subourbon'
      `);
      
      const existingUser = result.rows && result.rows.length > 0 ? result.rows[0] : null;
      
      if (existingUser) {
        console.log("Test user already exists:", {
          id: existingUser.id,
          username: existingUser.username,
          password: existingUser.password
        });
        
        return res.send(`
          <html>
            <head>
              <title>Test User Already Exists</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
                h1 { color: #4f46e5; }
                .warning { color: #f59e0b; font-weight: bold; }
                .code { background: #f1f5f9; padding: 0.5rem; border-radius: 0.25rem; font-family: monospace; }
                a { color: #4f46e5; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <h1>Test User Already Exists</h1>
              <p class="warning">The test user already exists in the database.</p>
              <p>You can login with the following credentials:</p>
              <p><strong>Username:</strong> <span class="code">subourbon</span></p>
              <p><strong>Password:</strong> <span class="code">events</span></p>
              <p><a href="/login">Go to login page</a></p>
            </body>
          </html>
        `);
      }
      
      // Create a new test user with SQL to avoid column mapping issues
      console.log("Creating test user 'subourbon'");
      const userId = "subourbon_" + Date.now();
      
      // Use raw SQL to avoid type errors
      await db.execute(sql`
        INSERT INTO users (
          id, username, password, display_name, email,
          is_admin, is_pro, is_premium
        ) VALUES (
          ${userId}, 'subourbon', 'events', 'Sub Ourbon', 'subourbon@example.com',
          true, true, true
        )
      `);
      
      // Fetch the created user with raw SQL
      const userResult = await db.execute(sql`
        SELECT * FROM users WHERE id = ${userId}
      `);
      
      const bourbon = userResult.rows && userResult.rows.length > 0 ? userResult.rows[0] : null;
      
      console.log("Created test user:", bourbon);
      
      return res.send(`
      <html>
        <head>
          <title>Test User Created</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
            h1 { color: #4f46e5; }
            .success { color: #10b981; font-weight: bold; }
            .code { background: #f1f5f9; padding: 0.5rem; border-radius: 0.25rem; font-family: monospace; }
            a { color: #4f46e5; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Test User Created Successfully</h1>
          <p class="success">The test user has been created and is ready to use.</p>
          <p>Login with the following credentials:</p>
          <p><strong>Username:</strong> <span class="code">subourbon</span></p>
          <p><strong>Password:</strong> <span class="code">events</span></p>
          <p><a href="/login">Go to login page</a></p>
        </body>
      </html>
      `);
    } catch (error) {
      console.error("Error creating test user:", error);
      return res.status(500).send(`Error creating test user: ${error}`);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}