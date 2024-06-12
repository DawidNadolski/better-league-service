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
    }
});

module.exports = mongoose.model('Team', teamSchema);