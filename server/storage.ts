import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import {
  users,
  type User,
  type InsertUser,
  type UpsertUser,
  events,
  type Event,
  type InsertEvent,
  responses,
  type Response,
  type InsertResponse,
  invitations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import { SupabaseStorage } from "./supabaseStorage";

export interface IStorage {
  // Invitation operations
  createInvitation(eventId: number, userId: string): Promise<void>;
  getEventInvitations(eventId: number): Promise<string[]>;
  getEventsUserInvitedTo(userId: string): Promise<Event[]>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByLinkedInId(linkedin_id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  updateUserBranding(id: string, brandData: { brand_theme?: string, logo_url?: string }): Promise<User | undefined>;
  updateUserLinkedIn(id: string, linkedinData: { 
    linkedin_id?: string, 
    linkedin_access_token?: string, 
    linkedin_profile_url?: string, 
    linkedin_connections?: string 
  }): Promise<User | undefined>;
  
  // Stripe-related operations
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeData: { 
    stripe_customer_id?: string, 
    stripe_subscription_id?: string 
  }): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;

  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(
    id: number,
    eventUpdate: Partial<InsertEvent>,
  ): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getUserEvents(userId: number): Promise<Event[]>;
  getEventsUserInvitedTo(userId: number): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;

  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByEvent(eventId: number): Promise<Response[]>;
  getUserEventResponse(
    eventId: number,
    userId: number | null,
  ): Promise<Response | undefined>;
  getEventResponses(
    eventId: number,
  ): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }>;
  getResponseById(id: number): Promise<Response | undefined>;
  updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined>;
  deleteResponse(id: number): Promise<void>;

  // Count operations for admin metrics
  getUserCount(): Promise<number>;
  getEventCount(): Promise<number>;
  getResponseCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<number, Event>;
  private responses: Map<number, Response>;
  private userIdCounter: number;
  private eventIdCounter: number;
  private responseIdCounter: number;
  private dataFilePath = path.join(process.cwd(), "data", "storage.json");

  constructor() {
    // Initialize with empty maps
    this.users = new Map();
    this.events = new Map();
    this.responses = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.responseIdCounter = 1;

    // Try to load data from file
    this.loadFromFile();

    // If no data was loaded (new installation), create sample data
    if (this.users.size === 0) {
      this.initializeSampleData();
    }
  }

  private loadFromFile(): void {
    try {
      // Ensure the data directory exists
      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Check if the data file exists
      if (!fs.existsSync(this.dataFilePath)) {
        console.log("No storage file found. Creating new data.");
        return;
      }

      // Read and parse data
      const rawData = fs.readFileSync(this.dataFilePath, "utf8");
      const data = JSON.parse(rawData);

      // Load users
      if (data.users && Array.isArray(data.users)) {
        this.users = new Map(data.users.map((user: User) => [user.id, user]));
      }

      // Load events
      if (data.events && Array.isArray(data.events)) {
        this.events = new Map(
          data.events.map((event: Event) => {
            // Convert string dates back to Date objects
            if (typeof event.createdAt === "string") {
              event.createdAt = new Date(event.createdAt);
            }
            return [event.id, event];
          }),
        );
      }

      // Load responses
      if (data.responses && Array.isArray(data.responses)) {
        this.responses = new Map(
          data.responses.map((response: Response) => {
            // Convert string dates back to Date objects
            if (typeof response.createdAt === "string") {
              response.createdAt = new Date(response.createdAt);
            }
            return [response.id, response];
          }),
        );
      }

      // Set counters to the max ID + 1
      this.userIdCounter = Math.max(0, ...Array.from(this.users.keys())) + 1;
      this.eventIdCounter = Math.max(0, ...Array.from(this.events.keys())) + 1;
      this.responseIdCounter =
        Math.max(0, ...Array.from(this.responses.keys())) + 1;

      console.log(
        `Loaded data: ${this.users.size} users, ${this.events.size} events, ${this.responses.size} responses`,
      );
    } catch (error) {
      console.error("Error loading data from file:", error);
      // Initialize with empty state
      this.users = new Map();
      this.events = new Map();
      this.responses = new Map();
      this.userIdCounter = 1;
      this.eventIdCounter = 1;
      this.responseIdCounter = 1;
    }
  }

  private saveToFile(): void {
    try {
      const data = {
        users: Array.from(this.users.values()),
        events: Array.from(this.events.values()),
        responses: Array.from(this.responses.values()),
      };

      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(
        this.dataFilePath,
        JSON.stringify(data, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("Error saving data to file:", error);
    }
  }

  private initializeSampleData(): void {
    this.users = new Map();
    this.events = new Map();
    this.responses = new Map();

    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.responseIdCounter = 1;

    // Create initial admin user with proper ID
    this.users.set(1, {
      id: "1",
      username: "admin",
      password: "password",
      display_name: "Admin",
      email: null,
      phone_number: null,
      reset_token: null,
      reset_token_expiry: null,
      created_at: new Date(),
      is_admin: false,
      is_premium: false,
      brand_theme: null,
      logo_url: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_profile_url: null,
      linkedin_connections: null
    });

    // Create subourbon admin user with proper ID
    this.users.set(2, {
      id: "2",
      username: "subourbon",
      password: "events",
      display_name: "Subourbon Admin",
      email: null,
      phone_number: null,
      reset_token: null,
      reset_token_expiry: null,
      created_at: new Date(),
      is_admin: true,
      is_premium: true,
      brand_theme: "#84793d",
      logo_url: "https://example.com/subourbon-logo.png",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_profile_url: null,
      linkedin_connections: null
    });

    this.userIdCounter = 3;

    // Add sample responses after creating users and events
    this.createResponse({ eventId: 1, userId: 1, response: "yup" });
    this.createResponse({ eventId: 1, userId: 2, response: "yup" });
    this.createResponse({ eventId: 1, userId: 3, response: "nope" });
    this.createResponse({ eventId: 1, userId: 4, response: "yup" });
    this.createResponse({ eventId: 2, userId: 1, response: "nope" });
    this.createResponse({ eventId: 2, userId: 2, response: "yup" });
    this.createResponse({ eventId: 3, userId: 2, response: "nope" });
    this.createResponse({ eventId: 3, userId: 3, response: "yup" });

    // Add sample events
    this.events.set(1, {
      id: 1,
      imageUrl: "https://picsum.photos/800/400",
      title: "Summer Coding Meetup",
      date: "2024-07-15",
      startTime: "14:00",
      endTime: "17:00",
      location: "Tech Hub",
      address: "123 Coding Street",
      description: "Join us for a summer of coding!",
      hostId: 1,
      status: "open",
      createdAt: new Date(),
      slug: "summer-coding-meetup-abc123",
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 3,
    });

    this.events.set(2, {
      id: 2,
      imageUrl: "https://picsum.photos/800/400?2",
      title: "Gaming Night",
      date: "2024-06-20",
      startTime: "19:00",
      endTime: "23:00",
      location: "Game Center",
      address: "456 Gaming Avenue",
      description: "Epic gaming session with friends",
      hostId: 1,
      status: "open",
      createdAt: new Date(),
      slug: "gaming-night-def456",
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 2,
    });

    // Add a second user as event host
    this.users.set(2, {
      id: 2,
      username: "host",
      password: "password",
      displayName: "Event Host",
    });

    // Add some events hosted by user 2 that user 1 is invited to
    this.events.set(3, {
      id: 3,
      imageUrl: "https://picsum.photos/800/400?3",
      title: "Tech Conference 2024",
      date: "2024-03-15",
      startTime: "09:00",
      endTime: "17:00",
      location: "Convention Center",
      address: "789 Tech Blvd",
      description: "Annual tech conference featuring the latest innovations",
      hostId: 2,
      status: "open",
      createdAt: new Date(),
      slug: "tech-conference-2024",
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 5,
    });

    this.events.set(4, {
      id: 4,
      imageUrl: "https://picsum.photos/800/400?4",
      title: "Networking Mixer",
      date: "2024-02-28",
      startTime: "18:00",
      endTime: "21:00",
      location: "Startup Hub",
      address: "101 Innovation Way",
      description: "Connect with tech professionals over drinks and snacks",
      hostId: 2,
      status: "open",
      createdAt: new Date(),
      slug: "networking-mixer",
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 1,
    });

    this.eventIdCounter = 5;

    // Add a demo user
    this.createUser({
      username: "demo",
      password: "password",
      displayName: "Demo User",
    });

    // Add some demo events
    this.createEvent({
      title: "Summer BBQ Party",
      date: "2023-08-12",
      startTime: "15:00",
      endTime: "20:00",
      location: "Central Park",
      address: "5th Ave & E 72nd St, New York, NY",
      description:
        "Join us for our annual summer BBQ! We'll have food, drinks, games, and music. Bring your family and friends!",
      hostId: 1,
      status: "open",
      slug: "summer-bbq-" + uuidv4().slice(0, 8),
    });

    this.createEvent({
      title: "Team Building Workshop",
      date: "2023-08-18",
      startTime: "13:00",
      endTime: "17:00",
      location: "Office Conference Room",
      address: "123 Business St, Suite 200",
      description:
        "Mandatory team building workshop. We'll discuss goals and strategies for the upcoming quarter.",
      hostId: 1,
      status: "open",
      slug: "team-building-" + uuidv4().slice(0, 8),
    });

    this.createEvent({
      title: "Monthly Book Club",
      date: "2023-08-25",
      startTime: "19:00",
      endTime: "21:00",
      location: "City Library",
      address: "456 Reading Ave",
      description:
        "We'll be discussing 'The Great Gatsby' this month. New members welcome!",
      hostId: 1,
      status: "open",
      slug: "book-club-" + uuidv4().slice(0, 8),
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByLinkedInId(linkedinId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.linkedinId === linkedinId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.saveToFile(); // Save after creating a user
    return user;
  }

  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    // Create an updated user by merging the existing user with the updates
    const updatedUser: User = {
      ...user,
      ...userData,
      // Keep the original id
      id: user.id,
    };

    // Update the user in the map
    this.users.set(id, updatedUser);
    this.saveToFile(); // Save after updating the user

    return updatedUser;
  }
  
  // Helper method to set admin status
  async setAdminStatus(username: string, isAdmin: boolean): Promise<User | undefined> {
    // Find user by username
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return undefined;
    }
    
    return this.updateUser(user.id, { isAdmin });
  }

  // Update user branding settings (for premium users)
  async updateUserBranding(id: string, brandData: { brand_theme?: string, logo_url?: string }): Promise<User | undefined> {
    // Find user by string ID
    const user = Array.from(this.users.values()).find(u => u.id === id);
    if (!user) return undefined;

    // For subourbon account, bypass premium check
    const isSubourbonAccount = user.username === 'subourbon';
    if (!user.is_premium && !isSubourbonAccount) {
      return user;
    }

    // Create an updated user with branding data (using snake_case DB field names)
    const updatedUser: User = {
      ...user,
      brand_theme: brandData.brand_theme || user.brand_theme,
      logo_url: brandData.logo_url !== undefined ? brandData.logo_url : user.logo_url,
    };

    // Update the user in the map using the numeric key
    const numericId = parseInt(id);
    this.users.set(numericId, updatedUser);
    this.saveToFile(); // Save after updating the user

    return updatedUser;
  }
  
  // Stripe-related operations
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId
    };
    
    this.users.set(userId, updatedUser);
    this.saveToFile();
    return updatedUser;
  }
  
  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeSubscriptionId: subscriptionId
    };
    
    this.users.set(userId, updatedUser);
    this.saveToFile();
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeData: { 
    stripeCustomerId?: string, 
    stripeSubscriptionId?: string 
  }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: stripeData.stripeCustomerId !== undefined ? stripeData.stripeCustomerId : user.stripeCustomerId,
      stripeSubscriptionId: stripeData.stripeSubscriptionId !== undefined ? stripeData.stripeSubscriptionId : user.stripeSubscriptionId
    };
    
    this.users.set(userId, updatedUser);
    this.saveToFile();
    return updatedUser;
  }
  
  async updateUserLinkedIn(id: number, linkedinData: { 
    linkedinId?: string, 
    linkedinAccessToken?: string, 
    linkedinProfileUrl?: string, 
    linkedinConnections?: string 
  }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      linkedinId: linkedinData.linkedinId !== undefined ? linkedinData.linkedinId : user.linkedinId,
      linkedinAccessToken: linkedinData.linkedinAccessToken !== undefined ? linkedinData.linkedinAccessToken : user.linkedinAccessToken,
      linkedinProfileUrl: linkedinData.linkedinProfileUrl !== undefined ? linkedinData.linkedinProfileUrl : user.linkedinProfileUrl,
      linkedinConnections: linkedinData.linkedinConnections !== undefined ? linkedinData.linkedinConnections : user.linkedinConnections
    };
    
    this.users.set(id, updatedUser);
    this.saveToFile();
    return updatedUser;
  }
  
  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeCustomerId === customerId
    );
  }

  // Event operations
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const createdAt = new Date();

    // Create event with proper defaults for nullable fields
    const event: Event = {
      id,
      createdAt,
      title: insertEvent.title,
      date: insertEvent.date,
      startTime: insertEvent.startTime,
      endTime: insertEvent.endTime,
      location: insertEvent.location,
      hostId: insertEvent.hostId,
      slug: insertEvent.slug,
      status: insertEvent.status || "open",
      address: insertEvent.address === undefined ? null : insertEvent.address,
      description:
        insertEvent.description === undefined ? null : insertEvent.description,
      imageUrl: insertEvent.imageUrl || null,
      allowGuestRsvp: insertEvent.allowGuestRsvp ?? true,
      allowPlusOne: insertEvent.allowPlusOne ?? true,
      maxGuestsPerRsvp: insertEvent.maxGuestsPerRsvp ?? 3,
    };

    this.events.set(id, event);
    this.saveToFile(); // Save after creating an event
    return event;
  }

  async updateEvent(
    id: number,
    eventUpdate: Partial<InsertEvent>,
  ): Promise<Event | undefined> {
    // Get the existing event
    const existingEvent = this.events.get(id);

    if (!existingEvent) {
      return undefined;
    }

    // Create an updated event by merging the existing event with the updates
    const updatedEvent: Event = {
      ...existingEvent,
      ...eventUpdate,
      // Keep the original id and createdAt
      id: existingEvent.id,
      createdAt: existingEvent.createdAt,
      // Handle nullable fields (don't override with undefined)
      address:
        eventUpdate.address === undefined
          ? existingEvent.address
          : eventUpdate.address,
      description:
        eventUpdate.description === undefined
          ? existingEvent.description
          : eventUpdate.description,
      imageUrl:
        eventUpdate.imageUrl === undefined
          ? existingEvent.imageUrl
          : eventUpdate.imageUrl,
      allowGuestRsvp:
        eventUpdate.allowGuestRsvp ?? existingEvent.allowGuestRsvp,
      allowPlusOne: eventUpdate.allowPlusOne ?? existingEvent.allowPlusOne,
      maxGuestsPerRsvp:
        eventUpdate.maxGuestsPerRsvp ?? existingEvent.maxGuestsPerRsvp,
    };

    // Update the event in the map
    this.events.set(id, updatedEvent);
    this.saveToFile(); // Save after updating an event

    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) {
      return false;
    }

    // Delete all responses for this event
    const responsesToDelete = Array.from(this.responses.entries())
      .filter(([_, response]) => response.eventId === id)
      .map(([responseId, _]) => responseId);
    
    responsesToDelete.forEach(responseId => {
      this.responses.delete(responseId);
    });

    // Delete the event
    this.events.delete(id);
    this.saveToFile(); // Save after deleting
    return true;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    return Array.from(this.events.values()).find(
      (event) => event.slug === slug,
    );
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.hostId === userId,
    );
  }

  private invitations: Map<
    number,
    { id: number; eventId: number; userId: number; status: string }
  > = new Map();
  private invitationIdCounter: number = 0;

  async createInvitation(eventId: number, userId: number): Promise<void> {
    const id = this.invitationIdCounter++;
    this.invitations.set(id, {
      id,
      eventId,
      userId,
      status: "pending",
    });
    this.saveToFile();
  }

  async getEventInvitations(eventId: number): Promise<number[]> {
    return Array.from(this.invitations.values())
      .filter((inv) => inv.eventId === eventId)
      .map((inv) => inv.userId);
  }

  async getEventsUserInvitedTo(userId: number): Promise<Event[]> {
    try {
      const userInvitations = Array.from(this.invitations.values())
        .filter((inv) => inv.userId === userId)
        .map((inv) => inv.eventId);

      return Array.from(this.events.values()).filter((event) =>
        userInvitations.includes(event.id),
      );
    } catch (error) {
      console.error("Error fetching user invites:", error);
      return [];
    }
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  // Response operations
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = this.responseIdCounter++;
    const createdAt = new Date();

    // Set default values for new fields
    const response: Response = {
      ...insertResponse,
      id,
      createdAt,
      userId: insertResponse.userId || null,
      isGuest: insertResponse.isGuest || false,
      guestName: insertResponse.guestName || null,
      guestEmail: insertResponse.guestEmail || null,
      guestCount: insertResponse.guestCount || 0,
    };

    // For guest responses, check if they already responded by email
    if (response.isGuest && response.guestEmail) {
      const existingGuestResponse = Array.from(this.responses.values()).find(
        r => r.eventId === response.eventId && 
            r.isGuest && 
            r.guestEmail === response.guestEmail
      );

      if (existingGuestResponse) {
        // Update existing response
        this.responses.delete(existingGuestResponse.id);
      }
    }
    // For logged in users, check by userId
    else if (response.userId) {
      const existingResponse = await this.getUserEventResponse(
        insertResponse.eventId,
        response.userId,
      );

      if (existingResponse) {
        // Update existing response
        this.responses.delete(existingResponse.id);
      }
    }

    this.responses.set(id, response);
    this.saveToFile(); // Save after creating or updating a response
    return response;
  }

  async getResponsesByEvent(eventId: number): Promise<Response[]> {
    return Array.from(this.responses.values()).filter(
      (response) => response.eventId === eventId,
    );
  }

  async getUserEventResponse(
    eventId: number,
    userId: number | null,
  ): Promise<Response | undefined> {
    // If userId is null (not logged in), we want to return undefined as there's no user to check
    if (userId === null) {
      return undefined;
    }

    // Find a response where the eventId matches and the userId matches the provided userId
    return Array.from(this.responses.values()).find(
      (response) => response.eventId === eventId && response.userId === userId,
    );
  }

  async getEventResponses(
    eventId: number,
  ): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }> {
    const responses = await this.getResponsesByEvent(eventId);
    const yupCount = responses.filter((r) => r.response === "yup").length;
    const nopeCount = responses.filter((r) => r.response === "nope").length;
    const maybeCount = responses.filter((r) => r.response === "maybe").length;

    return { yupCount, nopeCount, maybeCount };
  }

  async getResponseById(id: number): Promise<Response | undefined> {
    return this.responses.get(id);
  }

  async updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined> {
    const existingResponse = this.responses.get(id);
    if (!existingResponse) {
      return undefined;
    }

    const updatedResponse: Response = {
      ...existingResponse,
      ...responseUpdate,
    };

    this.responses.set(id, updatedResponse);
    this.saveToFile();
    return updatedResponse;
  }

  async deleteResponse(id: number): Promise<void> {
    this.responses.delete(id);
    this.saveToFile();
  }

  // Count operations for admin metrics
  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getEventCount(): Promise<number> {
    return this.events.size;
  }

  async getResponseCount(): Promise<number> {
    return this.responses.size;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    console.log("Looking for user with ID:", id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    console.log("User lookup result:", user ? "Found" : "Not found");
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log("Looking for user with username:", username);
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      console.log("User by username lookup result:", {
        found: !!user,
        userId: user?.id,
        username: user?.username,
        password: user?.password
      });
      return user || undefined;
    } catch (error) {
      console.error("Error looking up user by username:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByLinkedInId(linkedinId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.linkedinId, linkedinId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserBranding(id: string, brandData: { brandTheme?: string, logoUrl?: string }): Promise<User | undefined> {
    // Convert from camelCase to snake_case for database fields
    const dbBrandData = {
      brand_theme: brandData.brandTheme,
      logo_url: brandData.logoUrl
    };
    
    const [updatedUser] = await db
      .update(users)
      .set(dbBrandData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripe_customer_id: customerId }) // Convert from camelCase to snake_case
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripe_subscription_id: subscriptionId }) // Convert from camelCase to snake_case
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserStripeInfo(userId: string, stripeData: { 
    stripeCustomerId?: string, 
    stripeSubscriptionId?: string 
  }): Promise<User | undefined> {
    // Convert from camelCase to snake_case for database fields
    const dbStripeData = {
      stripe_customer_id: stripeData.stripeCustomerId,
      stripe_subscription_id: stripeData.stripeSubscriptionId
    };
    
    const [updatedUser] = await db
      .update(users)
      .set(dbStripeData)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripe_customer_id, customerId)); // Convert from camelCase to snake_case
    return user || undefined;
  }
  
  async updateUserLinkedIn(id: string, linkedinData: { 
    linkedinId?: string, 
    linkedinAccessToken?: string, 
    linkedinProfileUrl?: string, 
    linkedinConnections?: string 
  }): Promise<User | undefined> {
    // Convert from camelCase to snake_case for database fields
    const dbLinkedinData = {
      linkedin_id: linkedinData.linkedinId,
      linkedin_access_token: linkedinData.linkedinAccessToken,
      linkedin_profile_url: linkedinData.linkedinProfileUrl,
      linkedin_connections: linkedinData.linkedinConnections
    };
    
    const [updatedUser] = await db
      .update(users)
      .set(dbLinkedinData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Generate a slug if one isn't provided
    if (!event.slug) {
      const slug = event.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-') + '-' + uuidv4().slice(0, 8);
      event.slug = slug;
    }

    const [createdEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return createdEvent;
  }

  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(eventUpdate)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    try {
      // First delete all responses associated with this event
      await db.delete(responses).where(eq(responses.eventId, id));
      
      // Then delete all invitations associated with this event
      await db.delete(invitations).where(eq(invitations.eventId, id));
      
      // Finally delete the event itself
      const result = await db.delete(events).where(eq(events.id, id));
      
      // Return true if at least one row was affected
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    return event || undefined;
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.hostId, userId))
      .orderBy(desc(events.date));
  }

  async createInvitation(eventId: number, userId: number): Promise<void> {
    await db.insert(invitations).values({
      eventId,
      userId
    });
  }

  async getEventInvitations(eventId: number): Promise<number[]> {
    const result = await db
      .select({ userId: invitations.userId })
      .from(invitations)
      .where(eq(invitations.eventId, eventId));
    
    return result.map(row => row.userId);
  }

  async getEventsUserInvitedTo(userId: number): Promise<Event[]> {
    // Get all invitations for this user
    const result = await db
      .select({ eventId: invitations.eventId })
      .from(invitations)
      .where(eq(invitations.userId, userId));
    
    if (result.length === 0) return [];
    
    // Get the event IDs from invitations
    const eventIds = result.map(row => row.eventId);
    
    // Fetch all events (we'll filter manually since inArray isn't working)
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.date));
    
    // Filter to only the events the user is invited to
    return allEvents.filter(event => eventIds.includes(event.id));
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      console.log("Database getAllEvents called");
      const result = await db.select().from(events).orderBy(desc(events.date));
      console.log("Database query result:", result.length, "events");
      if (result.length > 0) {
        console.log("First event:", JSON.stringify(result[0], null, 2));
      }
      return result;
    } catch (error) {
      console.error("Database getAllEvents error:", error);
      throw error;
    }
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    // Check if there's an existing response
    if (response.userId) {
      const [existingResponse] = await db
        .select()
        .from(responses)
        .where(
          and(
            eq(responses.eventId, response.eventId),
            eq(responses.userId, response.userId)
          )
        );
      
      // If there's an existing response, update it
      if (existingResponse) {
        const [updatedResponse] = await db
          .update(responses)
          .set(response)
          .where(eq(responses.id, existingResponse.id))
          .returning();
        return updatedResponse;
      }
    }
    
    // Otherwise create a new response
    const [createdResponse] = await db
      .insert(responses)
      .values(response)
      .returning();
    return createdResponse;
  }

  async getResponsesByEvent(eventId: number): Promise<Response[]> {
    const results = await db
      .select()
      .from(responses)
      .leftJoin(users, eq(responses.userId, users.id))
      .where(eq(responses.eventId, eventId))
      .orderBy(asc(responses.createdAt));
    
    return results.map(result => ({
      ...result.responses,
      userName: result.users?.display_name || result.responses.guestName || 'Unknown',
      userEmail: result.users?.email || result.responses.guestEmail || '',
      guestCount: result.responses.guestCount || 0,
    })) as Response[];
  }

  async getUserEventResponse(eventId: number, userId: string | null): Promise<Response | undefined> {
    if (!userId) return undefined;
    
    const [response] = await db
      .select()
      .from(responses)
      .where(
        and(
          eq(responses.eventId, eventId),
          eq(responses.userId, userId)
        )
      );
    
    return response || undefined;
  }

  async getEventResponses(eventId: number): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }> {
    const allResponses = await this.getResponsesByEvent(eventId);
    
    // Calculate counts including guest counts for all response types
    const yupResponses = allResponses.filter(r => r.response === 'yup');
    const nopeResponses = allResponses.filter(r => r.response === 'nope');
    const maybeResponses = allResponses.filter(r => r.response === 'maybe');
    
    const calculateTotalCount = (responses: any[]) => {
      return responses.reduce((total, response) => {
        // Add the guest themselves
        let count = 1;
        // Add their plus ones if they have any
        if (response.guestCount && response.guestCount > 0) {
          count += response.guestCount;
        }
        return total + count;
      }, 0);
    };
    
    return {
      yupCount: calculateTotalCount(yupResponses),
      nopeCount: calculateTotalCount(nopeResponses),
      maybeCount: calculateTotalCount(maybeResponses),
    };
  }

  async getResponseById(id: number): Promise<Response | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.id, id));
    return response || undefined;
  }

  async updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined> {
    const [updatedResponse] = await db
      .update(responses)
      .set(responseUpdate)
      .where(eq(responses.id, id))
      .returning();
    return updatedResponse || undefined;
  }

  async deleteResponse(id: number): Promise<void> {
    await db.delete(responses).where(eq(responses.id, id));
  }

  // Count operations for admin metrics
  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result.count;
  }

  async getEventCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(events);
    return result.count;
  }

  async getResponseCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(responses);
    return result.count;
  }
}

// Use Supabase storage implementation exclusively
export const storage = new SupabaseStorage();
