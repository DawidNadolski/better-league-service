const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { createHandler } = require('graphql-http/lib/use/express');
const expressPlayground = require('graphql-playground-middleware-express').default;
const { ruruHTML } = require('ruru/server');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');

const app = express();

app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.use(
    '/graphql', 
    createHandler({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        context: (req, res) => {
            return {
                isAuth: req.raw.isAuth,
                userId: req.raw.userId
            }
        },
        formatError(error) {
            if (!error.originalError) {
                return error;
            }
            const data = error.originalError.data;
            const message = error.message || 'An error occurred.'
            const code = error.originalError.code || 500;
            return {
                message: message,
                status: code,
                data: data
            }
        }
    })
);

app.get('/playground', expressPlayground({ endpoint: '/graphql' }));

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json( { message: message, data: data });
});

mongoose.connect('mongodb+srv://dawidnadolski:4I8XcXByoQlixd8h@betterleaguecluster.ojrdnvg.mongodb.net/?retryWrites=true&w=majority&appName=BetterLeagueCluster')
    .then(_ => {
        app.listen(8080);
    })
    .catch(error => {
        console.log(error);
    });