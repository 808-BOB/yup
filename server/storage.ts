import { v4 as uuidv4 } from "uuid";
import { 
  users, type User, type InsertUser, 
  events, type Event, type InsertEvent,
  responses, type Response, type InsertResponse 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getUserEvents(userId: number): Promise<Event[]>;
  getEventsUserInvitedTo(userId: number): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;

  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByEvent(eventId: number): Promise<Response[]>;
  getUserEventResponse(eventId: number, userId: number): Promise<Response | undefined>;
  getEventResponses(eventId: number): Promise<{yupCount: number, nopeCount: number}>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private responses: Map<number, Response>;
  private userIdCounter: number;
  private eventIdCounter: number;
  private responseIdCounter: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.responses = new Map();

    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.responseIdCounter = 1;

    // Add sample responses
    this.createResponse({ eventId: 1, userId: 1, response: 'yup' });
    this.createResponse({ eventId: 1, userId: 2, response: 'yup' });
    this.createResponse({ eventId: 1, userId: 3, response: 'nope' });
    this.createResponse({ eventId: 1, userId: 4, response: 'yup' });
    this.createResponse({ eventId: 2, userId: 1, response: 'nope' });
    this.createResponse({ eventId: 2, userId: 2, response: 'yup' });
    this.createResponse({ eventId: 3, userId: 2, response: 'nope' });
    this.createResponse({ eventId: 3, userId: 3, response: 'yup' });

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
      slug: "summer-coding-meetup-abc123"
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
      slug: "gaming-night-def456"
    });

    // Add a second user as event host
    this.users.set(2, {
      id: 2,
      username: "host",
      password: "password",
      displayName: "Event Host"
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
      slug: "tech-conference-2024"
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
      slug: "networking-mixer"
    });

    this.eventIdCounter = 5;

    // Add a demo user
    this.createUser({
      username: "demo",
      password: "password",
      displayName: "Demo User"
    });

    // Add some demo events
    this.createEvent({
      title: "Summer BBQ Party",
      date: "2023-08-12",
      startTime: "15:00",
      endTime: "20:00",
      location: "Central Park",
      address: "5th Ave & E 72nd St, New York, NY",
      description: "Join us for our annual summer BBQ! We'll have food, drinks, games, and music. Bring your family and friends!",
      hostId: 1,
      status: "open",
      slug: "summer-bbq-" + uuidv4().slice(0, 8)
    });

    this.createEvent({
      title: "Team Building Workshop",
      date: "2023-08-18",
      startTime: "13:00",
      endTime: "17:00",
      location: "Office Conference Room",
      address: "123 Business St, Suite 200",
      description: "Mandatory team building workshop. We'll discuss goals and strategies for the upcoming quarter.",
      hostId: 1,
      status: "open",
      slug: "team-building-" + uuidv4().slice(0, 8)
    });

    this.createEvent({
      title: "Monthly Book Club",
      date: "2023-08-25",
      startTime: "19:00",
      endTime: "21:00",
      location: "City Library",
      address: "456 Reading Ave",
      description: "We'll be discussing 'The Great Gatsby' this month. New members welcome!",
      hostId: 1,
      status: "open",
      slug: "book-club-" + uuidv4().slice(0, 8)
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
      description: insertEvent.description === undefined ? null : insertEvent.description
    };

    this.events.set(id, event);
    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    return Array.from(this.events.values()).find(
      (event) => event.slug === slug
    );
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.hostId === userId
    );
  }

  async getEventsUserInvitedTo(userId: number): Promise<Event[]> {
    // In a real app, we'd have an invitation system
    // For this demo, we'll just return all events not created by the user
    return Array.from(this.events.values()).filter(
      (event) => event.hostId !== userId
    );
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  // Response operations
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = this.responseIdCounter++;
    const createdAt = new Date();
    const response: Response = { ...insertResponse, id, createdAt };

    // Check if user already responded to this event
    const existingResponse = await this.getUserEventResponse(
      insertResponse.eventId,
      insertResponse.userId
    );

    if (existingResponse) {
      // Update existing response
      this.responses.delete(existingResponse.id);
    }

    this.responses.set(id, response);
    return response;
  }

  async getResponsesByEvent(eventId: number): Promise<Response[]> {
    return Array.from(this.responses.values()).filter(
      (response) => response.eventId === eventId
    );
  }

  async getUserEventResponse(eventId: number, userId: number): Promise<Response | undefined> {
    return Array.from(this.responses.values()).find(
      (response) => response.eventId === eventId && response.userId === userId
    );
  }

  async getEventResponses(eventId: number): Promise<{yupCount: number, nopeCount: number}> {
    const responses = await this.getResponsesByEvent(eventId);
    const yupCount = responses.filter(r => r.response === 'yup').length;
    const nopeCount = responses.filter(r => r.response === 'nope').length;

    return { yupCount, nopeCount };
  }
}

export const storage = new MemStorage();