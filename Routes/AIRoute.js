// backend/routes/aiRoute.js
import express from "express";
import { generateResponse } from "../openai.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await generateResponse(question);
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
