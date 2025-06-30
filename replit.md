# YUP.RSVP Project Documentation

## Overview
YUP.RSVP is a dynamic event management platform with customizable branding features for premium users. The system includes comprehensive WCAG accessibility compliance and integrates with Supabase for data persistence.

## Current Status
- Event creation and editing functionality operational
- Slug-based routing working correctly
- Database schema properly mapped (snake_case)
- Authentication system integrated
- Premium user branding features available

## User Preferences
- Focus on practical functionality over extensive documentation
- Prefer simple, working solutions over complex implementations
- Troubleshoot issues comprehensively rather than one-by-one

## Project Architecture

### Frontend (React/TypeScript)
- Vite + React with TypeScript
- Tailwind CSS for styling
- Wouter for routing
- TanStack Query for data fetching
- Zod for form validation

### Backend (Express/Node.js)
- Express server with TypeScript
- Supabase PostgreSQL integration
- Session-based authentication
- RESTful API endpoints

### Database (Supabase)
- PostgreSQL with snake_case field naming
- Events, Users, Responses tables
- Real-time data synchronization

## Recent Changes
- 2025-06-15: Fixed authentication context to extract user data correctly from API responses
- 2025-06-15: Updated event components to use proper snake_case field names
- 2025-06-15: Added missing API endpoints for RSVP functionality
- 2025-06-15: Created simplified event creation and edit forms
- 2025-06-15: Resolved routing issues with slug-based event URLs
- 2025-06-15: Implemented session-based authentication with persistent login state
- 2025-06-15: Added comprehensive image upload functionality to event edit form
- 2025-06-15: Fixed host detection logic for edit button display

## Current Status
All major functionality now operational:
- Session-based authentication working with proper persistence
- Event hosts can see edit buttons when viewing their own events
- Image upload/editing capability added to event edit form with Base64 storage
- Complete event CRUD operations with proper database field mapping
- Subourbon admin user (subourbon/events) authentication working
- Bob premium user (bob/events) authentication working

## Technical Notes
- All components updated to use corrected database schema
- Event editing available at `/events/{slug}/edit`
- RSVP system fully operational with database persistence
- Premium users have access to custom branding features