import { Request, Response } from 'express';

// --- MOCK AI CONTROLLER (Works Instantly, No Key Needed) ---
export const getAiPriceSuggestion = async (req: Request, res: Response) => {
  try {
    const { title, category, condition, description } = req.body;

    console.log(`[AI] Analyzing item: ${title}...`);

    // 1. Simulate "Thinking" Delay (1.5 seconds)
    // This makes the loading spinner show up on the frontend
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Logic to generate a realistic-looking price
    let basePrice = 5000;
    const lowerCat = (category || "").toLowerCase();

    // Set base price by category
    if (lowerCat.includes("tech") || lowerCat.includes("electron")) basePrice = 65000;
    else if (lowerCat.includes("fashion") || lowerCat.includes("cloth")) basePrice = 3500;
    else if (lowerCat.includes("home") || lowerCat.includes("furniture")) basePrice = 12000;
    else if (lowerCat.includes("vehicle")) basePrice = 1500000;
    else if (lowerCat.includes("music")) basePrice = 25000;

    // Adjust for condition
    if (condition === "Brand New") basePrice *= 1.3;
    if (condition === "Used - Good") basePrice *= 0.8;
    if (condition === "For Parts") basePrice *= 0.2;

    // Add randomness so it doesn't look hardcoded
    // Adds or subtracts up to 15% value
    const variance = Math.floor(Math.random() * (basePrice * 0.3)) - (basePrice * 0.15);
    const finalPrice = Math.max(500, Math.round((basePrice + variance) / 100) * 100); // Round to nearest 100

    console.log(`[AI] Suggested Price: ${finalPrice} LKR`);

    // 3. Return Success
    res.status(200).json({ 
      success: true,
      price: finalPrice,
      message: "AI Estimation successful"
    });

  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to estimate price." });
  }
};