import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
    try {
        const { stats, dataInsights, selectedModel } = await request.json();
        const envKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        if (!envKey) {
            return NextResponse.json({ error: "Missing Gemini API Key." }, { status: 401 });
        }

        const genAI = new GoogleGenerativeAI(envKey);
        const model = genAI.getGenerativeModel({ model: selectedModel || 'gemini-2.5-flash' });

        const prompt = `
      Analyze this sales data summary and provide short, clear business insights.
      
      Metrics:
      - Total Revenue: ${stats?.revenue}
      - Total Orders: ${stats?.orders}
      - Net Profit: ${stats?.profit}
      - Top Product: ${dataInsights?.bestProduct?.name}
      - Top Channel: ${dataInsights?.bestChannel?.name}
      - Best Conversion Channel: ${dataInsights?.bestConvChannel?.name} (${dataInsights?.bestConvChannel?.val?.toFixed(2)}%)
      
      Return the response in this exact JSON format:
      {
        "alerts": ["string", "string"],
        "opportunities": ["string", "string"],
        "suggestions": ["string", "string"]
      }
      Keep each insight under 15 words. Focused on business strategy.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);

        return NextResponse.json(JSON.parse(jsonStr));

    } catch (error) {
        console.error('API /api/insights Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
