const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type RootMutation {
        createUser(input: UserSignupInput!): User!
        createMatch(input: MatchInput!): Match!
        createTeam(teamName: String): Team!
        placeBet(input: BetInput!): Bet!
    }

    type RootQuery {
        logIn(input: UserLoginInput!): AuthorizationData!
        user: User!
        bets(userId: ID!): [Bet!]!
        matches: [Match]!
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
    }

    type Bet {
        id: ID!
        homeTeamGoals: Int!
        awayTeamGoals: Int!
        match: Match!
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
    }

    type Team {
        id: ID!
        name: String!
        goalsScored: Int!
        goalsConceded: Int!
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