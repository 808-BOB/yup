import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertEventSchema,
  insertResponseSchema,
  insertUserSchema,
  guestResponseSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { v4 as uuidv4 } from "uuid";
import session from "express-session";

// Simple middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with cookie options
  app.use(session({
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    },
    secret: process.env.SESSION_SECRET!, //Ensure you have a SESSION_SECRET in your .env
    resave: false,
    saveUninitialized: false
  }));


  // Authentication routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser(userData);

      // Auto-login: store user ID in session
      if (req.session) {
        req.session.userId = newUser.id;
      }

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // Store user ID in session
      if (req.session) {
        req.session.userId = user.id;
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "No active session" });
    }
  });

  app.get(
    "/api/auth/me",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        // The middleware ensures req.session and userId exist
        const userId = Number(req.session!.userId);
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch user data" });
      }
    },
  );

  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser(userData);
      res
        .status(201)
        .json({
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
        });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put(
    "/api/users/:id",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);

        // Only allow users to update their own profile
        if (req.session!.userId !== userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to update this user" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const { displayName, currentPassword, newPassword } = req.body;

        // Validate the data
        if (!displayName || displayName.trim() === "") {
          return res.status(400).json({ message: "Display name is required" });
        }

        // Create the updates object
        const updates: Partial<typeof user> = { displayName };

        // Handle password change if requested
        if (newPassword) {
          // Check if current password matches
          if (!currentPassword || currentPassword !== user.password) {
            return res
              .status(400)
              .json({ message: "Current password is incorrect" });
          }

          // Update the password
          updates.password = newPassword;
        }

        // Update the user
        const updatedUser = await storage.updateUser(userId, updates);

        // Don't return the password to the client
        if (updatedUser) {
          const { password: _, ...userWithoutPassword } = updatedUser;
          res.json(userWithoutPassword);
        } else {
          res.status(500).json({ message: "Failed to update user" });
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to update user" });
      }
    },
  );

  // Event routes
  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        slug: `${req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${uuidv4().slice(0, 8)}`,
      });

      const newEvent = await storage.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get("/api/events", async (_req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const existingEvent = await storage.getEvent(eventId);

      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if the user is the owner of the event
      const userId = req.session?.userId;
      if (!userId || existingEvent.hostId !== userId) {
        return res
          .status(403)
          .json({ message: "You don't have permission to update this event" });
      }

      // Validate the event update data - using the base event data for simplicity
      const eventUpdateData = {
        ...req.body,
        // Ensure imageUrl is explicitly included in the update and validate it's not empty
        imageUrl: req.body.imageUrl && req.body.imageUrl.trim() !== '' ? req.body.imageUrl : null
      };

      // Update the event
      const updatedEvent = await storage.updateEvent(eventId, eventUpdateData);

      // Force a fresh read to verify the update
      const verifiedEvent = await storage.getEvent(eventId);
      console.log('Event updated, image URL status:', verifiedEvent?.imageUrl ? 'present' : 'missing');

      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update event" });
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
      const cocktailImageBase64 = "data:image/jpeg;base64,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";
      
      // Update the event with the image
      const updatedEvent = await storage.updateEvent(event.id, {
        ...event,
        imageUrl: cocktailImageBase64
      });
      
      // Return success with the updated event
      return res.json({
        message: "Image fixed successfully",
        event: updatedEvent
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fix image" });
    }
  });
  
  app.get("/api/events/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const event = await storage.getEventBySlug(slug);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get the host user to include their display name
      const hostUser = await storage.getUser(event.hostId);

      // Add the host display name to the event object
      const eventWithHostInfo = {
        ...event,
        hostDisplayName: hostUser ? hostUser.displayName : "Unknown User",
      };

      res.json(eventWithHostInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.get("/api/users/:userId/events", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const events = await storage.getUserEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });

  app.get("/api/users/:userId/invites", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const events = await storage.getEventsUserInvitedTo(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user invites" });
    }
  });

  // Response routes
  app.post("/api/responses", async (req: Request, res: Response) => {
    try {
      const responseData = insertResponseSchema.parse(req.body);

      // Verify the event exists
      const event = await storage.getEvent(responseData.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verify the user exists if userId is provided
      if (responseData.userId) {
        const user = await storage.getUser(responseData.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }

      const newResponse = await storage.createResponse(responseData);
      res.status(201).json(newResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  // Guest response route - doesn't require a user account
  app.post("/api/guest-responses", async (req: Request, res: Response) => {
    try {
      const guestData = guestResponseSchema.parse(req.body);

      // Verify the event exists
      const event = await storage.getEvent(guestData.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if guest RSVPs are allowed for this event
      if (!event.allowGuestRsvp) {
        return res
          .status(403)
          .json({ message: "Guest RSVPs are not allowed for this event" });
      }

      // Check if the +1 count is within the allowed limit
      if (guestData.guestCount > event.maxGuestsPerRsvp) {
        return res.status(400).json({
          message: `Sorry, you can only bring up to ${event.maxGuestsPerRsvp} additional guests`,
        });
      }

      // Create a response with isGuest flag
      const responseData = {
        eventId: guestData.eventId,
        response: guestData.response,
        isGuest: true,
        guestName: guestData.guestName,
        guestEmail: guestData.guestEmail,
        guestCount: guestData.guestCount || 0,
      };

      const newResponse = await storage.createResponse(responseData);
      res.status(201).json(newResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create guest response" });
    }
  });

  app.get(
    "/api/events/:eventId/responses",
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const responses = await storage.getResponsesByEvent(eventId);
        
        // Enhance responses with user information
        const enhancedResponses = await Promise.all(responses.map(async (response) => {
          if (!response.isGuest && response.userId) {
            const user = await storage.getUser(response.userId);
            return {
              ...response,
              userName: user?.displayName,
              userEmail: user?.username
            };
          }
          return response;
        }));
        
        res.json(enhancedResponses);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch responses" });
      }
    },
  );

  // Invitation endpoints
  app.post(
    "/api/events/:eventId/invitations",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const { userIds } = req.body;

        // Verify the event exists and user is the host
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (event.hostId !== req.session!.userId) {
          return res
            .status(403)
            .json({ message: "Only the event host can send invitations" });
        }

        // Create invitations
        for (const userId of userIds) {
          await storage.createInvitation(eventId, userId);
        }

        res.status(201).json({ message: "Invitations sent successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to send invitations" });
      }
    },
  );

  app.get(
    "/api/events/:eventId/invitations",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const invitedUsers = await storage.getEventInvitations(eventId);
        res.json(invitedUsers);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch invitations" });
      }
    },
  );

  app.get(
    "/api/events/:eventId/responses/count",
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const counts = await storage.getEventResponses(eventId);
        res.json(counts);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch response counts" });
      }
    },
  );
  
  // Get event visibility settings - NEW API endpoint that doesn't require authentication
  app.get(
    "/api/events/:eventId/visibility",
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const event = await storage.getEvent(eventId);
        
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }
        
        // Return only the visibility settings needed for the frontend
        res.json({
          id: event.id,
          hostId: event.hostId,
          showRsvpsToInvitees: event.showRsvpsToInvitees,
          showRsvpsAfterThreshold: event.showRsvpsAfterThreshold,
          rsvpVisibilityThreshold: event.rsvpVisibilityThreshold
        });
      } catch (error) {
        console.error("Error fetching event visibility settings:", error);
        res.status(500).json({ message: "Error fetching event visibility settings" });
      }
    },
  );

  app.get(
    "/api/events/:eventId/users/:userId/response",
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);
        const response = await storage.getUserEventResponse(eventId, userId);

        // Return null if not found (instead of 404) so the frontend can handle it
        if (!response) {
          return res.json(null);
        }

        res.json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch user response" });
      }
    },
  );

    // Get all responses for a user (new endpoint)
  app.get(
    "/api/users/:userId/responses",
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Get all events this user has access to
        const invitedEvents = await storage.getEventsUserInvitedTo(userId);
        const userEvents = await storage.getUserEvents(userId);
        
        // Combine and deduplicate events
        const allEventIds = Array.from(
          new Set([
            ...invitedEvents.map(e => e.id),
            ...userEvents.map(e => e.id)
          ])
        );
        
        // Create a map of eventId -> response
        const responseMap: Record<string, string> = {};
        
        // Get all responses for each event
        await Promise.all(
          allEventIds.map(async (eventId) => {
            const response = await storage.getUserEventResponse(eventId, userId);
            if (response) {
              responseMap[eventId] = response.response;
            }
          })
        );
        
        res.json(responseMap);
      } catch (error) {
        console.error("Error fetching user responses:", error);
        res.status(500).json({ message: "Failed to fetch user responses" });
      }
    },
  );
  
  const httpServer = createServer(app);
  return httpServer;
}