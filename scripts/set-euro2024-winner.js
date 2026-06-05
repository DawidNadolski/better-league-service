const mongoose = require('mongoose');

const Team = require('../models/team');
const { TOURNAMENTS } = require('../constants/tournaments');

const MONGO_URL = process.env.MONGODB_URI || `mongodb+srv://dawidnadolski:4I8XcXByoQlixd8h@betterleaguecluster.ojrdnvg.mongodb.net/?retryWrites=true&w=majority&appName=BetterLeagueCluster`;

const WINNER_NAME = 'Hiszpania';

async function setWinner() {
    await mongoose.connect(MONGO_URL);

    await Team.updateMany(
        { tournament: TOURNAMENTS.EURO2024 },
        { $set: { didWin: false } }
    );

    const winner = await Team.findOneAndUpdate(
        { name: WINNER_NAME, tournament: TOURNAMENTS.EURO2024 },
        { $set: { didWin: true } },
        { new: true }
    );

    if (!winner) {
        throw new Error(`Could not find ${WINNER_NAME} in ${TOURNAMENTS.EURO2024}`);
    }

    console.log(`Set tournament winner: ${winner.name} (${TOURNAMENTS.EURO2024})`);

    await mongoose.disconnect();
}

setWinner().catch((error) => {
    console.error(error);
    process.exit(1);
});
