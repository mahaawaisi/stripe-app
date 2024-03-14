"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateCustomer = exports.listPaymentMethods = exports.createSetupIntent = void 0;
const _1 = require(".");
const firebase_1 = require("./firebase");
/**
 *  creates setupintent used to save a credit card for later use
 */
async function createSetupIntent(userId) {
    const customer = await getOrCreateCustomer(userId);
    return _1.stripe.setupIntents.create({
        customer: customer.id,
    });
}
exports.createSetupIntent = createSetupIntent;
async function listPaymentMethods(userId) {
    const customer = await getOrCreateCustomer(userId);
    return _1.stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
    });
}
exports.listPaymentMethods = listPaymentMethods;
/**
 * Get existing Stripe customer or creates new one
 */
async function getOrCreateCustomer(userId, params) {
    const userSnapshot = await firebase_1.db.collection('users').doc(userId).get();
    const { stripeCustomerId, email } = userSnapshot.data();
    if (!stripeCustomerId) {
        const customer = await _1.stripe.customers.create(Object.assign({ email, metadata: {
                firebaseUID: userId
            } }, params));
        await userSnapshot.ref.update({ stripeCustomerId: customer.id });
        return customer;
    }
}
exports.getOrCreateCustomer = getOrCreateCustomer;
//# sourceMappingURL=customers.js.map