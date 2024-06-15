const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Match = require('../models/match');
const Team = require('../models/team');
const Bet = require('../models/bet');
const scalarTypes = require('../graphql/scalar-types');
const { graphql } = require('graphql');
const bet = require('../models/bet');

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
		const homeTeamName = input.homeTeamName
		const awayTeamName = input.awayTeamName
		const startDate = input.date
		const stage = input.stage
		const homeTeam = await Team.findOne({ name: homeTeamName });
		const awayTeam = await Team.findOne({ name: awayTeamName });

		const match = new Match({
			homeTeam: homeTeam,
			awayTeam: awayTeam,
			startDate: Date.parse(startDate),
			stage: stage
		})
		const savedMatch = await match.save();
		console.log(savedMatch)

		return {
			...savedMatch._doc,
			id: savedMatch._id.toString()
		}
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
		console.log(currentDate)
		console.log(matchStartDate)

		if (matchStartDate < currentDate) {
			const error = new Error("Nie można typować po rozpoczęciu spotkania!")
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
		const userId = req.userId;
		const user = await User.findById(userId)
			.populate('winningTeam')
		const team = await Team.findById(teamId);

		user.winningTeam = team;
		const savedUser = await user.save();
		console.log(savedUser)

		return {
			...savedUser._doc,
			id: savedUser._id.toString()
		}
	},

	endMatch: async function ({ matchId}, req) {
		const match = await Match.findById(matchId)
		if (!match) {
			const error = new Error("Couldn't find match with given ID")
			throw error
		}
		match.hasEnded = true
		const savedMatch = await match.save()
		return {
			...savedMatch._doc,
			id: savedMatch._id.toString()
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
			userId: user._id.toString()
		}
	},

	getUser: async function ({ userId }, req) {
		const user = await User.findById(userId)
			.populate('bets')
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
			winningTeam: user.winningTeam
		}
	},

	users: async function (_, req) {
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
			if (!bet.isResolved && bet.match.hasEnded) {
				const points = calculatePoints(bet)
				bet.points = points
				bet.isResolved = true
				savedBet = await bet.save();
				console.log(savedBet);
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
			.populate('winningTeam')

		return users.map(user => {
			return {
				...user._doc,
				id: user._id.toString()
			}
		})
	},

	matches: async function (_, req) {
		const matches = await Match.find()
			.populate('homeTeam')
			.populate('awayTeam')

		return matches.map(match => {
			return {
				...match._doc,
				id: match._id.toString()
			}
		})
	},

	teams: async function (_, req) {
		const teams = await Team.find()

		return teams.map(team => {
			return {
				...team._doc,
				id: team._id.toString()
			}
		})
	},

	userBets: async function ({ userId }, req) {
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

		let didResolve = false
		for (const bet of bets) {
			if (!bet.isResolved && bet.match.hasEnded) {
				didResolve = true
				const points = calculatePoints(bet)
				bet.points = points
				bet.isResolved = true
				savedBet = await bet.save();
				console.log(savedBet);
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
			return updatedBets.map(bet => {
				return {
					...bet._doc,
					id: bet._id.toString()
				}
			})
		}

		return bets.map(bet => {
			return {
				...bet._doc,
				id: bet._id.toString()
			}
		})
	},

	scalarTypes
}

function calculatePoints(bet) {
	if (
		bet.homeTeamGoals === bet.match.homeTeamGoals &&
		bet.awayTeamGoals === bet.match.awayTeamGoals
	) {
		return 3
	} else if (
		bet.match.homeTeamGoals > bet.match.awayTeamGoals &&
		bet.homeTeamGoals > bet.awayTeamGoals
	) {
		return 1
	} else if (
		bet.match.homeTeamGoals === bet.match.awayTeamGoals &&
		bet.homeTeamGoals === bet.awayTeamGoals
	) {
		return 1
	} else if (
		bet.match.homeTeamGoals < bet.match.awayTeamGoals &&
		bet.homeTeamGoals < bet.awayTeamGoals
	) {
		return 1
	} else {
		return 0
	}
}