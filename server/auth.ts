import { Request, Response, NextFunction, Express } from "express";
import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { storage } from "./storage";
import session from "express-session";
import { User } from "@shared/schema";

// Configure passport with LinkedIn strategy
export function setupAuth(app: Express) {
  // Session setup
  app.use(
    session({
      secret: "yup-rsvp-secret", // In production, use an environment variable
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // LinkedIn strategy configuration
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID!,
        clientSecret: process.env.LINKEDIN_PRIMARY_CLIENT_SECRET!,
        callbackURL: "https://yup-rsvp.localhost/auth/linkedin/callback",
        scope: ["r_emailaddress", "r_liteprofile"],
        state: true,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Find or create user based on LinkedIn ID
          let user = await storage.getUserByLinkedInId(profile.id);

          if (!user && profile.emails && profile.emails.length > 0) {
            // Try to find user by email if no LinkedIn ID match
            const email = profile.emails[0].value;
            user = await storage.getUserByEmail(email);

            if (user) {
              // Update existing user with LinkedIn info
              user = await storage.updateUserLinkedIn(
                user.id,
                {
                  linkedinId: profile.id,
                  linkedinAccessToken: accessToken,
                  linkedinProfileUrl: profile._json.publicProfileUrl || profile.profileUrl,
                }
              );
            }
          }

          if (!user) {
            // If no user found, create one
            if (!profile.emails || profile.emails.length === 0) {
              return done(null, false, { message: "Email not provided by LinkedIn" });
            }
            
            const email = profile.emails[0].value;
            const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 10000);
            const password = Math.random().toString(36).slice(-12); // Random password

            user = await storage.createUser({
              username,
              password,
              displayName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
              email,
              linkedinId: profile.id,
              linkedinAccessToken: accessToken,
              linkedinProfileUrl: profile._json.publicProfileUrl || profile.profileUrl,
            });
          } else if (user.linkedinAccessToken !== accessToken) {
            // Update token if changed
            user = await storage.updateUserLinkedIn(
              user.id,
              {
                linkedinAccessToken: accessToken,
              }
            );
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize user ID for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session ID
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Route to initiate LinkedIn OAuth
  app.get(
    "/auth/linkedin",
    (req, res, next) => {
      console.log("LinkedIn auth initiated");
      
      // Get base URL for the current environment
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      console.log("Current base URL:", baseUrl);
      console.log("LinkedIn env vars:", {
        client_id_exists: !!process.env.LINKEDIN_CLIENT_ID,
        client_secret_exists: !!process.env.LINKEDIN_PRIMARY_CLIENT_SECRET,
        redirect_uri_exists: !!process.env.LINKEDIN_REDIRECT_URI,
        redirect_uri_length: process.env.LINKEDIN_REDIRECT_URI?.length || 0
      });
      
      // Dynamically update the LinkedIn callback URL based on the current environment
      passport.use(
        new LinkedInStrategy(
          {
            clientID: process.env.LINKEDIN_CLIENT_ID!,
            clientSecret: process.env.LINKEDIN_PRIMARY_CLIENT_SECRET!,
            callbackURL: `${baseUrl}/auth/linkedin/callback`,
            scope: ["r_emailaddress", "r_liteprofile"],
            state: true,
          },
          async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            // The same user lookup/creation logic as before
            try {
              let user = await storage.getUserByLinkedInId(profile.id);

              if (!user && profile.emails && profile.emails.length > 0) {
                const email = profile.emails[0].value;
                user = await storage.getUserByEmail(email);

                if (user) {
                  user = await storage.updateUserLinkedIn(
                    user.id,
                    {
                      linkedinId: profile.id,
                      linkedinAccessToken: accessToken,
                      linkedinProfileUrl: profile._json.publicProfileUrl || profile.profileUrl,
                    }
                  );
                }
              }

              if (!user) {
                if (!profile.emails || profile.emails.length === 0) {
                  return done(null, false, { message: "Email not provided by LinkedIn" });
                }
                
                const email = profile.emails[0].value;
                const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 10000);
                const password = Math.random().toString(36).slice(-12); // Random password

                user = await storage.createUser({
                  username,
                  password,
                  displayName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
                  email,
                  linkedinId: profile.id,
                  linkedinAccessToken: accessToken,
                  linkedinProfileUrl: profile._json.publicProfileUrl || profile.profileUrl,
                });
              } else if (user.linkedinAccessToken !== accessToken) {
                user = await storage.updateUserLinkedIn(
                  user.id,
                  {
                    linkedinAccessToken: accessToken,
                  }
                );
              }

              return done(null, user);
            } catch (err) {
              return done(err);
            }
          }
        )
      );
      
      next();
    },
    passport.authenticate("linkedin")
  );

  // LinkedIn OAuth callback
  app.get(
    "/auth/linkedin/callback",
    (req, res, next) => {
      console.log("LinkedIn callback received");
      next();
    },
    passport.authenticate("linkedin", {
      successRedirect: "/profile",
      failureRedirect: "/login",
      failWithError: true,
    }),
    (err: any, req: Request, res: Response, next: NextFunction) => {
      console.error("LinkedIn authentication error:", err);
      res.redirect('/login');
    }
  );
  
  // API endpoint to fetch user's LinkedIn connections for an event
  app.get(
    "/api/events/:eventId/connections",
    async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Not logged in" });
        }

        const userId = req.session.userId;
        const eventId = parseInt(req.params.eventId);
        
        // Get the current user's LinkedIn info
        const user = await storage.getUser(userId);
        if (!user || !user.linkedinAccessToken) {
          return res.status(403).json({ 
            message: "LinkedIn not connected",
            isConnected: false
          });
        }

        // Get all responses for the event
        const responses = await storage.getResponsesByEvent(eventId);
        
        // Filter for "yup" responses and fetch those users
        const attendeeIds = responses
          .filter(r => r.response === "yup")
          .map(r => r.userId)
          .filter(id => id !== null) as number[];
        
        const attendees = await Promise.all(
          attendeeIds.map(id => storage.getUser(id))
        );
        
        // Filter for attendees with LinkedIn connected
        const linkedInAttendees = attendees
          .filter(user => user && user.linkedinId)
          .map(user => ({
            id: user!.id,
            displayName: user!.displayName,
            linkedinProfileUrl: user!.linkedinProfileUrl,
            linkedinId: user!.linkedinId,
            // We'll determine connection status on the client side to protect privacy
            isConnected: false
          }));
        
        return res.json({
          isConnected: true,
          connections: linkedInAttendees
        });
      } catch (error) {
        console.error("LinkedIn connections error:", error);
        return res.status(500).json({ message: "Failed to get connections" });
      }
    }
  );

  // API endpoint to sync LinkedIn connections data
  app.post(
    "/api/linkedin/sync",
    async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Not logged in" });
        }

        const userId = req.session.userId;
        
        // Get the current user's LinkedIn info
        const user = await storage.getUser(userId);
        if (!user || !user.linkedinAccessToken) {
          return res.status(403).json({ message: "LinkedIn not connected" });
        }

        // In a real implementation, we would make an API call to LinkedIn to fetch 
        // connections and store them in the user's linkedinConnections field
        // For now, we'll just update the lastSynced timestamp
        const updatedUser = await storage.updateUserLinkedIn(
          userId,
          { 
            linkedinConnections: JSON.stringify({
              lastSynced: new Date().toISOString()
            }) 
          }
        );

        return res.json({
          message: "LinkedIn connections synced",
          lastSynced: JSON.parse(updatedUser?.linkedinConnections || '{}').lastSynced
        });
      } catch (error) {
        console.error("LinkedIn sync error:", error);
        return res.status(500).json({ message: "Failed to sync connections" });
      }
    }
  );

  // Expose LinkedIn config information (safely)
  app.get(
    "/api/auth/linkedin/config",
    (req: Request, res: Response) => {
      // Get base URL for the current environment
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      // Create LinkedIn OAuth URL manually
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const redirectUri = `${baseUrl}/auth/linkedin/callback`;
      const scope = "r_emailaddress,r_liteprofile";
      const state = Math.random().toString(36).substring(2);
      
      // Store state in session for verification
      req.session.linkedInState = state;
      
      const authorizeUrl = clientId ? 
        `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}` : 
        null;
      
      res.json({
        baseUrl,
        authorizeUrl,
        clientId: !!process.env.LINKEDIN_CLIENT_ID,
        redirectUri
      });
    }
  );

  // API endpoint to check LinkedIn connection status
  app.get(
    "/api/auth/linkedin/status",
    async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Not logged in" });
        }

        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.linkedinId || !user.linkedinAccessToken) {
          return res.json({ isConnected: false });
        }
        
        return res.json({ 
          isConnected: true,
          profile: {
            id: user.linkedinId,
            displayName: user.displayName,
            linkedinProfileUrl: user.linkedinProfileUrl
          }
        });
      } catch (error) {
        console.error("LinkedIn status error:", error);
        return res.status(500).json({ message: "Failed to get LinkedIn status" });
      }
    }
  );
  
  // Endpoint to disconnect LinkedIn
  app.post(
    "/api/auth/linkedin/disconnect",
    async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Not logged in" });
        }

        const userId = req.session.userId;
        
        await storage.updateUserLinkedIn(userId, {
          linkedinId: undefined,
          linkedinAccessToken: undefined,
          linkedinProfileUrl: undefined,
          linkedinConnections: undefined
        });
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("LinkedIn disconnect error:", error);
        return res.status(500).json({ message: "Failed to disconnect LinkedIn" });
      }
    }
  );

  // Helper middleware to check if user is authenticated
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.isAuthenticated = () => !!req.session.userId;
    next();
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};