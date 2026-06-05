const mongoose = require('mongoose');

const Team = require('../models/team');
const Match = require('../models/match');
const { TOURNAMENTS } = require('../constants/tournaments');

const MONGO_URL = process.env.MONGODB_URI || `mongodb+srv://dawidnadolski:4I8XcXByoQlixd8h@betterleaguecluster.ojrdnvg.mongodb.net/?retryWrites=true&w=majority&appName=BetterLeagueCluster`;

async function migrate() {
    await mongoose.connect(MONGO_URL);

    const teamResult = await Team.updateMany(
        { $or: [{ tournament: { $exists: false } }, { tournament: null }] },
        { $set: { tournament: TOURNAMENTS.EURO2024 } }
    );

    const matchResult = await Match.updateMany(
        { $or: [{ tournament: { $exists: false } }, { tournament: null }] },
        { $set: { tournament: TOURNAMENTS.EURO2024 } }
    );

    console.log(`Tagged ${teamResult.modifiedCount} teams as ${TOURNAMENTS.EURO2024}`);
    console.log(`Tagged ${matchResult.modifiedCount} matches as ${TOURNAMENTS.EURO2024}`);

    await mongoose.disconnect();
}

migrate().catch(error => {
    console.error(error);
    process.exit(1);
});
