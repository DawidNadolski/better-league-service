const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchSchema = new Schema({
    homeTeam: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    homeTeamGoals: {
        type: Number,
        default: 0
    },
    awayTeam: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    awayTeamGoals: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    hasEnded: {
        type: Boolean,
        default: false
    },
    stage: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Match', matchSchema);