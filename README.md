# Yup.RSVP - Next.js Event Management Platform

Welcome to **Yup.RSVP**, a modern Next.js monorepo application for event management and RSVP collection built with Supabase, TypeScript, and Tailwind CSS.

## 🚀 Project Structure

This project follows a monorepo structure with the main application located in the `starter-app/` directory:

```
yup2/
├── starter-app/           # Main Next.js monorepo application
│   ├── apps/
│   │   └── web/          # Next.js web application
│   └── packages/         # Shared packages
│       ├── ui/           # Shared UI components (Shadcn/UI)
│       ├── utils/        # Utility functions
│       ├── types/        # TypeScript type definitions
│       └── contexts/     # React contexts
├── docs/                 # Project documentation
├── attached_assets/      # Static assets and attachments
└── README.md            # This file
```

## 📁 Documentation

All development guidelines and standards are located in the `/docs` directory:

- [`coding-best-practices.md`](./docs/coding-best-practices.md): Development standards, API patterns, and code quality guidelines
- [`design-ux-best-practices.md`](./docs/design-ux-best-practices.md): Design system, responsive design, and UX principles
- [`ai-agent-rules.md`](./docs/ai-agent-rules.md): Guidelines for AI-assisted development

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- Supabase account
- Stripe account (for payments)
- Twilio account (for SMS)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yup2
   ```

2. **Install dependencies**
   ```bash
   pnpm install-deps
   ```

3. **Navigate to the starter-app**
   ```bash
   cd starter-app
   ```

4. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   Fill in your Supabase, Stripe, and Twilio credentials.

5. **Start development server**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3001`.

## 💻 Development Commands

From the root directory:

- `pnpm dev` - Start development server
- `pnpm build` - Build for production  
- `pnpm start` - Start production server
- `pnpm lint` - Run linting
- `pnpm type-check` - Run TypeScript type checking

## 🏗️ Architecture

- **Frontend**: Next.js 14+ with App Router
- **Backend**: Next.js API routes + Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **SMS**: Twilio
- **Styling**: Tailwind CSS + Shadcn/UI
- **Deployment**: Vercel

## 🔧 Key Features

- Event creation and management
- RSVP collection with real-time updates
- SMS invitations and notifications
- User authentication and profiles
- Pro/Premium subscription tiers
- Responsive design
- Dark/light mode support

## 📝 Development Guidelines

1. **Follow the monorepo structure** - Keep shared code in packages
2. **Use TypeScript** - All code should be strongly typed
3. **Follow Shadcn/UI patterns** - Use design system components
4. **Write tests** - Cover critical functionality
5. **Document changes** - Update relevant documentation

## 🚀 Deployment

The application is designed to deploy seamlessly on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

For questions or contributions, please open an issue or pull request.
