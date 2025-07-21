import express from 'express';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { connectToDatabase } from '../mongodb.js';
import { sendVerificationEmail } from '../mailer.js';

const router = express.Router();

// Upload directory setup
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Serve uploaded images
router.use('/uploads', express.static(uploadDir));

/**
 * GET all users
 */
router.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET user by UID (not Mongo _id)
 */
router.get('/:uid', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST create user (called after Firebase auth signup/login)
 */
router.post('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { uid, name, email, role = 'student', image = null } = req.body;

    if (!uid || !email || !name) {
      return res.status(400).json({ message: 'uid, name, and email are required' });
    }

    // ✅ Prevent duplicate users
    const existing = await db.collection('users').findOne({ _id: uid });
    if (existing) {
      return res.status(200).json({ message: 'User already exists' });
    }

    const newUser = {
      _id: uid,
      name,
      email,
      role,
      image,
      isVerified: true,
      createdAt: new Date()
    };

    await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: 'User saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * PUT update user profile (name, role, optional image)
 */
router.put('/:uid', upload.single('image'), async (req, res) => {
  try {
    const db = await connectToDatabase();
    const uid = req.params.uid;

    const updatedData = {};
    if (req.body.name) updatedData.name = req.body.name;
    if (req.body.role) updatedData.role = req.body.role;
    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    const result = await db.collection('users').updateOne(
      { _id: uid },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Optional: Email verification endpoint (if not using Firebase)
 */
router.get('/verify-email', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const token = req.query.token;

    const user = await db.collection('users').findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { isVerified: true }, $unset: { verificationToken: '' } }
    );

    res.send('Email successfully verified!');
  } catch (error) {
    res.status(500).send('Something went wrong.');
  }
});

export default router;
