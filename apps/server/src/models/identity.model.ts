import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";

export interface IUser {
  email: string;
  name?: string;
  passwordHash?: string;
  isPlatformAdmin: boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: String,
    passwordHash: { type: String, select: false },
    isPlatformAdmin: { type: Boolean, default: false },
  },
  schemaOptions,
);
export const User = model<IUser>("User", userSchema);

export interface IRefreshToken {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
  },
  schemaOptions,
);
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshToken = model<IRefreshToken>("RefreshToken", refreshTokenSchema);

export interface IOrganization {
  name: string;
  slug: string;
  timezone: string;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    timezone: { type: String, default: "UTC" },
  },
  schemaOptions,
);
export const Organization = model<IOrganization>("Organization", organizationSchema);

export interface IRole {
  organizationId?: Types.ObjectId | null;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

const roleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    name: { type: String, required: true },
    description: String,
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  schemaOptions,
);
roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export const Role = model<IRole>("Role", roleSchema);

export interface IMembership {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  roleId: Types.ObjectId;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  },
  schemaOptions,
);
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
membershipSchema.index({ organizationId: 1 });
export const Membership = model<IMembership>("Membership", membershipSchema);
