const Product = require('../models/product.js');
const User = require('../models/user');


const cloudinary = require('../util/cloudinary');


const { validationResult } = require('express-validator');











exports.getProducts = async (req, res , next ) => {
  

  try {

  // we added restriction {userId: req.userId} so that only users who created the product can edit or delete it 


  const totalItems = await Product.find().countDocuments({userId: req.userId});
  const products = await Product.find({userId: req.userId}); /* .select('title price -_id').populate('userId', 'name'); */ // populate and select got mentioned in video 221
  //console.log(products);
    
    
    res.status(200).json({
        message: 'Fetched Products successfully',
        products: products,
        totalItems: totalItems
    })

  }
  catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
  
};





















exports.postAddProduct =  async (req, res , next ) => {
    
    const errors = validationResult(req);
    //console.log(req.body);

    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;


    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is not correct')
        error.statusCode = 422;

        throw error;
    }


    console.log(image);

    if(!image){
        const error = new Error('no image provided!!');
        error.statusCode = 422;
        throw error;
    }


    console.log('here i am');

    const imageUrl = image.path;  

    
    const product = new Product(
        {
        title: title,
        price: price,
        description: description,
        imageUrl:imageUrl,
        imagePublicId: image.filename,
        userId: req.userId
    });

    console.log(product);

    try{

        const result = await product.save();

        //console.log('well....', result);
        console.log('Product got created');
        

        res.status(201).json({
            message:'a product has been created!',
            product: product
        });

    }
    catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }

};


























exports.editProduct = async (req, res, next) => {
    
    const errors = validationResult(req);

    console.log(errors);

    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is not correct')
        error.statusCode = 422;

        throw error;
    }
    
    const prodId = req.params.productId;

    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    const updatedImage = req.file; // note this
    console.log(updatedImage);

    let updatedImageUrl;
    let updatedImagePublicId;



    try {
        const product = await Product.findById(prodId);
    
        if (!product) {
            const error = new Error('Could not find Product.');
            error.statusCode = 404;

            throw error;
        }

        // to ensure that only the same user who added the product can make edit to the product
        if (product.userId.toString() !== req.userId.toString()) {
            const error = new Error(' Not authorized! to edit');
            error.statusCode = 403;
            throw error;
        }

        updatedImageUrl = product.imageUrl;
        updatedImagePublicId = product.imagePublicId;

        if(updatedImage){
            updatedImageUrl = req.file.path;    // updatedImage.path
            updatedImagePublicId = req.file.filename;     // updatedImage.filename
        }   

        // if no new image was passed we simply dont set it on the object
        if (updatedImageUrl !== product.imageUrl) {
            await cloudinary.uploader.destroy(product.imagePublicId);
                
            product.imageUrl = updatedImageUrl;
            product.imagePublicId = updatedImagePublicId;
        }

        
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;


        const result = await product.save();
                        
        //console.log(result);
        
        res.status(200).json({
            message:' Post updated!',
            product: result

        })
    
    }
    catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};























exports.deleteProduct = async (req, res, next) => {
    
    const prodId = req.params.productId;
    
    // this for deleting the image of the product ( added on video 334 )
    
    try {
        const product = await Product.findById(prodId);

        if(!product){
            const error = new Error('Could not find Product.');
            error.statusCode = 404;
                
            throw error;    
        }

        // this is to only allow user who created the post to delete it
        if(product.userId.toString() !== req.userId){
            const error = new Error(' Not authorized to delete!');
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findById(product.userId);

        if(!user){
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401;
            throw error;
        }

        await cloudinary.uploader.destroy(product.imagePublicId);

        await Product.findByIdAndDelete(prodId); // deleting product from the shop
        
        await user.deleteFromCart(prodId);  // deleting product from the cart if existed
    
        console.log('Product got destroyed... from the Controller');

        res.status(200).json({message: 'Product deleted successfully'})

    }
    catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }

};
