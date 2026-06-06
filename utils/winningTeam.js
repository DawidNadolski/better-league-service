function getWinningTeamForTournament(user, tournament) {
	if (user.winningTeams?.length) {
		const entry = user.winningTeams.find((wt) => wt.tournament === tournament);
		if (entry?.team) {
			return entry.team;
		}
	}

	if (user.winningTeam?.tournament === tournament) {
		return user.winningTeam;
	}

	return null;
}

function getWinningTeamIdForTournament(user, tournament) {
	const team = getWinningTeamForTournament(user, tournament);
	if (!team) {
		return null;
	}
	return team._id ? team._id.toString() : team.toString();
}

function setUserWinningTeam(user, team) {
	if (!user.winningTeams) {
		user.winningTeams = [];
	}

	const index = user.winningTeams.findIndex((wt) => wt.tournament === team.tournament);
	if (index >= 0) {
		user.winningTeams[index].team = team._id;
	} else {
		user.winningTeams.push({
			tournament: team.tournament,
			team: team._id,
		});
	}
}

module.exports = {
	getWinningTeamForTournament,
	getWinningTeamIdForTournament,
	setUserWinningTeam,
};
