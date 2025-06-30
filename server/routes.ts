import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // API routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to get events", details: String(error) });
    }
  });

  // Get my events (current user's events)
  app.get("/api/events/my-events", async (req: Request, res: Response) => {
    try {
      // For now, return all events since we don't have session management
      // In a real app, this would filter by the current user's ID
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching my events:", error);
      res.status(500).json({ error: "Failed to get my events", details: String(error) });
    }
  });

  // Get invited events (events user is invited to)
  app.get("/api/events/invited", async (req: Request, res: Response) => {
    try {
      // For now, return a subset of events to simulate invited events
      // In a real app, this would query the invitations table
      const allEvents = await storage.getAllEvents();
      // Return first event as an example of invited events
      const invitedEvents = allEvents.slice(0, 1);
      res.json(invitedEvents);
    } catch (error) {
      console.error("Error fetching invited events:", error);
      res.status(500).json({ error: "Failed to get invited events", details: String(error) });
    }
  });

  // Get event by slug
  app.get("/api/events/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      // Try to get by slug first
      const event = await storage.getEventBySlug(slug);
      if (event) {
        return res.json(event);
      }
      
      // If not found by slug, try by numeric ID (for backward compatibility)
      const eventId = parseInt(slug);
      if (!isNaN(eventId)) {
        const eventById = await storage.getEvent(eventId);
        if (eventById) {
          return res.json(eventById);
        }
      }
      
      return res.status(404).json({ error: "Event not found" });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to get event", details: String(error) });
    }
  });

  app.post("/api/events", express.json(), async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const newEvent = await storage.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event", details: String(error) });
    }
  });

  // Update event by ID
  app.put("/api/events/:id", express.json(), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const eventData = req.body;
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event", details: String(error) });
    }
  });

  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const userCount = await storage.getUserCount();
      res.json({ count: userCount });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to get users", details: String(error) });
    }
  });

  // Get responses endpoint
  app.get("/api/responses", async (req: Request, res: Response) => {
    try {
      // Return empty responses for now since we don't have session management
      res.json({});
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ error: "Failed to get responses", details: String(error) });
    }
  });

  // Event RSVP endpoints
  app.post("/api/events/:id/respond", express.json(), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const { response, userId } = req.body;
      
      const responseData = {
        event_id: eventId,
        user_id: userId,
        response_type: response,
        is_guest: false,
        guest_name: null,
        guest_email: null,
        guest_count: 1
      };

      const newResponse = await storage.createResponse(responseData);
      res.status(201).json(newResponse);
    } catch (error) {
      console.error("Error creating response:", error);
      res.status(500).json({ error: "Failed to create response", details: String(error) });
    }
  });

  // Get user's response for an event
  app.get("/api/events/:id/users/:userId/response", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.params.userId;
      
      const response = await storage.getUserEventResponse(eventId, userId);
      if (!response) {
        return res.status(404).json({ error: "Response not found" });
      }
      res.json(response);
    } catch (error) {
      console.error("Error fetching user response:", error);
      res.status(500).json({ error: "Failed to get user response", details: String(error) });
    }
  });

  // Get response counts for an event
  app.get("/api/events/:id/responses/count", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const counts = await storage.getEventResponses(eventId);
      res.json(counts);
    } catch (error) {
      console.error("Error fetching response counts:", error);
      res.status(500).json({ error: "Failed to get response counts", details: String(error) });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", express.json(), async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Simple authentication for demo - check against known users
      if (username === "bob" && password === "events") {
        const user = {
          id: "bob-premium",
          username: "bob",
          display_name: "Bob Premium",
          is_premium: true,
          brand_theme: "cyan"
        };
        
        // Store user in session
        (req as any).session = (req as any).session || {};
        (req as any).session.user = user;
        
        return res.json({ 
          success: true, 
          user,
          message: "Login successful" 
        });
      }

      if (username === "subourbon" && password === "events") {
        const user = {
          id: "subourbon-admin",
          username: "subourbon",
          display_name: "Subourbon Admin",
          is_premium: true,
          is_admin: true,
          brand_theme: "#84793d"
        };
        
        // Store user in session
        (req as any).session = (req as any).session || {};
        (req as any).session.user = user;
        
        return res.json({ 
          success: true, 
          user,
          message: "Login successful" 
        });
      }

      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", (req: Request, res: Response) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        return res.json(user);
      }
      return res.status(401).json({ error: "Not authenticated" });
    } catch (error) {
      console.error("Auth check error:", error);
      return res.status(500).json({ error: "Authentication check failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      (req as any).session = null;
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}