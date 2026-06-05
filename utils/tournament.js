const Match = require('../models/match');
const { resolveTournament } = require('../constants/tournaments');

async function hasTournamentStarted(tournament) {
	const selectedTournament = resolveTournament(tournament);
	const firstMatch = await Match.findOne({ tournament: selectedTournament })
		.sort({ startDate: 1 })
		.select('startDate');

	if (!firstMatch) {
		return false;
	}

	return new Date() >= firstMatch.startDate;
}

module.exports = { hasTournamentStarted };
