const express = require('express');
const Subject = require('../models/subject');
const { queryChunks } = require('../services/vectorStore');
const { generateStudyQuestions } = require('../services/gemini');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/study/:subjectId — Generate study questions
router.post('/:subjectId', auth, async (req, res) => {
    try {
        // Verify subject belongs to user
        const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.user.id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found.' });
        }

        if (subject.notes.length === 0) {
            return res.status(400).json({ message: 'Upload at least one note before generating study questions.' });
        }

        // Retrieve a broad set of chunks to cover the subject well
        const topic = req.body.topic || subject.name;
        const contextChunks = await queryChunks(req.params.subjectId, topic, 10);

        if (contextChunks.length === 0) {
            return res.status(400).json({ message: 'No notes content found for this subject.' });
        }

        // Generate study questions via Gemini
        const questions = await generateStudyQuestions(subject.name, contextChunks);

        return res.json(questions);
    } catch (err) {
        console.error('Study error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
