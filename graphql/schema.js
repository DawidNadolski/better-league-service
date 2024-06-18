const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type RootMutation {
        createUser(input: UserSignupInput!): User!
        createMatch(input: MatchInput!): Match!
        placeBet(input: BetInput!): Bet!
        updateUserTeam(teamId: ID!): User!
        endMatch(matchId: ID!): Match!
        updateUserPassword(input: UserLoginInput!): User!
    }

    type RootQuery {
        logIn(input: UserLoginInput!): AuthorizationData!
        getUser(userId: ID!): UserData!
        users: [UserData!]!
        userBets(userId: ID!): [Bet!]!
        matches: [Match]!
        teams: [Team!]!
    }

    schema {
        mutation: RootMutation
        query: RootQuery
    }

    scalar Date

    type User {
        id: ID!
        name: String!
        password: String
        points: Int!
        bets: [Bet]
        winningTeam: Team
    }

    type UserData {
        id: ID!
        name: String!
        bets: [Bet]
        winningTeam: Team
    }

    type Bet {
        id: ID!
        homeTeamGoals: Int!
        awayTeamGoals: Int!
        match: Match!
        isResolved: Boolean!
        points: Int!
        better: User!
    }

    type Match {
        id: ID!
        homeTeam: Team!
        homeTeamGoals: Int!
        awayTeam: Team!
        awayTeamGoals: Int!
        startDate: Date!
        hasEnded: Boolean!
        stage: String!
    }

    type Team {
        id: ID!
        name: String!
        group: String!
        isPlaying: Boolean!
        didWin: Boolean!
    }

    type AuthorizationData {
        token: String!
        userId: String!
    }

    input BetInput {
        matchId: ID!
        homeTeamGoals: Int!
        awayTeamGoals: Int!
    }

    input MatchInput {
        homeTeamName: String!
        awayTeamName: String!
        stage: String!
        date: Date!
    }

    input UserSignupInput {
        name: String!
        password: String!
        confirmedPassword: String!
    }

    input UserLoginInput {
        name: String!
        password: String!
    }
`)