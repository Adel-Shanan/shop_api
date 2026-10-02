
const crypto = require('crypto');

const jwt = require('jsonwebtoken');


const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');



const transport = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key:process.env.SENDGRID
    }
}));











exports.postLogin = async (req, res , next ) => {
    const email = req.body.email;
    const password = req.body.password;

    let loadedUser;

    try {
        const user = await User.findOne({email: email});
    
        if(!user){
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401;
            throw error;
        }
            

        loadedUser = user;

        const doMatch = await bcrypt.compare(password, user.password);
        
        if(!doMatch){
            const error = new Error('Wrong password!');
            error.statusCode = 401;
            throw error
        }

        const token = jwt.sign(
            {
                // dont store the raw password here because that would be returned to the frontend
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            },
            'somesupersecretsecret',  // the second argument is the secret so that the private key which is used for the signing and its only knwon in the server
            {expiresIn: '1h'}
        );


         res.status(200).json({
            token: token,
            userId: loadedUser._id.toString()
        });

        
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};
















exports.postSignup = async (req, res , next ) => {

    const errors = validationResult(req);

    console.log(errors);

    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered signup data is not correct')
        error.statusCode = 422;
        error.data = errors.array(); // we didnt do that before but this would allow me to keep my errors which were retrieved by that validation package

        throw error;
    }

    console.log('just looking for bugs');

    //make sure you check your view, how these inputs are named because you retrieve the values on request body by these names,
    const email = req.body.email;
    const password = req.body.password;

    
    try {

        // this is an asynchronous task and therefore this gives us back a promise
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            email: email,
            password: hashedPassword,
            cart: {items: []}
        });


        const result = await user.save();
    
        
        await transport.sendMail({
            to: email,
            from: 'robo513adel@gmail.com', // i have to use the verified email in sendgrid حصرا
            subject: 'Signup message to AA Shop',
            html: '<h1>welcome to our shop</h1>'
        });

        res.status(201).json({
            message: 'User created!',
            userId: result._id
        })

    }
    catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }

};





/*




exports.postLogout = (req, res , next ) => {

    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
};









exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    console.log(message);
    console.log(message.length);

    if(message.length > 0){
        message = message[0];
    }
    else{
        message = null;
    }
    console.log(message);

    res.render('auth/reset.ejs', {
        pageTitle:'Reset Your password ',
        path: '/reset',
        errorMessage: message
    })

};












exports.postReset = async (req, res, next) => {

    crypto.randomBytes(32, async (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset')
        }

        const token = buffer.toString('hex');

        try { 
            const user = await User.findOne({email: req.body.email});
            
            if(!user){
                req.flash('error', 'No account with that email found');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            const result = await user.save(); 

            const result2 = await transport.sendMail({
                to: req.body.email,
                from: 'robo513adel@gmail.com', // i have to use the verified email in sendgrid حصرا
                subject: 'this email because you cant remmember your password duh!',
                html: `
                    <p>You Requested a password reset</p>
                    <p> Click here <a href="http://localhost:3000/reset/${token}">Link</a> to set a new Password</p>
                `
            });
            
            res.redirect('/')
        }
        catch( err ) {
            //Well when we call next with an error passed as an argument, then we actually let express know that
            // an error occurred and it will skip all other middlewares and move right away to an error handling
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        };
    });
};













exports.getNewPassword = async (req, res, next) => {

    try { 

        const token = req.params.token;
    
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now() } })

            let message = req.flash('error');
            console.log(message);
            console.log(message.length);

            if(message.length > 0){
                message = message[0];
            }
            else{
                message = null;
            }
            console.log(message);

            res.render('auth/new-password.ejs', {
                pageTitle:'New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
    }

    catch( err ) {
        //Well when we call next with an error passed as an argument, then we actually let express know that
        // an error occurred and it will skip all other middlewares and move right away to an error handling
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
    };

};












exports.postNewPassword = async (req, res, next) => {

    const newPassword = req.body.password;
    const userId = req.body.userId;
    const token = req.body.passwordToken;

    let resetUser;

    try { 
        
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now() }, _id:userId })
        
        resetUser = user;
        
        const  hashedPassword = await bcrypt.hash(newPassword, 12);
            
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        const result = await resetUser.save();
    
        res.redirect('/login')
        
    }
    catch( err ) {
        //Well when we call next with an error passed as an argument, then we actually let express know that
        // an error occurred and it will skip all other middlewares and move right away to an error handling
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
    };

};



*/