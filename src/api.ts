import express, {Request, Response, NextFunction} from 'express';
export const app = express(); // app is api, recieving incoming requests, sends outbound response 
import cors from 'cors';
import { createStripeCheckoutSession } from './checkout';
import { createPaymentIntent } from './payments';
import { handleStripeWebhook } from './webhooks';
import { auth } from './firebase';
import { createSetupIntent, listPaymentMethods } from './customers';
import { cancelSubscription, listSubscriptions } from './billing';

// only listen to requests from stripe
app.use(express.json({
    verify: (req, res, buffer) => (req['rawBody'] = buffer),
})
);
app.use(cors({origin: true}));
app.use(decodeJWT);

app.post('./wallet', runAsync(async(req:Request, res:Response) =>{
    const user = validateUser(req);
    const setupIntent = await createSetupIntent(user.uid);
    res.send(setupIntent);
}))

app.get('/wallet', runAsync(async (req: Request, res: Response) => {
      const user = validateUser(req);
      const wallet = await listPaymentMethods(user.uid);
      res.send(wallet.data);
    })
);

app.post('/test', (req: Request, res: Response) =>{
    const amount = req.body.amount;

    // ok response is status code 200
    res.status(200).send({with_tax: amount * 7});
});

app.post('/checkouts/', runAsync (async({body}: Request, res: Response) =>{
    res.send(
        await createStripeCheckoutSession(body.line_items)
        );
    })
);

app.post('/payments', runAsync(async({body}: Request, res: Response)=>{
    res.send(
        await createPaymentIntent(body.amount)
        );
    }) 
);

app.post('./hooks', runAsync(handleStripeWebhook));

app.get('./subscriptions/', runAsync(async(req:Request, res:Response)=>{
    const user = validateUser(req);
    const subscriptions = await listSubscriptions(user.uid);
}));

// update subscription
app.patch('./subscriptions/:id', runAsync(async(req:Request, res:Response)=>{
    const user = validateUser(req);
    res.send(await cancelSubscription(user.uid, req.params.id));
}));

// for async errors when awaiting promise
function runAsync(callback: Function){
    return (req: Request, res: Response, next: NextFunction) => {
        callback(req, res, next).catch(next);
    };
}

/**
 * Decodes the JSON Web Token sent via the frontend app
 * Makes the currentUser (firebase) data available on the body.
 */
async function decodeJWT(req: Request, res: Response, next: NextFunction) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
      const idToken = req.headers.authorization.split('Bearer ')[1];
  
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req['currentUser'] = decodedToken;
      } catch (err) {
        console.log(err);
      }
    }
  
    next();
  }
    
/**
 * Throws an error if the currentUser does not exist on the request
 */
function validateUser(req: Request) {
    const user = req['currentUser'];
    if (!user) {
    throw new Error(
        'You must be logged in to make this request. i.e Authroization: Bearer <token>'
    );
    }

    return user;
}