# Architecture Overview

## Overview

Yup.RSVP is a full-stack event management application that allows users to create, manage, and respond to events. The application follows a client-server architecture with a React frontend and an Express.js backend. The system enables users to create events, send invitations, collect and track RSVPs, and view event analytics. The application also provides premium features for subscribed users including branding customization.

## System Architecture

### High-Level Components

The application follows a modern web application architecture with the following components:

1. **Frontend**: A React-based single-page application (SPA) built with TypeScript and Vite
2. **Backend**: An Express.js server built with TypeScript
3. **Database**: PostgreSQL database accessed via Drizzle ORM
4. **Authentication**: Session-based authentication with express-session
5. **Payment Processing**: Stripe integration for subscription management

### Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   React SPA     │<------->│   Express API   │<------->│   PostgreSQL    │
│   (Frontend)    │         │   (Backend)     │         │   Database      │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        ^                           ^                           ^
        │                           │                           │
        v                           v                           v
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   Shadcn/UI     │         │   Stripe API    │         │   Drizzle ORM   │
│   Components    │         │   (Payments)    │         │   (Data Access) │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Key Components

### Frontend Architecture

The frontend is built with React and TypeScript using Vite as the build tool. The application employs a component-based architecture with React hooks for state management.

**Key Technologies and Libraries:**
- **React**: Core library for building the UI
- **TypeScript**: For type safety across the codebase
- **React Router (Wouter)**: Lightweight router for navigation
- **TanStack React Query**: For data fetching, caching, and synchronization
- **Tailwind CSS**: For styling components
- **Shadcn/UI**: Component library built on top of Radix UI primitives
- **Radix UI**: Accessible component primitives
- **Stripe.js**: For payment integration

**Directory Structure:**
- `/client/src/components`: Reusable UI components
- `/client/src/contexts`: React context providers for global state
- `/client/src/hooks`: Custom React hooks
- `/client/src/lib`: Utility functions and shared logic
- `/client/src/pages`: Top-level page components

**State Management:**
The application uses a combination of:
- React Context for global state (auth, branding)
- React Query for server state
- Local component state for UI-specific state

### Backend Architecture

The backend is built with Express.js and TypeScript, providing RESTful API endpoints for the frontend.

**Key Technologies and Libraries:**
- **Express.js**: Web server framework
- **TypeScript**: For type safety
- **express-session**: For session management
- **Drizzle ORM**: For database access
- **Neon Serverless Postgres**: Cloud-based PostgreSQL database 
- **Stripe API**: For payment processing

**Directory Structure:**
- `/server`: Server code
- `/server/routes.ts`: API route definitions
- `/server/storage.ts`: Data access layer
- `/server/stripe.ts`: Stripe integration

**API Structure:**
The server provides RESTful endpoints for:
- User authentication (signup, login, logout)
- Event management (create, update, read, delete)
- RSVP management (respond, list)
- User profile management
- Payment and subscription management

### Database Schema

The database schema is defined using Drizzle ORM with the following main tables:

1. **Users**:
   - `id`: Primary key
   - `username`: Unique identifier
   - `password`: Hashed password
   - `displayName`: User's display name
   - `email`: User's email address
   - `isAdmin`: Admin status flag
   - `isPro`: Pro subscription status
   - `isPremium`: Premium subscription status
   - `brandTheme`: JSON string for theme preferences
   - `logoUrl`: Custom logo URL for premium users
   - `stripeCustomerId`: Stripe customer ID
   - `stripeSubscriptionId`: Active subscription ID

2. **Events**:
   - `id`: Primary key
   - `imageUrl`: Event image
   - `title`: Event title
   - `date`: Event date
   - `startTime`: Start time
   - `endTime`: End time
   - `location`: Event location
   - `address`: Detailed address
   - `description`: Event description
   - `hostId`: Foreign key to Users
   - `hostDisplayText`: Custom host display name
   - `status`: Event status (open, closed, etc.)
   - `slug`: URL-friendly identifier
   - Fields for controlling guest permissions and visibility

3. **Responses**:
   - Tracks RSVP responses to events
   - Links users to events with their response status

### Authentication and Authorization

The application uses session-based authentication with the following characteristics:

- **Session Storage**: MemoryStore for express-session
- **Session Duration**: 7 days
- **Authentication Flow**:
  1. User signs up or logs in via `/api/auth/signup` or `/api/auth/login`
  2. Server validates credentials and creates a session
  3. Session ID stored in a cookie on the client
  4. Protected routes check for valid session via `isAuthenticated` middleware

**Authorization**: 
- Route middleware validates user permissions
- Premium features are gated based on subscription status

## Data Flow

### Event Creation and RSVP Process

1. **Event Creation**:
   - Authenticated user creates an event through the UI
   - Frontend sends event data to `/api/events` endpoint
   - Server validates and stores event data
   - Server generates a unique slug for the event URL

2. **Invitation**:
   - Event creator can invite others via email or shareable link
   - Invitations are tracked in the database
   - Invitees can view the event via a unique URL

3. **RSVP Process**:
   - Users view event details and respond with "yup" or "nope"
   - Authenticated users have responses linked to their account
   - Guest (unauthenticated) users can also respond if enabled for the event
   - Responses are tracked in the database
   - Event creators can view response analytics

### Payment Integration

1. **Subscription Purchase**:
   - User selects a subscription plan (Pro or Premium)
   - Frontend creates Stripe Checkout session via API
   - User completes payment on Stripe hosted checkout
   - Stripe webhook notifies server of successful payment
   - Server updates user subscription status
   - User gains access to premium features

2. **Subscription Management**:
   - Users can manage subscriptions via Stripe Customer Portal
   - Cancel or upgrade subscription
   - Update payment methods

## External Dependencies

### Third-Party Services

1. **Stripe**:
   - Used for payment processing and subscription management
   - Integration via Stripe.js on frontend and Stripe API on backend
   - Handles secure payment information collection and processing

2. **Neon Database**:
   - Serverless PostgreSQL database
   - Used via `@neondatabase/serverless` package

### Key Libraries

1. **Frontend**:
   - `@tanstack/react-query`: Data fetching and state management
   - `@radix-ui/*`: UI component primitives
   - `@hookform/resolvers`: Form validation
   - `@stripe/react-stripe-js`: Stripe Elements integration

2. **Backend**:
   - `express`: Web server framework
   - `drizzle-orm`: Database ORM
   - `memorystore`: Session storage
   - `stripe`: Payment processing

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Development**:
   - Dev server runs both the Vite dev server and Express backend
   - Vite proxy forwards API requests to the Express server

2. **Production**:
   - Frontend built with Vite
   - Backend built with esbuild
   - Static assets served by Express
   - API requests handled by Express

**Deployment Configuration**:
- Node.js server runs as the main entry point
- Frontend is pre-built and served as static files
- Database connection established via environment variables
- The `STRIPE_SECRET_KEY` environment variable is required for Stripe functionality

**Scaling Considerations**:
- The application uses an autoscaling deployment target
- Session management may need to be updated for horizontal scaling (currently uses MemoryStore)
- Static assets are bundled with the application for simplified deployment

## Feature Flagging and Premium Content

The application implements a tiered subscription model:

1. **Free Tier**:
   - Basic event creation and RSVP functionality
   - Limited to 3 events
   - Standard event pages

2. **Pro Tier**:
   - Unlimited events
   - Advanced analytics
   - Custom branding options

3. **Premium Tier**:
   - All Pro features
   - White-label events
   - Custom domain support
   - Priority support

Premium features are gated via user flags (`isPro` and `isPremium`) stored in the database and checked during API requests.