const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tên phim là bắt buộc']
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String
    },
    genre: [{
        type: String
    }],
    durationMinutes: {
        type: Number,
        required: [true, 'Thời lượng phim là bắt buộc']
    },
    language: {
        type: String,
        default: 'Vietnamese'
    },
    subtitle: {
        type: String
    },
    director: {
        type: String
    },
    cast: [{
        type: String
    }],
    posterUrl: {
        type: String
    },
    trailerUrl: {
        type: String
    },
    releaseDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    ageRating: {
        type: String,
        enum: ['P', 'C13', 'C16', 'C18'],
        default: 'P'
    },
    status: {
        type: String,
        enum: ['coming_soon', 'now_showing', 'ended'],
        default: 'coming_soon'
    }
}, {
    timestamps: true
});

// Tự tạo slug từ title nếu chưa có
movieSchema.pre('save', async function () {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

module.exports = mongoose.model('Movie', movieSchema);
