import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (including LinkedIn OAuth)
  setupAuth(app);
  
  // User authentication & session
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password, displayName } = req.body;

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create the new user (password will be hashed by the storage interface)
      const user = await storage.createUser({
        username,
        password,
        displayName,
        isAdmin: false,
        isPro: false,
        isPremium: false,
      });

      // Add user to session
      req.session.userId = user.id;

      // Return user info without password
      return res.status(201).json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        isPro: user.isPro,
        isPremium: user.isPremium,
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Error creating account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Check if user exists & password matches
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Add user to session
      req.session.userId = user.id;

      // Return user info without password
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        isPro: user.isPro,
        isPremium: user.isPremium,
        brandTheme: user.brandTheme,
        logoUrl: user.logoUrl,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Error during login" });
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

  app.get(
    "/api/auth/me",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!; // Non-null assertion (we know it exists because of isAuthenticated)
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Return user info without password
        return res.json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          isPro: user.isPro,
          isPremium: user.isPremium,
          brandTheme: user.brandTheme,
          logoUrl: user.logoUrl,
        });
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
      const user = await storage.getUser(parseInt(req.params.id));
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
        
        const { displayName, password } = req.body;
        
        // Update user
        const updatedUser = await storage.updateUser(userId, {
          displayName,
          password,
        });
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Return user without password
        return res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          isAdmin: updatedUser.isAdmin,
          isPro: updatedUser.isPro,
          isPremium: updatedUser.isPremium,
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
          brandTheme,
          logoUrl,
        });
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Return updated branding info
        return res.json({
          brandTheme: updatedUser.brandTheme,
          logoUrl: updatedUser.logoUrl,
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
          displayName: user.displayName,
          isAdmin: user.isAdmin
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
      const updatedUser = await storage.updateUser(user.id, { isPremium: true, isPro: true });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        message: `User ${username} is now a premium member`, 
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          isPro: updatedUser.isPro,
          isPremium: updatedUser.isPremium
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
      const updatedUser = await storage.updateUser(user.id, { isPro: true, isPremium: false });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        message: `User ${username} is now a pro member`, 
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          isPro: updatedUser.isPro,
          isPremium: updatedUser.isPremium
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
      const updatedUser = await storage.updateUser(user.id, { isPro: false, isPremium: false });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        message: `User ${username} is now a free user`, 
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          isPro: updatedUser.isPro,
          isPremium: updatedUser.isPremium
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
      const host = await storage.getUser(event.hostId);
      
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
        hostDisplayName: host?.displayName || "Event Host",
        hostBranding: host?.isPremium ? {
          logoUrl: host.logoUrl,
          brandTheme: host.brandTheme
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
      
      if (!currentUser.linkedinId || !currentUser.linkedinAccessToken || !currentUser.linkedinConnections) {
        return res.status(400).json({ message: "LinkedIn not connected or no connections available" });
      }
      
      // Get all responses to the event
      const responses = await storage.getResponsesByEvent(eventId);
      
      // Get the user IDs of all attendees who have responded "yup"
      const attendeeIds = responses
        .filter(response => response.response === "yup")
        .map(response => response.userId)
        .filter((id): id is number => id !== null);
      
      // Get the users who are attending
      const attendees = await Promise.all(
        attendeeIds.map(id => storage.getUser(id))
      );
      
      // Parse the current user's LinkedIn connections
      const myConnections = JSON.parse(currentUser.linkedinConnections);
      
      // Filter for attendees with LinkedIn IDs and check if they're connected
      const connections = attendees
        .filter(user => user && user.linkedinId)
        .map(user => ({
          id: user!.id,
          displayName: user!.displayName,
          linkedinId: user!.linkedinId!,
          linkedinProfileUrl: user!.linkedinProfileUrl || `https://www.linkedin.com/in/${user!.linkedinId}`,
          isConnected: myConnections.includes(user!.linkedinId)
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
        hostDisplayName: host?.displayName || "Event Host",
        hostBranding: host?.isPremium ? {
          logoUrl: host.logoUrl,
          brandTheme: host.brandTheme
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
        
        if (!user.stripeCustomerId) {
          return res.status(400).json({ message: 'No Stripe customer ID found for this user' });
        }
        
        const session = await createCustomerPortalSession(user.stripeCustomerId);
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
                  await storage.updateUser(user.id, { isPremium: true, isPro: true });
                } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                  await storage.updateUser(user.id, { isPro: true, isPremium: false });
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
              await storage.updateUser(user.id, { isPremium: true, isPro: true });
            } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              await storage.updateUser(user.id, { isPro: true, isPremium: false });
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
            await storage.updateUser(user.id, { isPro: false, isPremium: false });
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

  const httpServer = createServer(app);

  return httpServer;
}