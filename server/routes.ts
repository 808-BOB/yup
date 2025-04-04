import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEventSchema, 
  insertResponseSchema,
  insertUserSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { v4 as uuidv4 } from "uuid";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Event routes
  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      let eventData = insertEventSchema.parse(req.body);
      
      // Generate a URL-friendly slug
      const baseSlug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      eventData = {
        ...eventData,
        slug: `${baseSlug}-${uuidv4().slice(0, 8)}`
      };
      
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
      
      // Verify the user exists
      const user = await storage.getUser(responseData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
