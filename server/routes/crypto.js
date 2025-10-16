import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.get("/prices", async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.CMC_BASE_URL}/v1/cryptocurrency/quotes/latest`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY,
        },
        params: {
          symbol: req.query.symbol || "BTC,ETH",
          convert: "USD",
        },
      }
    );

    const data = response.data.data;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch crypto data" });
  }
});

export default router;
