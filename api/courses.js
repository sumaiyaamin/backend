import express from 'express';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb.js';

const router = express.Router();

// GET all courses
router.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const courses = await db.collection('courses').find({}).toArray();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET course by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const course = await db.collection('courses').findOne({ _id: new ObjectId(req.params.id) });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a new course
router.post('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newCourse = {
      title: req.body.title,
      description: req.body.description,
      instructor: req.body.instructor,
      credits: req.body.credits,
      createdAt: new Date(),
    };
    const result = await db.collection('courses').insertOne(newCourse);
    res.status(201).json({ _id: result.insertedId, ...newCourse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update course by ID
router.put('/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const updatedCourse = {
      title: req.body.title,
      description: req.body.description,
      instructor: req.body.instructor,
      credits: req.body.credits,
      updatedAt: new Date(),
    };
    const result = await db.collection('courses').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedCourse }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE course by ID
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const result = await db.collection('courses').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
