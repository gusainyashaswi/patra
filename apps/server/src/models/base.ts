// Shared Mongoose schema options applied to every model
export const schemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
} as const;
