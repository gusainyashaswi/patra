import { z } from "zod";
import { Membership, Organization, Role } from "../models/identity.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ObjectId");
export const orgParams = z.object({ orgId: objectId });
export const resourceParams = orgParams.extend({ id: objectId });

export const requireOrgAccess = asyncHandler(async (req, _res, next) => {
  const { orgId } = orgParams.parse(req.params);
  const user = req.user;
  if (!user) throw new ApiError(401, "Sign in to continue");
  if (!(await Organization.exists({ _id: orgId }))) {
    throw new ApiError(404, "Organization not found");
  }
  if (!user.isPlatformAdmin) {
    const membership = await Membership.findOne({ userId: user._id, organizationId: orgId });
    if (!membership) throw new ApiError(404, "Organization not found");
    const role = await Role.findOne({
      _id: membership.roleId,
      $or: [{ organizationId: orgId }, { organizationId: null }],
    });
    user.permissions = role?.permissions ?? [];
  }
  user.organizationId = orgId;
  next();
});
