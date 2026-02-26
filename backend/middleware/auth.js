const { getAuth } = require('@clerk/express');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 1. Check for Clerk Auth
    try {
        const clerkAuth = getAuth(req);
        if (clerkAuth && clerkAuth.userId) {
            req.user = { id: clerkAuth.userId, clerk: true };
            return next();
        }
    } catch (err) {
        // Clerk middleware might not be active or throwing, fall back
    }

    // 2. Check for Custom JWT
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No session found.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired session.' });
    }
};

module.exports = auth;
