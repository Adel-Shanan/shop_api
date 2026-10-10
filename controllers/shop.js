const fs = require('fs');
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_KEY); // always keep this privte so only use it in node code

const PDFDocument = require('pdfkit');

const Product = require('../models/product.js');
const User = require('../models/user.js');
const Order = require('../models/order.js');





const ITEMS_PER_PAGE = 1;





/*

exports.getIndex =  async (req, res , next ) => {
    
    try {
       
    }
    catch ( err ) {
    
    };
};

*/








exports.getProducts = async (req, res , next ) => {

  const currentPage = +req.query.page || 1;

  try {
    const totalItems = await Product.find().countDocuments();

    const products = await Product.find()
                           //.populate('userId')
                           .skip( (currentPage - 1) * ITEMS_PER_PAGE )
                           .limit(ITEMS_PER_PAGE);

    res.status(200).json({
        message: 'Fetched Products successfully',
        products: products,
        totalItems: totalItems,
        currentPage: currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE)
    })
        
  }
  catch ( err ) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };
  
};












exports.getProduct = async (req, res, next ) => {
  const prodId = req.params.productId;

  try {
    const product = await Product.findById(prodId);
    
    if(!product){
        const error = new Error('Could not find product.');
        error.statusCode = 404;

        throw error;
    }

    res.status(200).json({
        message: 'Product Fetched',
        product: product
    })

  }
  catch ( err ) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

};
















exports.postCart = async (req, res, next) => {
    
  
    try { 
        
        const prodId = req.body.productId;
        
        const product = await Product.findById(prodId);

        if(!product){
            const error = new Error('Could not find product.');
            error.statusCode = 404;
            throw error;
        }

        const user = await User.findById(req.userId);

         if(!user){
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401;
            throw error;
        }

        
        const result = await user.addToCart(product);

        console.log(result);
        
        res.status(201).json({
            message:'the product has been added to the cart!',
            product: product
        });
    }
    catch ( err ) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

};





















exports.getCart = async (req, res, next) => {
    
    try {
        const user = await User.findById(req.userId).populate('cart.items.productId');

        if(!user){
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401;
            throw error;
        }

        const products = user.cart.items;
        //console.log(products);


        res.status(200).json({
            message: 'Cart Fetched Successfully',
            products: products
        })
    }
    catch ( err ) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

  // My approach by implementing my own method in the user model to load the cart 

  // try { 
  // const user = await User.find({_id: req.userId});

  // const products = await user.getCart();

  // res.status(200).json({
  //         message: 'Cart Fetched Successfully',
  //         products: products
  //     })
  // }

  //   catch ( err ) {
  //         if(!err.statusCode){
  //             err.statusCode = 500;
  //         }
  //         next(err);
  //     };


};






















exports.deleteCartItem = async (req, res, next) => {


    try {
        const prodId = req.body.productId;

        const user = await User.findById(req.userId);

        if(!user){
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401;
            throw error;
        }


        const result = await user.deleteFromCart(prodId);
        //console.log(result);
        

        res.status(200).json({message: 'Product deleted from the cart successfully'})

    }
    catch ( err ) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

};
























// exports.createCheckoutSession = async (req, res, next) => {  


    
//     let products;
//     let total = 0;

//     try { 

//         const user = await User.findById(req.userId).populate('cart.items.productId');

//         if(!user){
//             const error = new Error('A user with this email could not be found');
//             error.statusCode = 401;
//             throw error;
//         }

//         products = user.cart.items;

//         if (products.length === 0) {
//             const error = new Error('Your cart is empty');
//             error.statusCode = 400;
//             throw error;
//         }

//         total = 0;

//         products.forEach(p => {
//             total += p.quantity * p.productId.price;
//         });


//         const frontendUrl = process.env.FRONTEND_URL;

//         if (!frontendUrl) {
//             throw new Error('FRONTEND_URL is not configured');
//         }

//         const baseUrl = frontendUrl.replace(/\/+$/, '');

//         const session = await stripe.checkout.sessions.create({

//             payment_method_types: ['card'],
//             mode: 'payment',
//             line_items: products.map(p => {
//                 return {

//                     price_data:{
                        
//                         product_data: {
//                             name: p.productId.title,
//                             description: p.productId.description
//                         },

//                         currency: 'usd',

//                         unit_amount:p.productId.price * 100

//                     },

//                     quantity: p.quantity
//                 };

//             }),

//             client_reference_id: user._id.toString(),


//             /*            NOTE VIDEO 357
//             Relying only on `success_url` is insecure since users can access it without paying.
//             For production, use Stripe **Webhooks** to verify successful payments; on localhost, manual verification via the Stripe Dashboard is sufficient.
//             */


//             /*
//             success_url: `${baseUrl}/checkout/success` + '?session_id={CHECKOUT_SESSION_ID}',

//             cancel_url: `${baseUrl}/checkout/cancel`
//             */

            
//             success_url: req.protocol + '://' + req.get('host') + '/checkout/success',    // => http://localhost:3000
//             cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
            
//         });


//         res.status(201).json({
//             message: 'Checkout session created successfully',
//             products: products,
//             totalSum: total,
//             sessionId: session.id,
//             checkoutUrl: session.url,
//             stripePublishableKey: process.env.STRIPE_PUBLISH_KEY
//         })


//     }
//     catch ( err ) {
//         if(!err.statusCode){
//             err.statusCode = 500;
//         }
//         next(err);
//     };
// };























// // this is as like ( getCheckoutSuccess )

// exports.postOrder = async (req, res, next) => {

//     try { 
//         const user = await User.findById(req.userId).populate('cart.items.productId');

//         if(!user){
//             const error = new Error('A user with this email could not be found');
//             error.statusCode = 401;
//             throw error;
//         }

//         const products = user.cart.items.map(i => {
//             return ({ product: { ...i.productId }, quantity: i.quantity }); // here productId  is the name of the whole product data because we named it like that in the user model .. just to keep in mind 
//         })
        
//         const order = new Order({ 
//             user: {
//                 email: user.email,
//                 userId: req.userId
//             },
            
//             items: products
//         });

//         await order.save();
    
//         user.cart = { items: [] };

//         await user.save();
        

//         // just to remember what the front-end should do
//         // res.redirect('/orders');
        
//         res.status(201).json({
//             message: 'Order created successfully',
//             order: order
//         });

//     }
//     catch ( err ) {
//         if(!err.statusCode){
//             err.statusCode = 500;
//         }
//         next(err);
//     };
// };






















exports.getOrders = async (req, res, next) => {

    try { 

        const orders = await Order.find({ 'user.userId': req.userId });
        console.log(orders);

        res.status(200).json({
            message: 'Fetched Orders successfully',
            orders: orders
        })
    }
    catch ( err ) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

};



















// exports.getInvoice = async (req, res, next) => {

//   const orderId = req.params.orderId;
  
//   try { 
//     const order = await Order.findById(orderId);
    
//     if(!order){
//       return next(new Error('No order Found'));
//     }

//     if(order.user.userId.toString() !== req.userId.toString()){
//       return next(new Error('unauthorized'));
//     }

//     const invoiceName = 'invoice-' + orderId + '.pdf';
//     const invoicePath = path.join('data', 'invoices', invoiceName);
    
//     const pdfDoc = new PDFDocument(); // its a readable stream

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')

//     pdfDoc.pipe(fs.createWriteStream(invoicePath)); // this ensure that the pdf we generate also gets stored on the server and not just serve to the client
//     pdfDoc.pipe(res);
    
//     pdfDoc.fontSize(26).text('Invoice', { underline: true} );
//     pdfDoc.text('---------------------------');
    

//     let totalprice=0;

//     order.items.forEach(prod => {
//       totalprice += prod.quantity * prod.product.price;
//       pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
//     })

//     pdfDoc.fontSize(26).text('---------------------------');
//     pdfDoc.fontSize(26).text('total price: $' + totalprice);

//     pdfDoc.end();

//     /* these two lines are not neccesry after using pdfkit to generate the pdf */
//     //const file = fs.createReadStream(invoicePath); // with that node will be able to read in the file step by step in different chunks
//     //file.pipe(res); // not every object is a writable stream but (res) happens to be one 
 
//   }
//   catch (err) {
//      next(err)
//   }

// };

