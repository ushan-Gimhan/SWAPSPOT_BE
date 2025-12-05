import { Request, Response, NextFunction } from "express";
import { Role } from "../models/user.model";
import { AuthRequest } from "./auth.middlewares";

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is attached to the request
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // Check if user has roles and includes admin role
    if (!req.user.roles || !req.user.roles.includes(Role.ADMIN)) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    } 

    // Proceed to the next middleware or route
    next();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ message: errorMessage });
  }
};
