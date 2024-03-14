import {stripe} from './';


export async function createPaymentIntent(amount: number){
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        // recipient email: hello@fireside....
    });
    return paymentIntent;
}