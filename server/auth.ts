import { Request, Response, NextFunction, Express } from "express";
import session from "express-session";

// Simple authentication setup without LinkedIn
export function setupAuth(app: Express) {
  // Session setup
  app.use(
    session({
      secret: "yup-rsvp-secret", // In production, use an environment variable
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Helper middleware to check if user is authenticated
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.isAuthenticated = () => !!req.session.userId;
    next();
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};