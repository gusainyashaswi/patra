import { Router } from "express";
import multer from "multer";
import { resourceParams } from "../middleware/orgAccess.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validate } from "../middleware/validate.js";
import { contactRepo } from "../repositories/contact.repo.js";
import { suppressionRepo } from "../repositories/suppression.repo.js";
import * as schema from "../schemas/contact.schema.js";
import { previewContactImport } from "../services/contactImport.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

export const contactRouter = Router({ mergeParams: true });

contactRouter.use(requirePermission("manage_contacts"));

// 1. POST /api/orgs/:orgId/contacts/import/preview — Multi-part file upload, returns preview stats
contactRouter.post(
  "/import/preview",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, "Please upload a .csv or .xlsx file");
    }

    const data = await previewContactImport(orgId, file.buffer, file.originalname);
    res.json({ data });
  }),
);

// 2. POST /api/orgs/:orgId/contacts/import — Commit validated rows (JSON or file upload)
contactRouter.post(
  "/import",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;

    // If file was uploaded directly to commit
    if (req.file) {
      const preview = await previewContactImport(orgId, req.file.buffer, req.file.originalname);
      const listName = req.body?.listName || `Import - ${req.file.originalname}`;
      const duplicateHandling = req.body?.duplicateHandling === "update" ? "update" : "skip";

      const data = await contactRepo.bulkImport(
        orgId,
        preview.contacts,
        duplicateHandling,
        listName,
      );
      return res.status(201).json({ data });
    }

    // Otherwise JSON payload with validated contacts
    const body = schema.importCommitBody.parse(req.body);
    const data = await contactRepo.bulkImport(
      orgId,
      body.contacts,
      body.duplicateHandling,
      body.listName,
    );
    res.status(201).json({ data });
  }),
);

// 3. GET /api/orgs/:orgId/contacts — List contacts (paginated, with search & list filtering)
contactRouter.get(
  "/",
  validate({ query: schema.listContactsQuery }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const query = req.query as unknown as schema.ListContactsQuery;
    const data = await contactRepo.list(orgId, query);
    res.json({ data });
  }),
);

// 4. POST /api/orgs/:orgId/contacts — Create single contact
contactRouter.post(
  "/",
  validate({ body: schema.createContactBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const data = await contactRepo.create(orgId, req.body);
    res.status(201).json({ data });
  }),
);

// 5. GET /api/orgs/:orgId/contacts/lists — List audience lists
contactRouter.get(
  "/lists",
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const data = await contactRepo.listLists(orgId);
    res.json({ data });
  }),
);

// 6. GET /api/orgs/:orgId/contacts/lists/:id — Get list details
contactRouter.get(
  "/lists/:id",
  validate({ params: resourceParams }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const data = await contactRepo.findListById(orgId, req.params.id as string);
    if (!data) throw new ApiError(404, "List not found");
    res.json({ data });
  }),
);

// 7. GET /api/orgs/:orgId/contacts/suppressions — List suppressions
contactRouter.get(
  "/suppressions",
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await suppressionRepo.list(orgId, { page, limit });
    res.json({ data });
  }),
);

// 8. POST /api/orgs/:orgId/contacts/suppressions — Add manual suppression
contactRouter.post(
  "/suppressions",
  validate({ body: schema.createSuppressionBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const userId = req.user?._id;
    const data = await suppressionRepo.add(orgId, req.body.email, req.body.reason, userId);
    res.status(201).json({ data });
  }),
);

// 9. DELETE /api/orgs/:orgId/contacts/suppressions/:email — Remove suppression
contactRouter.delete(
  "/suppressions/:email",
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const email = req.params.email as string;
    const userId = req.user?._id;
    const data = await suppressionRepo.remove(orgId, email, userId);
    if (!data) throw new ApiError(404, "Suppression not found");
    res.json({ data: { message: "Suppression removed successfully", email } });
  }),
);
