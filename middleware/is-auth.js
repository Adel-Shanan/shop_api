const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    const authHeader = req.get('Authorization');

    if(!authHeader){
        const error = new Error('not authenticated');

        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'somesupersecretsecret');
    }
    catch (err){
        err.statusCode = 500;
        throw err;
    }

    if(!decodedToken){
        const error = new Error('Not authienticated!!');
        error.statusCode = 401;
        throw error;
    }

    // if we passed to here we know that we have a valid token however and that we able to decode it

    // we will store the user id in the request so that i can use it in other places where request will go like in the routes 
    req.userId = decodedToken.userId;

    next();
}