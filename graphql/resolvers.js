const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Match = require('../models/match');
const Team = require('../models/team');
const Bet = require('../models/bet');
const scalarTypes = require('../graphql/scalar-types');
const { graphql } = require('graphql');

module.exports = {
	createUser: async function({ input }, req) {
		const name = input.name;
		const password = input.password;
		const confirmedPassword = input.confirmedPassword
		//TODO: Validations and error handling

		const existingUser = await User.findOne({ name: name });
		if (existingUser) {
			throw Error('User exists already!');
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

	logIn: async function({ input }, req) {
		const name = input.name;
		const password = input.password;

		const user = await User.findOne({ name: name });
		if (!user) {
			console.log("Couldn't find user with given username");
			const error = new Error('User not found.');
            error.code = 401;
            throw error;
		}

		const doPasswordsMatch = await bcrypt.compare(password, user.password);
		if (!doPasswordsMatch) {
			console.log("Password doesn't match given user");
			const error = new Error("Password is incorrect");
            error.code = 401;
            throw error;
		}
		
		const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'somesupersecretsecret', { expiresIn: '1h' });

		return {
			token: token,
			userId: user._id.toString()
		}
	},

    user: async function(_, req) {
		return {
			_id: "id.toString()",
			name: "Dawid",
			email: "test@test.pl"
		}
    },

	matches: async function(_, req) {
		console.log(req.isAuth)
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

    createMatch: async function({ input }, req) {
		const homeTeamName = input.homeTeamName
		const awayTeamName = input.awayTeamName
		const homeTeam = await Team.findOne({ name: homeTeamName });
		const awayTeam = await Team.findOne({ name: awayTeamName });

		const match = new Match({
			homeTeam: homeTeam,
			awayTeam: awayTeam,
			startDate: Date()
		})
		const savedMatch = await match.save();

		return {
			...savedMatch._doc,
			id: savedMatch._id.toString()
		}
	},

	bets: async function({ userId }, req) {
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
		
		return bets.map(bet => {
			return {
				...bet._doc,
				id: bet._id.toString()
			}
		})
	},

	placeBet: async function({ input }, req) {
		//TODO: Replace with authenticated user
		const userId = "663eaf479b23e651a88c9a68"
		const user = await User.findById(userId);
		const match = await Match.findById(input.matchId)
			.populate('homeTeam')
			.populate('awayTeam')

		let existingBet = await Bet.findOne({ match: input.matchId, better: userId })
			.populate('better')
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

		console.log(existingBet);

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

		console.log(placedBet)

		return {
			...placedBet._doc,
			id: placedBet._id.toString()
		}
	},

	createTeam: async function({ teamName }, req) {
		const exisitngTeam = await Team.findOne({ name: teamName });
		if (exisitngTeam) {
			const error = new Error();
			error.message = "Team already exists";
			throw error;
		}

		const team = new Team( { name: teamName });
		const savedTeam = await team.save();

		return {
			...savedTeam._doc,
			id: savedTeam._id.toString()
		}
	},
	
	scalarTypes
}