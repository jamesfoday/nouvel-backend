// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables');
}

// Middleware to verify JWT token and attach user info to req.user
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Token format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied, token missing' });

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user; // attach decoded user info to request
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

// Middleware to check for user roles (accepts an array of allowed roles)
function authorizeRoles(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
}

module.exports = { authenticateToken, authorizeRoles };
