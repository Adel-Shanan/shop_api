require('dotenv').config();


const express = require('express');
const bodyParser = require('body-parser');


const mongoose = require('mongoose');



const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./util/cloudinary');



const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');


const MONGODB_URI =  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@nodecoursecluster.ifg3pyi.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority&appName=nodeCourseCluster`;


const app = express();


app.use(helmet(
  {
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "https://js.stripe.com"],
        "frame-src": ["'self'", "https://js.stripe.com"],
        "img-src": [
          "'self'",
          "data:",
          "https://res.cloudinary.com"
        ],
      }
    },
  })
);
app.use(compression());
app.use(morgan('combined'));



/*
(process.env.NODE_ENV)
this is a special environment variable even
though it's not set by default, expressjs will actually use that by default to determine
the environment mode and if you set that to production, expressjs will change certain things
and for example, it will reduce the details for errors it throws and in general, optimize some things for deployment.
and again hosting providers typically do that for you.*/
console.log(process.env.NODE_ENV);



const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});


const adminRoutes = require('./routes/admin.js');
const shopRoutes = require('./routes/shop.js');
const authRoutes = require('./routes/auth.js');




// order does matter for the use methodes

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage:storage}).single('image'))

//app.use(express.static(path.join(__dirname, 'public')));



// this to avoid CORS Errors 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // (*) here means wildcard You could lock it down to specific domains though if you wanted to
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // we can use wildcard
    next();
})


//Now only routes starting with  /admin  will go into the admin routes file
app.use('/admin' , adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


//Now express is clever enough to detect that this is a special kind of middleware and it will move (((( directlyyyyyy )))
// to these error handling middlewares when you call next with an error passed to it
app.use( (error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;

    const data = error.data;

    res.status(status).json({message: message, data: data});
});






mongoose
  .connect(MONGODB_URI)
  .then(result => {

    // this if you wanted to configure an ssl manually on our own but when depoly the host provider manage ssl will do that for us 
  
    /* 
          https.createServer({key: privateKey, cert: certificate}, app)
           .listen(process.env.PORT || 3000 , () => {
             console.log('Server running at http://localhost:3000');

           });
    */

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    
  })
  .catch(err => {
    console.log(err);
  });
