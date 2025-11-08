import express from "express";
import { paymentMiddleware } from "x402-express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'https://four022.onrender.com/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Transaction-Hash']
}));

// Configure x402 payment middleware
app.use(paymentMiddleware(
  process.env.WALLET_ADDRESS,  // Your wallet address
  {
    "GET /api/data": {  // Your protected endpoint
      price: "$0.01",   // Price in USD
      network: "base",  // Use "base" for mainnet
    },
  },
  {
    url: "https://x402.org/facilitator"  // Payment facilitator
  }
));

// Your API endpoint
app.get("/api/data", (req, res) => {
  res.json({ 
    message: "This is paid content!",
    data: "Your premium data here"
  });
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
