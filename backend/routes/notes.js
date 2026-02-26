const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const Subject = require('../models/subject');
const { parseFile, chunkPages } = require('../services/pdfParser');
const { addChunks, removeNoteChunks } = require('../services/vectorStore');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer stores to temp dir — files are parsed locally, then uploaded to Cloudinary
const upload = multer({
    dest: os.tmpdir(),
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and TXT files are allowed.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Clean up a temp file silently.
 */
function cleanupTempFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }
}

// POST /api/notes/:subjectId/upload — Upload, parse, embed, optionally store in Cloudinary
router.post('/:subjectId/upload', auth, upload.single('file'), async (req, res) => {
    const tempPath = req.file?.path;

    try {
        const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.user.id });
        if (!subject) {
            cleanupTempFile(tempPath);
            return res.status(404).json({ message: 'Subject not found.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const originalName = req.file.originalname;
        const noteId = uuidv4();

        console.log(`[Upload] Processing "${originalName}" for subject ${req.params.subjectId}`);

        // 1. Parse file locally to extract text + pages
        const { pages } = await parseFile(tempPath, originalName);
        console.log(`[Upload] Parsed ${pages.length} page(s)`);

        // 2. Chunk the text with metadata
        const chunks = chunkPages(pages, originalName);
        console.log(`[Upload] Created ${chunks.length} chunk(s)`);

        if (chunks.length === 0) {
            cleanupTempFile(tempPath);
            return res.status(400).json({ message: 'Could not extract any text from the file.' });
        }

        // 3. Try uploading to Cloudinary (non-fatal if it fails)
        let cloudinaryUrl = null;
        let cloudinaryPublicId = null;
        try {
            const cloudinaryResult = await cloudinary.uploader.upload(tempPath, {
                resource_type: 'raw',
                folder: `askmynotes/${req.user.id}/${req.params.subjectId}`,
                public_id: noteId,
                original_filename: originalName,
            });
            cloudinaryUrl = cloudinaryResult.secure_url;
            cloudinaryPublicId = cloudinaryResult.public_id;
            console.log(`[Upload] Cloudinary OK: ${cloudinaryUrl}`);
        } catch (cloudErr) {
            console.warn('[Upload] Cloudinary failed (continuing without):', cloudErr.message);
        }

        // 4. Clean up temp file
        cleanupTempFile(tempPath);

        // 5. Embed chunks and store in vector DB
        await addChunks(req.params.subjectId, chunks, noteId);
        console.log(`[Upload] Embedded ${chunks.length} chunk(s) in vector store`);

        // 6. Save note reference to subject
        subject.notes.push({
            _id: noteId,
            filename: req.file.filename || noteId,
            originalName,
            cloudinaryUrl,
            cloudinaryPublicId,
        });
        await subject.save();

        console.log(`[Upload] Done — noteId: ${noteId}`);

        return res.status(201).json({
            message: 'Note uploaded and processed successfully.',
            noteId,
            originalName,
            cloudinaryUrl,
            chunksCreated: chunks.length,
        });
    } catch (err) {
        console.error('[Upload] Error:', err);
        cleanupTempFile(tempPath);
        return res.status(500).json({ message: err.message || 'Internal server error.' });
    }
});

// GET /api/notes/:subjectId — List notes for a subject
router.get('/:subjectId', auth, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.user.id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found.' });
        }

        return res.json(subject.notes);
    } catch (err) {
        console.error('List notes error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// DELETE /api/notes/:subjectId/:noteId — Delete note from Cloudinary, ChromaDB, and DB
router.delete('/:subjectId/:noteId', auth, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.user.id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found.' });
        }

        const noteIndex = subject.notes.findIndex((n) => n._id.toString() === req.params.noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        const note = subject.notes[noteIndex];

        // Remove from Cloudinary
        if (note.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(note.cloudinaryPublicId, { resource_type: 'raw' });
            } catch (cloudErr) {
                console.error('Cloudinary delete error:', cloudErr);
            }
        }

        // Remove vectors from ChromaDB
        await removeNoteChunks(req.params.subjectId, req.params.noteId);

        // Remove from subject document
        subject.notes.splice(noteIndex, 1);
        await subject.save();

        return res.json({ message: 'Note deleted successfully.' });
    } catch (err) {
        console.error('Delete note error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
