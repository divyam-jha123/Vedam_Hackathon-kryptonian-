const { getAuth } = require('@clerk/express');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 1. Check for Clerk Auth
    try {
        const clerkAuth = getAuth(req);
        if (clerkAuth && clerkAuth.userId) {
            console.log('[Auth] Clerk Session Found:', clerkAuth.userId);
            req.user = { id: clerkAuth.userId, clerk: true };
            return next();
        }
    } catch (err) {
        console.warn('[Auth] Clerk check skipped/failed:', err.message);
    }

    // 2. Check for Custom JWT
    const token = req.cookies.token;

    if (!token) {
        console.warn('[Auth] No session found (cookie "token" is missing)');
        return res.status(401).json({ message: 'Access denied. No session found.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth] Custom JWT Verified:', decoded.id);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[Auth] JWT Invalid:', err.message);
        return res.status(401).json({ message: 'Invalid or expired session.' });
    }
};

module.exports = auth;
