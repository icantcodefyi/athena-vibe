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
    const { prompt, player, gameState } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return a default fallback message if no API key is set
      return NextResponse.json({
        message: getFallbackAIMessage(player?.role),
      });
    }

    // Call OpenAI API with enhanced system prompt
    const systemPrompt = getSystemPrompt(player?.role);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    // Extract the generated message from the response
    const aiMessage = response.choices[0]?.message?.content?.trim() || getFallbackAIMessage(player?.role);

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ message: getFallbackAIMessage() });
  }
}

// Enhanced system prompts based on player role
function getSystemPrompt(role?: string): string {
  const basePrompt = "You are a player in a Mafia social deduction game. Generate a realistic, strategic message (1-2 sentences) that a player would say during discussion or voting. Be contextual, reference other players or previous comments, and stay true to your role's strategy.";
  
  switch (role) {
    case 'mafia':
      return `${basePrompt} As Mafia, you want to appear innocent while subtly directing suspicion toward others. Be deceptive but not obvious. Occasionally defend other players to seem fair. Never reveal your true role.`;
    
    case 'detective':
      return `${basePrompt} As Detective, you have special knowledge from investigations but shouldn't reveal your role directly. Use your reasoning to guide the group toward the right suspects while protecting your identity. Be logical and observant.`;
    
    case 'doctor':
      return `${basePrompt} As Doctor, you want to help the group identify Mafia without revealing your role. Show concern for group safety while subtly guiding the discussion. You can occasionally hint at important information without being obvious.`;
    
    case 'villager':
      return `${basePrompt} As Villager, you're trying to deduce who might be Mafia through careful observation. Analyze voting patterns, contradictions in statements, or suspicious behavior. Be thoughtful but sometimes uncertain, as you have limited information.`;
    
    default:
      return basePrompt;
  }
}

// Improved fallback messages in case the API call fails
function getFallbackAIMessage(role?: string): string {
  const genericMessages = [
    "Looking at the voting patterns, something doesn't add up.",
    "I've been watching everyone's behavior carefully.",
    "Let's analyze who's been defending whom so far.",
    "The inconsistencies in some people's arguments are telling.",
    "I think we need to consider who's been quiet and who's been vocal."
  ];
  
  const mafiaMessages = [
    "Based on their behavior, I'm starting to suspect someone other than me.",
    "I've noticed some inconsistencies in what's being said.",
    "Let's not rush to judgment without evidence.",
    "I think we should focus on the facts we know for certain.",
    "Has anyone noticed the contradictions in some statements?"
  ];
  
  const detectiveMessages = [
    "I've gathered some useful information over the past few nights.",
    "Let's think critically about who's been defensive.",
    "The evidence suggests we should look more closely at certain players.",
    "I've been analyzing everyone's behavior patterns.",
    "I have reasons to believe we're overlooking something important."
  ];
  
  const doctorMessages = [
    "We need to protect our key players.",
    "I think we can deduce who might be targeted next.",
    "Let's consider who's been contributing valuable insights.",
    "We should be careful about who we eliminate today.",
    "I have my suspicions, but let's hear everyone out first."
  ];
  
  if (role === 'mafia') {
    return mafiaMessages[Math.floor(Math.random() * mafiaMessages.length)];
  } else if (role === 'detective') {
    return detectiveMessages[Math.floor(Math.random() * detectiveMessages.length)];
  } else if (role === 'doctor') {
    return doctorMessages[Math.floor(Math.random() * doctorMessages.length)];
  } else {
    return genericMessages[Math.floor(Math.random() * genericMessages.length)];
  }
} 