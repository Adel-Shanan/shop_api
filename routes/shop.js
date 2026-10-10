
const express = require('express');

const shopController = require('../controllers/shop.js');


const isAuth = require('../middleware/is-auth.js');
// isAuth can be added as an argument (its a handle) and the requests will be travel through the handlers from left to right


const router = express.Router();


// router.get( '/', shopController.getIndex );
// router.get( '/products', shopController.getProducts );
router.get(['/', '/products'], shopController.getProducts);

router.get( '/products/:productId', shopController.getProduct );

router.get( '/cart', isAuth, shopController.getCart );

router.post( '/cart', isAuth, shopController.postCart );

router.delete( '/cart-delete-item', isAuth, shopController.deleteCartItem );




// router.post( '/checkout', isAuth, shopController.createCheckoutSession);


// router.post('/checkout/success', shopController.postOrder);

// router.get('/checkout/cancel', shopController.createCheckoutSession);

// after video 357 we dont need that ( after added /checkout/success and /checkout/cancel )
//router.post('/create-order', isAuth, shopController.postOrder);

router.get( '/orders', isAuth, shopController.getOrders );

// router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router ;