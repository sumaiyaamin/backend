import express from 'express';
import cors from 'cors';
import userRoutes from './api/users.js';
import courseRoutes from './api/courses.js';
import postRoutes from './api/posts.js'; // <--- import posts routes
import { client } from './mongodb.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically (images/docs/videos for posts, users, etc.)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/posts', postRoutes);  // <--- add posts routes here

// Test route
app.get('/', (req, res) => {
  res.send('Cambridge University API is running');
});

// Start server
app.listen(PORT, async () => {
  try {
    await client.connect();
    console.log(`Server running on port ${PORT}`);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
});

// Handle shutdown
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
