const mongoose = require('mongoose');

const Team = require('../models/team');
const { TOURNAMENTS } = require('../constants/tournaments');
const wc2026Teams = require('./data/wc2026-teams');

const MONGO_URL = process.env.MONGODB_URI || `mongodb+srv://dawidnadolski:4I8XcXByoQlixd8h@betterleaguecluster.ojrdnvg.mongodb.net/?retryWrites=true&w=majority&appName=BetterLeagueCluster`;

async function seed() {
    await mongoose.connect(MONGO_URL);

    const existingCount = await Team.countDocuments({ tournament: TOURNAMENTS.WC2026 });

    if (existingCount > 0 && process.env.FORCE !== '1') {
        console.log(`Found ${existingCount} WC 2026 teams already. Skipping seed.`);
        console.log('Run with FORCE=1 to delete and re-seed.');
        await mongoose.disconnect();
        return;
    }

    if (existingCount > 0) {
        await Team.deleteMany({ tournament: TOURNAMENTS.WC2026 });
        console.log(`Removed ${existingCount} existing WC 2026 teams.`);
    }

    const teams = wc2026Teams.map((team) => ({
        ...team,
        isPlaying: true,
        didWin: false,
    }));

    await Team.insertMany(teams);

    console.log(`Seeded ${teams.length} teams for ${TOURNAMENTS.WC2026} (groups A–L).`);

    await mongoose.disconnect();
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
