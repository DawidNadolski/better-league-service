const { GraphQLScalarType } = require('graphql');

module.exports = {
	dateScalar: new GraphQLScalarType({
		name: 'Date',
		parseValue(value) {
			return new Date(value);
		},
		serialize(value) {
			return value.toISOString();
		}
	})
}
  