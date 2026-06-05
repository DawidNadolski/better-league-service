const mongoose = require('mongoose');

const Team = require('../models/team');
const COUNTRY_CODES = require('./data/team-country-codes');

const MONGO_URL = process.env.MONGODB_URI || `mongodb+srv://dawidnadolski:4I8XcXByoQlixd8h@betterleaguecluster.ojrdnvg.mongodb.net/?retryWrites=true&w=majority&appName=BetterLeagueCluster`;

async function backfill() {
    await mongoose.connect(MONGO_URL);

    const teams = await Team.find();
    let updated = 0;
    let missing = [];

    for (const team of teams) {
        const countryCode = COUNTRY_CODES[team.name];
        if (!countryCode) {
            missing.push(team.name);
            continue;
        }
        if (team.countryCode !== countryCode) {
            team.countryCode = countryCode;
            await team.save();
            updated += 1;
        }
    }

    console.log(`Updated countryCode on ${updated} teams.`);
    if (missing.length > 0) {
        console.log(`No Alpha-2 mapping for: ${missing.join(', ')}`);
    }

    await mongoose.disconnect();
}

backfill().catch((error) => {
    console.error(error);
    process.exit(1);
});
