const router = require('express').Router();
const auth   = require('../middleware/auth');
const role   = require('../middleware/role');
const paymentCtrl  = require('../controllers/paymentController');
const refundCtrl   = require('../controllers/refundController');
const webhookCtrl  = require('../controllers/webhookController');

// Public — fee preview
router.get('/fees/:courseId', paymentCtrl.calculateFees);

// Public — Razorpay key
router.get('/key', paymentCtrl.getKey);

// Authenticated — learner
router.post('/create-order', auth, paymentCtrl.createOrder);
router.get('/checkout-options', auth, paymentCtrl.getCheckoutOptions);
router.post('/verify',       auth, paymentCtrl.verifyPayment);
router.post('/dummy-verify', auth, paymentCtrl.dummyVerify);
router.get('/history',        auth, paymentCtrl.getHistory);
router.post('/report-failure', auth, paymentCtrl.reportFailure);
router.post('/raise-query',   auth, paymentCtrl.raisePaymentQuery);
router.post('/refund',        auth, refundCtrl.requestRefund);
router.get('/refund/:id',     auth, refundCtrl.getRefundStatus);
router.get('/coupons/usage-history', auth, role('learner'), paymentCtrl.getCouponUsageHistory);
router.get('/coupons/validate', auth, role('learner'), paymentCtrl.validateCoupon);

// Authenticated — educator
router.post('/educator/onboard', auth, role('educator'), paymentCtrl.onboardEducator);
router.get('/earnings', auth, role('educator'), paymentCtrl.getEarnings);
router.post('/coupons', auth, role('educator', 'admin'), paymentCtrl.createCoupon);
router.get('/coupons', auth, role('educator', 'admin'), paymentCtrl.getCoupons);
router.patch('/coupons/:id/deactivate', auth, role('educator', 'admin'), paymentCtrl.deactivateCoupon);
router.get('/coupons/analytics', auth, role('educator', 'admin'), paymentCtrl.getCouponAnalytics);
router.patch('/coupons/:id', auth, role('educator', 'admin'), paymentCtrl.updateCoupon);
router.patch('/coupons/:id/reactivate', auth, role('educator', 'admin'), paymentCtrl.reactivateCoupon);

// Webhook — no auth, raw body handled in app.js
router.post('/webhook', webhookCtrl.handleWebhook);

module.exports = router;
