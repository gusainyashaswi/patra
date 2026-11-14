import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId | string;
        id: string;
        sub: string;
        email: string;
        name?: string;
        fullName?: string;
        permissions: string[];
        organizationId?: string;
        isPlatformAdmin?: boolean;
        [key: string]: any;
      };
    }
  }
}

export {};
