import { Request, Response } from 'express';

// --- POWERFUL MOCK AI CONTROLLER ---
export const getAiPriceSuggestion = async (req: Request, res: Response) => {
  try {
    const { title, category, condition, description } = req.body;

    console.log(`[AI] Starting analysis for item: "${title}"...`);

    // Simulate thinking delay (1.5 - 2.5 seconds)
    const delay = 1500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Base price by category
    const lowerCat = (category || "").toLowerCase();
    let basePrice = 5000;

    if (lowerCat.includes("tech") || lowerCat.includes("electron")) basePrice = 60000;
    else if (lowerCat.includes("fashion") || lowerCat.includes("cloth")) basePrice = 4000;
    else if (lowerCat.includes("home") || lowerCat.includes("furniture")) basePrice = 12000;
    else if (lowerCat.includes("vehicle")) basePrice = 1500000;
    else if (lowerCat.includes("music") || lowerCat.includes("instrument")) basePrice = 25000;
    else if (lowerCat.includes("sports") || lowerCat.includes("outdoor")) basePrice = 15000;
    else if (lowerCat.includes("book") || lowerCat.includes("education")) basePrice = 2000;

    //Adjust for condition
    const cond = (condition || "").toLowerCase();
    if (cond.includes("brand new")) basePrice *= 1.3;
    if (cond.includes("like new")) basePrice *= 1.15;
    if (cond.includes("used - good")) basePrice *= 0.8;
    if (cond.includes("used - fair")) basePrice *= 0.6;
    if (cond.includes("for parts")) basePrice *= 0.2;

    //Optional description analysis (simulate smarter AI)
    let descMultiplier = 1;
    if (description && description.length > 100) descMultiplier += 0.05; // +5% for detailed description
    if (description && description.toLowerCase().includes("limited edition")) descMultiplier += 0.15; // +15% for rare items
    basePrice *= descMultiplier;

    //Add randomness: ±10-20% variance
    const variance = Math.floor(Math.random() * (basePrice * 0.2)) - (basePrice * 0.1);
    const finalPrice = Math.max(500, Math.round((basePrice + variance) / 100) * 100); // round to nearest 100

    console.log(`[AI] Finished analysis. Suggested price: ${finalPrice} LKR`);

    //Return the mock AI price
    return res.status(200).json({
      success: true,
      price: finalPrice,
      message: "AI Estimation successful"
    });

  } catch (error: any) {
    console.error("[AI ERROR]", error);
    return res.status(500).json({ success: false, message: "AI failed to estimate price." });
  }
};
