const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    winningTeam: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    winningTeams: [{
        tournament: {
            type: String,
            required: true
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
            required: true
        }
    }],
    bets: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Bet'
        }
    ]   
});

module.exports = mongoose.model('User', userSchema);

