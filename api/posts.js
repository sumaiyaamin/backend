import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb.js';

const router = express.Router();

const uploadDir = './uploads/posts';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Create a new post with file upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { caption, author } = req.body;
    if (!caption || !author) {
      return res.status(400).json({ message: 'Caption and author are required.' });
    }

    const newPost = {
      caption,
      author,
      createdAt: new Date(),
      likes: [],
      comments: [],
      fileUrl: req.file ? `/uploads/posts/${req.file.filename}` : null,
      fileType: req.file ? req.file.mimetype : null,
    };

    const result = await db.collection('posts').insertOne(newPost);
    res.status(201).json({ _id: result.insertedId, ...newPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all posts sorted by newest first
router.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const posts = await db.collection('posts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like or Unlike a post
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    if (!userEmail) {
      return res.status(400).json({ message: 'User email required' });
    }

    const db = await connectToDatabase();
    const postId = new ObjectId(id);
    const post = await db.collection('posts').findOne({ _id: postId });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const update = post.likes.includes(userEmail)
      ? { $pull: { likes: userEmail } }
      : { $push: { likes: userEmail } };

    await db.collection('posts').updateOne({ _id: postId }, update);
    res.json({ message: 'Like toggled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to a post
router.post('/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, text } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    if (!userEmail || !text) {
      return res.status(400).json({ message: 'User and text required' });
    }

    const db = await connectToDatabase();
    const postId = new ObjectId(id);
    const comment = {
      user: userEmail,
      text,
      time: new Date(),
    };

    await db.collection('posts').updateOne(
      { _id: postId },
      { $push: { comments: comment } }
    );

    res.json({ message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
