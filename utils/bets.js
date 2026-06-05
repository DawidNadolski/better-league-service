const Bet = require('../models/bet');

function calculatePoints(bet) {
	if (
		bet.homeTeamGoals === bet.match.homeTeamGoals &&
		bet.awayTeamGoals === bet.match.awayTeamGoals
	) {
		return 3;
	}
	if (
		bet.match.homeTeamGoals > bet.match.awayTeamGoals &&
		bet.homeTeamGoals > bet.awayTeamGoals
	) {
		return 1;
	}
	if (
		bet.match.homeTeamGoals === bet.match.awayTeamGoals &&
		bet.homeTeamGoals === bet.awayTeamGoals
	) {
		return 1;
	}
	if (
		bet.match.homeTeamGoals < bet.match.awayTeamGoals &&
		bet.homeTeamGoals < bet.awayTeamGoals
	) {
		return 1;
	}
	return 0;
}

async function resolveBetsForMatch(match) {
	const bets = await Bet.find({ match: match._id });

	for (const bet of bets) {
		if (bet.isResolved) {
			continue;
		}
		bet.match = match;
		bet.points = calculatePoints(bet);
		bet.isResolved = true;
		await bet.save();
	}
}

module.exports = { calculatePoints, resolveBetsForMatch };
