import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
// Note: Ensure you've set OPENAI_API_KEY in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return a default fallback message if no API key is set
      return NextResponse.json({
        message: getFallbackAIMessage(),
      });
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a player in a Mafia game. Generate realistic, concise messages (max 1-2 sentences) that a player might say in the game. Be subtle and strategic based on your role."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    // Extract the generated message from the response
    const aiMessage = response.choices[0]?.message?.content?.trim() || getFallbackAIMessage();

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ message: getFallbackAIMessage() });
  }
}

// Fallback messages in case the API call fails
function getFallbackAIMessage(): string {
  const messages = [
    "I'm not sure who to suspect yet.",
    "We need to be careful with our votes.",
    "Who seems suspicious to everyone?",
    "I'm just trying to figure this out like everyone else.",
    "Let's think about who's been acting strange.",
    "I think we should focus on quiet players.",
    "I haven't seen anything suspicious yet.",
    "Let's observe everyone carefully.",
    "Who has been acting differently?",
    "I trust my instincts on this one."
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
} 