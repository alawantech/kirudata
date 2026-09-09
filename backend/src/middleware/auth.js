const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("../utils/tokenBlacklist");

/**
 * Protect routes — requires a valid JWT either in:
 *   - Authorization: Bearer <token>   header, OR
 *   - auth_token signed cookie
 */
function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.signedCookies && req.signedCookies.auth_token) {
    token = req.signedCookies.auth_token;
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", msg: "Not authenticated. Please log in." });
  }

  if (isBlacklisted(token)) {
    return res.status(401).json({
      status: "error",
      msg: "Session ended. Please log in again.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, type: decoded.type };
    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      msg: "Session expired or invalid. Please log in again.",
    });
  }
}

/**
 * Restrict to certain user types.
 * sType: 1 = Regular, 2 = Agent, 3 = Vendor, 4 = Admin
 */
function restrictTo(...types) {
  return (req, res, next) => {
    if (!types.includes(req.user.type)) {
      return res.status(403).json({
        status: "error",
        msg: "You do not have permission to perform this action.",
      });
    }
    next();
  };
}

/**
 * Protect admin routes — requires a valid admin JWT in admin_token httpOnly cookie
 */
function protectAdmin(req, res, next) {
  let token;
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", msg: "Admin authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret-key");
    if (!decoded.isAdmin) {
      return res
        .status(403)
        .json({ status: "error", msg: "Admin access only." });
    }
    req.admin = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: "error", msg: "Admin session expired." });
  }
}

module.exports = { protect, restrictTo, protectAdmin };
