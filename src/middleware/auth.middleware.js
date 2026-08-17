/**
 * Authentication Middleware (replay service — slim variant)
 *
 * The main backend ships a full-featured `authenticate` that also writes audit
 * logs and reads app settings. That pulls in a large service graph
 * (logger/appSettings/constants/…) which this standalone replay service does
 * not need. This slim version keeps the SAME security contract:
 *   - verify the JWT with the shared JWT_SECRET
 *   - load the user from the shared app_user table
 *   - enforce active / not-suspended / token_version (force-logout)
 *   - attach `req.user`
 * so the replay routes behave identically to when they lived in the backend.
 *
 * It shares JWT_SECRET and the MySQL DB with the main backend, so tokens issued
 * by the backend authenticate here unchanged.
 */

const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

// Same projection the backend's UserModel.findById uses, so req.user has the
// same shape the routes expect.
const USER_BY_ID_SQL = `
  SELECT
    app_user_id AS id,
    username,
    email,
    full_name,
    CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END AS is_active,
    status,
    role,
    debug_mode,
    token_version
  FROM app_user
  WHERE app_user_id = ?
  LIMIT 1
`;

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError" || /jwt expired/.test(error.message)) {
        return res.status(401).json({ success: false, message: "Session expired", forceLogout: true });
      }
      return res.status(401).json({ success: false, message: "Invalid or expired token", forceLogout: true });
    }

    const users = await query(USER_BY_ID_SQL, [decoded.userId]);
    const user = users[0] || null;

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "SUSPENDED") {
      return res.status(401).json({ success: false, message: "Account suspended. Contact admin" });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: "User account is inactive" });
    }

    // Force logout when the token was minted before a token_version bump.
    if (decoded.tokenVersion !== user.token_version) {
      return res.status(401).json({ success: false, message: "Session expired. Please login again", forceLogout: true });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token", forceLogout: true });
  }
}

module.exports = { authenticate };
