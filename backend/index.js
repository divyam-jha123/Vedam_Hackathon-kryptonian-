require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { clerkMiddleware } = require('@clerk/express');
const connectDb = require('./db/connection');

// Routes
const userRoutes = require('./routes/user');
const subjectRoutes = require('./routes/subjects');
const notesRoutes = require('./routes/notes');
const chatRoutes = require('./routes/chat');
const studyRoutes = require('./routes/study');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection helper
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) return cachedDb;
  cachedDb = await connectDb(process.env.MONGODB_URI);
  return cachedDb;
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Mount routes
app.use('/user', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/study', studyRoutes);

// Export for Vercel
module.exports = app;

// Listen only if running directly
if (require.main === module) {
  const startServer = async () => {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  };
  startServer();
}