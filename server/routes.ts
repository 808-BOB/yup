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

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
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

  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const userCount = await storage.getUserCount();
      res.json({ count: userCount });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to get users", details: String(error) });
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

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}