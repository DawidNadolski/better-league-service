const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    goalsScored: {
        type: Number,
        default: 0
    },
    goalsConceded: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Team', teamSchema);