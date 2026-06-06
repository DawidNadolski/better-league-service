const mongoose = require('mongoose');

const User = require('../models/user');
const Team = require('../models/team');
const { setUserWinningTeam } = require('../utils/winningTeam');

const MONGO_URL = process.env.MONGODB_URI || `mongodb+srv://dawidnadolski:4I8XcXByoQlixd8h@betterleaguecluster.ojrdnvg.mongodb.net/?retryWrites=true&w=majority&appName=BetterLeagueCluster`;

async function migrate() {
    await mongoose.connect(MONGO_URL);

    const users = await User.find().populate('winningTeam');
    let updated = 0;

    for (const user of users) {
        if (!user.winningTeam) {
            continue;
        }

        const tournament = user.winningTeam.tournament;
        const alreadyStored = user.winningTeams?.some(
            (entry) => entry.tournament === tournament
        );

        if (alreadyStored) {
            continue;
        }

        setUserWinningTeam(user, user.winningTeam);
        await user.save();
        updated += 1;
        console.log(`Migrated ${user.name}: ${user.winningTeam.name} (${tournament})`);
    }

    console.log(`Migrated winning team picks for ${updated} users.`);

    await mongoose.disconnect();
}

migrate().catch((error) => {
    console.error(error);
    process.exit(1);
});
