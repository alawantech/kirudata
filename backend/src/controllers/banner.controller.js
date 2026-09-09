const prisma = require("../config/prisma");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const ok = (res, data = {}, statusCode = 200) =>
  res.status(statusCode).json({ status: "success", data });

const fail = (res, msg, statusCode = 400) =>
  res.status(statusCode).json({ status: "error", msg });

// ─── Upload ──────────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../public/uploads/banners");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const bannerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const BANNER_MIME = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp",
]);

const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (BANNER_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files (png, jpg, gif, webp) are allowed."));
  },
}).single("file");

// ─── Admin: Upload banner image ──────────────────────────────────────────────
exports.uploadBannerImage = (req, res) => {
  bannerUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return fail(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return fail(res, err.message, 400);
    }
    if (!req.file) return fail(res, "No file uploaded.", 400);

    const protocol = req.protocol;
    const host = req.get("host");
    const fileUrl = `${protocol}://${host}/uploads/banners/${req.file.filename}`;

    return ok(res, { url: fileUrl, filename: req.file.filename });
  });
};

// ─── Admin: List all banners ─────────────────────────────────────────────────
exports.getBanners = async (_req, res) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
    return ok(res, { banners });
  } catch (err) {
    console.error("getBanners error:", err);
    return fail(res, "Failed to fetch banners.", 500);
  }
};

// ─── Admin: Create banner ────────────────────────────────────────────────────
exports.createBanner = async (req, res) => {
  try {
    const { title, imageUrl, link, sortOrder, active } = req.body;
    if (!imageUrl) return fail(res, "Image URL is required.", 400);

    const banner = await prisma.banner.create({
      data: {
        title: title || "",
        imageUrl,
        link: link || "",
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        active: active !== undefined ? Boolean(active) : true,
      },
    });
    return ok(res, { banner }, 201);
  } catch (err) {
    console.error("createBanner error:", err);
    return fail(res, "Failed to create banner.", 500);
  }
};

// ─── Admin: Update banner ────────────────────────────────────────────────────
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({ where: { id: Number(id) } });
    if (!banner) return fail(res, "Banner not found.", 404);

    const { title, imageUrl, link, sortOrder, active } = req.body;
    const updated = await prisma.banner.update({
      where: { id: Number(id) },
      data: {
        title: title !== undefined ? title : banner.title,
        imageUrl: imageUrl !== undefined ? imageUrl : banner.imageUrl,
        link: link !== undefined ? link : banner.link,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : banner.sortOrder,
        active: active !== undefined ? Boolean(active) : banner.active,
      },
    });
    return ok(res, { banner: updated });
  } catch (err) {
    console.error("updateBanner error:", err);
    return fail(res, "Failed to update banner.", 500);
  }
};

// ─── Admin: Delete banner ────────────────────────────────────────────────────
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({ where: { id: Number(id) } });
    if (!banner) return fail(res, "Banner not found.", 404);

    // Delete the image file
    const filename = banner.imageUrl.split("/uploads/banners/")[1];
    if (filename) {
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.banner.delete({ where: { id: Number(id) } });
    return ok(res, { msg: "Banner deleted." });
  } catch (err) {
    console.error("deleteBanner error:", err);
    return fail(res, "Failed to delete banner.", 500);
  }
};

// ─── Public: Get active banners ──────────────────────────────────────────────
exports.getActiveBanners = async (_req, res) => {
  try {
    // Always serve fresh list so admin uploads reflect immediately (images cached separately by Nginx)
    res.set("Cache-Control", "no-cache");
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, imageUrl: true, link: true, updatedAt: true },
    });
    // Append a version query so a re-upload (new updatedAt) forces a fresh fetch
    const decorated = banners.map((b) => {
      const sep = b.imageUrl.includes("?") ? "&" : "?";
      return { ...b, imageUrl: `${b.imageUrl}${sep}v=${new Date(b.updatedAt).getTime()}` };
    });
    return ok(res, { banners: decorated });
  } catch (err) {
    console.error("getActiveBanners error:", err);
    return fail(res, "Failed to fetch banners.", 500);
  }
};
