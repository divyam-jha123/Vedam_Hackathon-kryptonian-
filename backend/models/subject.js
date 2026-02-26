const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    cloudinaryUrl: { type: String, default: null },
    cloudinaryPublicId: { type: String, default: null },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const subjectSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        notes: [noteSchema],
    },
    { timestamps: true }
);

// Ensure a user can have at most 3 subjects
subjectSchema.statics.countByUser = function (userId) {
    return this.countDocuments({ userId });
};

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
