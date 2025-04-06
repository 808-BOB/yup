import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEventSchema, 
  insertResponseSchema,
  insertUserSchema,
  guestResponseSchema
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
        displayName: newUser.displayName 
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
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Store user ID in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName 
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

  app.get("/api/auth/me", isAuthenticated, async (req: Request, res: Response) => {
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
        displayName: user.displayName 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

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
      res.status(201).json({ id: newUser.id, username: newUser.username, displayName: newUser.displayName });
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
      
      res.json({ id: user.id, username: user.username, displayName: user.displayName });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  app.put("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own profile
      if (req.session!.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this user" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { displayName, currentPassword, newPassword } = req.body;
      
      // Validate the data
      if (!displayName || displayName.trim() === '') {
        return res.status(400).json({ message: "Display name is required" });
      }
      
      // Create the updates object
      const updates: Partial<typeof user> = { displayName };
      
      // Handle password change if requested
      if (newPassword) {
        // Check if current password matches
        if (!currentPassword || currentPassword !== user.password) {
          return res.status(400).json({ message: "Current password is incorrect" });
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
  });

  // Event routes
  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        slug: `${req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 8)}`
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
        return res.status(403).json({ message: "You don't have permission to update this event" });
      }
      
      // Validate the event update data - using the base event data for simplicity
      const eventUpdateData = req.body;
      
      // Update the event
      const updatedEvent = await storage.updateEvent(eventId, eventUpdateData);
      
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.get("/api/events/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const event = await storage.getEventBySlug(slug);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
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
        return res.status(403).json({ message: "Guest RSVPs are not allowed for this event" });
      }
      
      // Check if the +1 count is within the allowed limit
      if (guestData.guestCount > event.maxGuestsPerRsvp) {
        return res.status(400).json({ 
          message: `Sorry, you can only bring up to ${event.maxGuestsPerRsvp} additional guests` 
        });
      }
      
      // Create a response with isGuest flag
      const responseData = {
        eventId: guestData.eventId,
        response: guestData.response,
        isGuest: true,
        guestName: guestData.guestName,
        guestEmail: guestData.guestEmail,
        guestCount: guestData.guestCount || 0
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

  app.get("/api/events/:eventId/responses", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const responses = await storage.getResponsesByEvent(eventId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.get("/api/events/:eventId/responses/count", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const counts = await storage.getEventResponses(eventId);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch response counts" });
    }
  });

  app.get("/api/events/:eventId/users/:userId/response", async (req: Request, res: Response) => {
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
  });

  const httpServer = createServer(app);
  return httpServer;
}
