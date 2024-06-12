const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const betSchema = new Schema({
    homeTeamGoals: {
        type: Number,
        required: true
    },
    awayTeamGoals: {
        type: Number,
        required: true
    },
    match: {
        type: Schema.Types.ObjectId,
        ref: 'Match'
    },
    better: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Bet', betSchema);

