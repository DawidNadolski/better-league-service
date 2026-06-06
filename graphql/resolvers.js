const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Match = require('../models/match');
const Team = require('../models/team');
const Bet = require('../models/bet');
const scalarTypes = require('../graphql/scalar-types');
const { resolveTournament, ACTIVE_TOURNAMENT } = require('../constants/tournaments');
const { calculateWinnerPoints } = require('../constants/scoring');
const { hasTournamentStarted } = require('../utils/tournament');
const { isAdminUser, requireAdmin } = require('../constants/admin');
const { calculatePoints, resolveBetsForMatch } = require('../utils/bets');
const {
	getWinningTeamForTournament,
	getWinningTeamIdForTournament,
	setUserWinningTeam,
} = require('../utils/winningTeam');

module.exports = {
	// MUTATIONS
	createUser: async function ({ input }, req) {
		const name = input.name;
		const password = input.password;
		const confirmedPassword = input.confirmedPassword

		const existingUser = await User.findOne({ name: name });
		if (existingUser) {
			throw Error('Użytkownik o podanym nicku istnieje!');
		}
		if (password !== confirmedPassword) {
			throw Error('Hasła nie są ze sobą zgodne!')
		}
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			name: name,
			password: hashedPassword
		});
		const createdUser = await user.save();
		return {
			...createdUser._doc,
			id: createdUser._id.toString(),
			bets: []
		}
	},

	createMatch: async function ({ input }, req) {
		await requireAdmin(req);

		const homeTeamName = input.homeTeamName
		const awayTeamName = input.awayTeamName
		const startDate = input.date
		const stage = input.stage
		const tournament = ACTIVE_TOURNAMENT

		if (homeTeamName === awayTeamName) {
			throw new Error('Drużyna gospodarzy i gości muszą być różne!');
		}

		const homeTeam = await Team.findOne({ name: homeTeamName, tournament });
		const awayTeam = await Team.findOne({ name: awayTeamName, tournament });

		if (!homeTeam || !awayTeam) {
			throw new Error('Nie znaleziono drużyny w bieżącym turnieju!');
		}

		const match = new Match({
			homeTeam: homeTeam,
			awayTeam: awayTeam,
			startDate: Date.parse(startDate),
			stage: stage,
			tournament: tournament
		})
		const savedMatch = await match.save();
		const populatedMatch = await Match.findById(savedMatch._id)
			.populate('homeTeam')
			.populate('awayTeam')

		return formatMatch(populatedMatch)
	},

	placeBet: async function ({ input }, req) {
		if (!req.isAuth) {
			const error = new Error("User not authenticated")
			throw error;
		}
		const userId = req.userId;
		if (!userId) {
			const error = new Error("User not authenticated")
			throw error;
		}

		const user = await User.findById(userId);
		const match = await Match.findById(input.matchId)
			.populate('homeTeam')
			.populate('awayTeam')

		const currentDate = new Date()
		const matchStartDate = match.startDate;

		if (matchStartDate < currentDate) {
			const error = new Error("Nie można typować po rozpoczęciu spotkania!")
			throw error;
		}

		if (match.tournament !== ACTIVE_TOURNAMENT) {
			const error = new Error("Nie można typować w zakończonym turnieju!")
			throw error;
		}

		let existingBet = await Bet.findOne({ match: input.matchId, better: userId })
		if (existingBet) {
			existingBet.homeTeamGoals = input.homeTeamGoals;
			existingBet.awayTeamGoals = input.awayTeamGoals;
			const updatedBet = await existingBet.save();
			return {
				...updatedBet._doc,
				id: updatedBet._id.toString()
			}
		}

		newBet = new Bet({
			homeTeamGoals: input.homeTeamGoals,
			awayTeamGoals: input.awayTeamGoals,
			match: match,
			better: user
		});
		const placedBet = await newBet.save();
		user.bets.push(placedBet);
		await user.save();

		return {
			...placedBet._doc,
			id: placedBet._id.toString()
		}
	},

	updateUserTeam: async function ({ teamId }, req) {
		if (!req.isAuth || !req.userId) {
			throw new Error('User not authenticated');
		}

		const userId = req.userId;
		const user = await User.findById(userId)
			.populate({ path: 'winningTeams.team' })
			.populate('winningTeam')
		const team = await Team.findById(teamId);

		if (!team || team.tournament !== ACTIVE_TOURNAMENT) {
			throw new Error('Nie można wybrać drużyny spoza bieżącego turnieju!');
		}

		const currentTeamId = getWinningTeamIdForTournament(user, team.tournament);

		if (currentTeamId === teamId) {
			return {
				...user._doc,
				id: user._id.toString()
			}
		}

		if (await hasTournamentStarted(team.tournament)) {
			throw new Error('Nie można zmienić typu na mistrza po rozpoczęciu turnieju!');
		}

		setUserWinningTeam(user, team);
		const savedUser = await user.save();

		return {
			...savedUser._doc,
			id: savedUser._id.toString()
		}
	},

	endMatch: async function ({ matchId }, req) {
		await requireAdmin(req);

		const match = await Match.findById(matchId)
		if (!match) {
			const error = new Error("Couldn't find match with given ID")
			throw error
		}
		match.hasEnded = true
		const savedMatch = await match.save()
		await resolveBetsForMatch(savedMatch)
		const populatedMatch = await Match.findById(savedMatch._id)
			.populate('homeTeam')
			.populate('awayTeam')
		return formatMatch(populatedMatch)
	},

	updateMatchResult: async function ({ input }, req) {
		await requireAdmin(req);

		const { matchId, homeTeamGoals, awayTeamGoals } = input;

		if (homeTeamGoals < 0 || awayTeamGoals < 0) {
			throw new Error('Liczba bramek nie może być ujemna!');
		}

		const match = await Match.findById(matchId)
		if (!match) {
			throw new Error('Nie znaleziono meczu o podanym ID!');
		}

		match.homeTeamGoals = homeTeamGoals;
		match.awayTeamGoals = awayTeamGoals;
		match.hasEnded = true;
		const savedMatch = await match.save();
		await resolveBetsForMatch(savedMatch);

		const populatedMatch = await Match.findById(savedMatch._id)
			.populate('homeTeam')
			.populate('awayTeam')
		return formatMatch(populatedMatch)
	},

	declareTournamentWinner: async function ({ teamId }, req) {
		await requireAdmin(req);

		const team = await Team.findById(teamId);
		if (!team || team.tournament !== ACTIVE_TOURNAMENT) {
			throw new Error('Nie znaleziono drużyny w bieżącym turnieju!');
		}

		await Team.updateMany(
			{ tournament: team.tournament },
			{ $set: { didWin: false } }
		);
		team.didWin = true;
		const savedTeam = await team.save();

		return {
			...savedTeam._doc,
			id: savedTeam._id.toString()
		}
	},

	updateUserPassword: async function ({ input }, req) {
		const user = await User.findOne({ name: input.name });
		if (!user) {
			const error = new Error("Couldn't find user with given name")
			throw error
		}
		const updatedPassword = await bcrypt.hash(input.password, 12);
		user.password = updatedPassword;
		const savedUser = await user.save();

		return {
			...savedUser._doc,
			id: savedUser._id.toString()
		}
	},

	// QUERIES
	logIn: async function ({ input }, req) {
		const name = input.name;
		const password = input.password;

		const user = await User.findOne({ name: name });
		if (!user) {
			const error = new Error('Nie znaleziono użytkownika o podanym nicku!');
			error.code = 401;
			throw error;
		}

		const doPasswordsMatch = await bcrypt.compare(password, user.password);
		if (!doPasswordsMatch) {
			const error = new Error("Nieprawidłowe hasło!");
			error.code = 401;
			throw error;
		}

		const token = jwt.sign({
			userId: user._id.toString(),
			name: user.name
		}, 'somesupersecretsecret');

		return {
			token: token,
			userId: user._id.toString(),
			userName: user.name,
			isAdmin: isAdminUser(user.name)
		}
	},

	getUser: async function ({ userId }, req) {
		const user = await User.findById(userId)
			.populate('bets')
			.populate({ path: 'winningTeams.team' })
			.populate('winningTeam')

		if (!user) {
			const error = new Error('Nie znaleziono użytkownika o podanym nicku!');
			error.code = 401;
			throw error;
		}

		return {
			id: user._id.toString(),
			name: user.name,
			bets: user.bets,
			winningTeam: getWinningTeamForTournament(user, ACTIVE_TOURNAMENT)
		}
	},

	users: async function ({ tournament }, req) {
		const selectedTournament = resolveTournament(tournament);

		const bets = await Bet.find()
			.populate({
				path: 'match',
				populate: {
					path: 'homeTeam',
					model: 'Team'
				}
			})
			.populate({
				path: 'match',
				populate: {
					path: 'awayTeam',
					model: 'Team'
				}
			})
		for (const bet of bets) {
			if (!bet.match || bet.match.tournament !== selectedTournament) {
				continue;
			}
			if (!bet.isResolved && bet.match.hasEnded) {
				const points = calculatePoints(bet)
				bet.points = points
				bet.isResolved = true
				await bet.save();
			}
		}

		const users = await User.find()
			.populate({
				path: 'bets',
				populate: {
					path: 'match',
					populate: {
						path: 'homeTeam',
						model: 'Team'
					}
				}
			})
			.populate({
				path: 'bets',
				populate: {
					path: 'match',
					populate: {
						path: 'awayTeam',
						model: 'Team'
					}
				}
			})
			.populate({ path: 'winningTeams.team' })
			.populate('winningTeam')

		return users.map(user => {
			const tournamentBets = filterBetsByTournament(user.bets, selectedTournament);
			const winningTeam = getWinningTeamForTournament(user, selectedTournament);

			return {
				...user._doc,
				id: user._id.toString(),
				bets: tournamentBets,
				winningTeam,
				winnerPoints: calculateWinnerPoints(winningTeam)
			}
		})
	},

	matches: async function ({ tournament }, req) {
		const selectedTournament = resolveTournament(tournament);
		const matches = await Match.find({ tournament: selectedTournament })
			.populate('homeTeam')
			.populate('awayTeam')

		return matches.map(match => formatMatch(match))
	},

	teams: async function ({ tournament }, req) {
		const selectedTournament = resolveTournament(tournament);
		const teams = await Team.find({ tournament: selectedTournament })

		return teams.map(team => {
			return {
				...team._doc,
				id: team._id.toString()
			}
		})
	},

	tournamentHasStarted: async function ({ tournament }, req) {
		return hasTournamentStarted(tournament);
	},

	userBets: async function ({ userId, tournament }, req) {
		const selectedTournament = resolveTournament(tournament);

		const bets = await Bet
			.find({ better: userId })
			.populate({
				path: 'match',
				populate: {
					path: 'homeTeam',
					model: 'Team'
				}
			})
			.populate({
				path: 'match',
				populate: {
					path: 'awayTeam',
					model: 'Team'
				}
			})

		const tournamentBets = bets.filter(
			bet => bet.match && bet.match.tournament === selectedTournament
		);

		let didResolve = false
		for (const bet of tournamentBets) {
			if (!bet.isResolved && bet.match.hasEnded) {
				didResolve = true
				const points = calculatePoints(bet)
				bet.points = points
				bet.isResolved = true
				await bet.save();
			}
		}

		if (didResolve) {
			const updatedBets = await Bet
				.find({ better: userId })
				.populate({
					path: 'match',
					populate: {
						path: 'homeTeam',
						model: 'Team'
					}
				})
				.populate({
					path: 'match',
					populate: {
						path: 'awayTeam',
						model: 'Team'
					}
				})
			return filterBetsByTournament(updatedBets, selectedTournament).map(bet => {
				return {
					...bet._doc,
					id: bet._id.toString()
				}
			})
		}

		return tournamentBets.map(bet => {
			return {
				...bet._doc,
				id: bet._id.toString()
			}
		})
	},

	scalarTypes
}

function filterBetsByTournament(bets, tournament) {
	return bets.filter(bet => bet.match && bet.match.tournament === tournament);
}

function formatMatch(match) {
	return {
		...match._doc,
		id: match._id.toString()
	}
}