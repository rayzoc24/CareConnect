require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/classify-urgency', async (req, res) => {
    try {
        const { description } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        // The Gemini model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
        Analyze the following description of an NGO's need and classify its urgency as exactly one of: "Low", "Medium", "High", or "Critical".
        Use the following guidelines for priority:
        - Critical: Life-threatening situations, immediate lack of basic survival needs (e.g., freezing, starving, medical emergencies).
        - High: Severe lack of essential supplies affecting health or well-being in the short term.
        - Medium: Important needs but not immediately life-threatening (e.g., general fund shortages, standard clothing).
        - Low: Non-essential or long-term needs (e.g., library books, future events).
        
        Respond ONLY with a JSON object in this exact format, with no markdown formatting or extra text:
        {"urgency": "<Urgency>"}

        Description: ${description}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Try to parse JSON from the response text
        let parsedResponse;
        try {
            // Clean up any potential markdown code blocks
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedResponse = JSON.parse(cleanedText);
            
            // Normalize the urgency value to be safe
            const u = parsedResponse.urgency ? parsedResponse.urgency.toLowerCase() : 'medium';
            let normalizedUrgency = 'Medium';
            if (u === 'critical') normalizedUrgency = 'Critical';
            else if (u === 'high') normalizedUrgency = 'High';
            else if (u === 'low') normalizedUrgency = 'Low';
            
            res.json({ urgency: normalizedUrgency });
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', responseText);
            res.json({ urgency: 'Medium' }); // Fallback
        }
        
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to classify urgency', urgency: 'Medium' }); // Send fallback urgency even on error
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
