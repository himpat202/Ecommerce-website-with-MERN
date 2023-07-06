const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const dotenv = require("dotenv")
dotenv.config({path:"backend/config/config.env"})
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// console.log("printing it")
// console.log(process.env.STRIPE_SECRET_KEY);

exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  const { amount } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    metadata: {
      company: "Ecommerce",
    },
  });

  res.status(200).json({ success: true, client_secret: paymentIntent.client_secret });
});

exports.sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});
