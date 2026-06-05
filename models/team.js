const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    isPlaying: {
        type: Boolean,
        default: true
    },
    didWin: {
        type: Boolean,
        default: false
    },
    group: {
        type: String,
        required: true
    },
    tournament: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true,
        uppercase: true,
        minlength: 2,
        maxlength: 2
    }
});

module.exports = mongoose.model('Team', teamSchema);