import type { User, Event, Response } from "@shared/schema";

// Simplified storage implementation to get the application running
export class SimpleStorage {
  private users: Map<string, User> = new Map();
  private events: Map<number, Event> = new Map();
  private responses: Map<number, Response> = new Map();
  private eventIdCounter = 1;
  private responseIdCounter = 1;
  private savedThemes: Map<string, string> = new Map(); // Store custom themes

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create admin user with Subourbon branding
    const adminUser: User = {
      id: 'subourbon-admin',
      username: 'subourbon',
      password: 'events',
      display_name: 'Subourbon Admin',
      email: null,
      phone_number: null,
      reset_token: null,
      reset_token_expiry: null,
      is_admin: true,
      is_pro: false,
      is_premium: true,
      profile_image_url: null,
      brand_theme: '#84793d',
      logo_url: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_profile_url: null,
      linkedin_connections: null
    };
    this.users.set(adminUser.id, adminUser);

    // Create Bob as premium user with branding - check for saved theme first
    const savedBobTheme = this.savedThemes.get('bob-premium');
    const bobUser: User = {
      id: 'bob-premium',
      username: 'bob',
      password: 'events',
      display_name: 'Bob Premium',
      email: 'bob@example.com',
      phone_number: null,
      reset_token: null,
      reset_token_expiry: null,
      is_admin: false,
      is_pro: true,
      is_premium: true,
      profile_image_url: null,
      brand_theme: savedBobTheme || '{"primary":"hsl(308, 100%, 66%)","background":"hsl(222, 84%, 5%)"}', // Use saved theme or default
      logo_url: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_profile_url: null,
      linkedin_connections: null
    };
    this.users.set(bobUser.id, bobUser);

    // Create sample event
    const sampleEvent: Event = {
      id: 1,
      title: 'Subourbon Launch Event',
      description: 'Join us for the official launch of our premium event platform',
      date: '2025-06-15',
      startTime: '18:00',
      endTime: '22:00',
      location: 'The Grand Ballroom',
      address: '123 Main Street, Downtown',
      hostId: 'subourbon-admin',
      status: 'open',
      slug: 'subourbon-launch-2025',
      imageUrl: null,
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 1,
      capacity: null,
      useCustomRsvpText: false,
      customYupText: null,
      customNopeText: null,
      customMaybeText: null,
      rsvpVisibility: 'public',
      waitlistEnabled: false
    };
    this.events.set(sampleEvent.id, sampleEvent);

    // Create sample responses for dashboard metrics
    const responses = [
      { response: 'yup', count: 8 },
      { response: 'nope', count: 3 },
      { response: 'maybe', count: 4 }
    ];

    let responseId = 1;
    responses.forEach(({ response, count }) => {
      for (let i = 0; i < count; i++) {
        const sampleResponse: Response = {
          id: responseId++,
          eventId: 1,
          userId: `guest-user-${responseId}`,
          response,
          isGuest: false,
          guestName: null,
          guestEmail: null,
          guestCount: 1,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        };
        this.responses.set(sampleResponse.id, sampleResponse);
      }
    });

    this.responseIdCounter = responseId;
    this.eventIdCounter = 2;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async getUserByLinkedInId(linkedin_id: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.linkedin_id === linkedin_id) return user;
    }
    return undefined;
  }

  async createUser(userData: any): Promise<User> {
    const user: User = {
      id: userData.id || `user-${Date.now()}`,
      username: userData.username,
      password: userData.password,
      display_name: userData.display_name,
      email: userData.email || null,
      phone_number: userData.phone_number || null,
      reset_token: null,
      reset_token_expiry: null,
      created_at: new Date(),
      is_admin: userData.is_admin || false,
      is_pro: userData.is_pro || false,
      is_premium: userData.is_premium || false,
      profile_image_url: userData.profile_image_url || null,
      brand_theme: userData.brand_theme || null,
      logo_url: userData.logo_url || null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_profile_url: null,
      linkedin_connections: null
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    }
    return this.createUser(userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    // Save theme data to persistent storage
    if (userData.brand_theme) {
      this.savedThemes.set(id, userData.brand_theme);
    }
    
    return updatedUser;
  }

  async updateUserBranding(id: string, brandData: { brand_theme?: string, logo_url?: string }): Promise<User | undefined> {
    return this.updateUser(id, brandData);
  }

  async updateUserLinkedIn(id: string, linkedinData: any): Promise<User | undefined> {
    return this.updateUser(id, linkedinData);
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripe_customer_id: customerId });
  }

  async updateStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripe_subscription_id: subscriptionId });
  }

  async updateUserStripeInfo(userId: string, stripeData: any): Promise<User | undefined> {
    return this.updateUser(userId, stripeData);
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.stripe_customer_id === customerId) return user;
    }
    return undefined;
  }

  // Event operations
  async createEvent(eventData: any): Promise<Event> {
    const event: Event = {
      id: this.eventIdCounter++,
      ...eventData,
      created_at: new Date()
    };
    this.events.set(event.id, event);
    return event;
  }

  async updateEvent(id: number, eventUpdate: any): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    const updatedEvent = { ...event, ...eventUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    for (const event of this.events.values()) {
      if (event.slug === slug) return event;
    }
    return undefined;
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.host_id === userId);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  // Response operations
  async createResponse(responseData: any): Promise<Response> {
    const response: Response = {
      id: this.responseIdCounter++,
      ...responseData,
      created_at: new Date()
    };
    this.responses.set(response.id, response);
    return response;
  }

  async getResponsesByEvent(eventId: number): Promise<Response[]> {
    return Array.from(this.responses.values()).filter(r => r.event_id === eventId);
  }

  async getUserEventResponse(eventId: number, userId: string | null): Promise<Response | undefined> {
    if (!userId) return undefined;
    for (const response of this.responses.values()) {
      if (response.event_id === eventId && response.user_id === userId) {
        return response;
      }
    }
    return undefined;
  }

  async getEventResponses(eventId: number): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }> {
    const responses = this.getResponsesByEvent(eventId);
    const yupCount = (await responses).filter(r => r.response === 'yup').length;
    const nopeCount = (await responses).filter(r => r.response === 'nope').length;
    const maybeCount = (await responses).filter(r => r.response === 'maybe').length;
    return { yupCount, nopeCount, maybeCount };
  }

  async getResponseById(id: number): Promise<Response | undefined> {
    return this.responses.get(id);
  }

  async updateResponse(id: number, responseUpdate: any): Promise<Response | undefined> {
    const response = this.responses.get(id);
    if (!response) return undefined;
    const updatedResponse = { ...response, ...responseUpdate };
    this.responses.set(id, updatedResponse);
    return updatedResponse;
  }

  async deleteResponse(id: number): Promise<void> {
    this.responses.delete(id);
  }

  // Invitation operations
  async createInvitation(eventId: number, userId: string): Promise<void> {
    // Simplified implementation
  }

  async getEventInvitations(eventId: number): Promise<string[]> {
    return [];
  }

  async getEventsUserInvitedTo(userId: string): Promise<Event[]> {
    return [];
  }

  // Admin metrics
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

export const storage = new SimpleStorage();