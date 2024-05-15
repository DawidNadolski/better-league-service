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
    } 
});

module.exports = mongoose.model('Bet', betSchema);

