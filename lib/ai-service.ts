"use client";

import { ChatMessage, GameState, Player } from "./game-types";

// Simulate AI player behavior based on role, game state, and current situation
export async function getAIMessage(
  player: Player,
  gameState: GameState,
  currentDay: number,
  playerToDiscussOrVote?: Player
): Promise<string> {
  try {
    const prompt = generatePrompt(player, gameState, currentDay, playerToDiscussOrVote);
    
    const response = await fetch('/api/ai-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player,
        gameState,
        currentDay,
        playerToDiscussOrVote,
        prompt
      }),
    });

    if (!response.ok) {
      throw new Error('AI service request failed');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('AI message generation error:', error);
    return getDefaultMessage(player, gameState, currentDay, playerToDiscussOrVote);
  }
}

// Generate night action decision for AI players
export async function getAINightAction(
  player: Player,
  gameState: GameState
): Promise<string | null> {
  if (!player.isAlive) return null;

  const potentialTargets = gameState.players.filter(p => 
    p.isAlive && p.id !== player.id
  );
  
  if (potentialTargets.length === 0) return null;
  
  // Enhanced strategic decision making for night actions
  if (player.role === 'mafia') {
    // Target players that seem suspicious of mafia or have been vocal
    const nonMafiaTargets = potentialTargets.filter(p => p.role !== 'mafia');
    if (nonMafiaTargets.length === 0) return potentialTargets[0].id;
    
    // Prioritize detectives and doctors if identified
    const specialRoleTargets = nonMafiaTargets.filter(p => 
      p.role === 'detective' || p.role === 'doctor'
    );
    
    if (specialRoleTargets.length > 0) {
      return specialRoleTargets[Math.floor(Math.random() * specialRoleTargets.length)].id;
    }
    
    // Find players who have accused mafia or seem suspicious of mafia
    const accusersIds = findAccusers(gameState.chatMessages, gameState.players, 'mafia');
    const accusers = nonMafiaTargets.filter(p => accusersIds.includes(p.id));
    
    if (accusers.length > 0) {
      return accusers[Math.floor(Math.random() * accusers.length)].id;
    }
    
    // Fallback to random non-mafia target
    return nonMafiaTargets[Math.floor(Math.random() * nonMafiaTargets.length)].id;
  }
  
  // Enhanced detective strategy
  if (player.role === 'detective') {
    // Try to investigate suspicious players first
    const suspiciousIds = findSuspiciousPlayers(gameState.chatMessages, gameState.players);
    const suspiciousPlayers = potentialTargets.filter(p => suspiciousIds.includes(p.id));
    
    if (suspiciousPlayers.length > 0) {
      return suspiciousPlayers[Math.floor(Math.random() * suspiciousPlayers.length)].id;
    }
    
    // Then try players who haven't been investigated yet
    // This would be better with a record of previous investigations
    return potentialTargets[Math.floor(Math.random() * potentialTargets.length)].id;
  }
  
  // Enhanced doctor strategy
  if (player.role === 'doctor') {
    // Protect self sometimes
    if (Math.random() > 0.7) {
      return player.id;
    }
    
    // Try to protect players who seem to be targets or valuable
    const possibleTargetsIds = findLikelyTargets(gameState.chatMessages, gameState.players);
    const possibleTargets = potentialTargets.filter(p => possibleTargetsIds.includes(p.id));
    
    if (possibleTargets.length > 0) {
      return possibleTargets[Math.floor(Math.random() * possibleTargets.length)].id;
    }
    
    // Fallback to random protection
    return potentialTargets[Math.floor(Math.random() * potentialTargets.length)].id;
  }
  
  return potentialTargets[Math.floor(Math.random() * potentialTargets.length)].id;
}

// Generate voting decision for AI players
export async function getAIVote(
  player: Player,
  gameState: GameState
): Promise<string | null> {
  if (!player.isAlive) return null;
  
  const potentialTargets = gameState.players.filter(p => 
    p.isAlive && p.id !== player.id
  );
  
  if (potentialTargets.length === 0) return null;
  
  // Enhanced voting strategy
  if (player.role === 'mafia') {
    // Avoid voting for other mafia
    const nonMafiaTargets = potentialTargets.filter(p => p.role !== 'mafia');
    if (nonMafiaTargets.length === 0) return potentialTargets[0].id;
    
    // Try to vote for players who are suspicious of mafia
    const accusersIds = findAccusers(gameState.chatMessages, gameState.players, 'mafia');
    const accusers = nonMafiaTargets.filter(p => accusersIds.includes(p.id));
    
    if (accusers.length > 0) {
      return accusers[Math.floor(Math.random() * accusers.length)].id;
    }
    
    // Target special roles if identified
    const specialRoleTargets = nonMafiaTargets.filter(p => 
      p.role === 'detective' || p.role === 'doctor'
    );
    
    if (specialRoleTargets.length > 0) {
      return specialRoleTargets[Math.floor(Math.random() * specialRoleTargets.length)].id;
    }
    
    // Fallback to random non-mafia target
    return nonMafiaTargets[Math.floor(Math.random() * nonMafiaTargets.length)].id;
  }
  
  // For villagers, detective, and doctor
  if (player.role === 'villager' || player.role === 'detective' || player.role === 'doctor') {
    // Try to vote for suspicious players based on chat
    const suspiciousIds = findSuspiciousPlayers(gameState.chatMessages, gameState.players);
    const suspiciousPlayers = potentialTargets.filter(p => suspiciousIds.includes(p.id));
    
    if (suspiciousPlayers.length > 0) {
      return suspiciousPlayers[Math.floor(Math.random() * suspiciousPlayers.length)].id;
    }
    
    // If detective, vote based on investigation
    if (player.role === 'detective') {
      const confirmedMafiaIds = findConfirmedMafia(gameState.messages);
      const confirmedMafia = potentialTargets.filter(p => confirmedMafiaIds.includes(p.id));
      
      if (confirmedMafia.length > 0) {
        return confirmedMafia[0].id;
      }
    }
  }
  
  // Fallback to random target
  return potentialTargets[Math.floor(Math.random() * potentialTargets.length)].id;
}

// Helper functions for analyzing game state
function findAccusers(chatMessages: ChatMessage[], players: Player[], targetRole: string): string[] {
  const accuserIds: string[] = [];
  
  // Keywords that might indicate accusations
  const accusationKeywords = [
    'suspicious', 'mafia', 'evil', 'lying', 'liar', 'kill', 'vote', 
    'suspect', 'eliminate', 'guilty', 'not innocent'
  ];
  
  chatMessages.forEach(msg => {
    const lowerContent = msg.content.toLowerCase();
    if (accusationKeywords.some(keyword => lowerContent.includes(keyword))) {
      // Find which player they might be accusing
      players.forEach(p => {
        if (lowerContent.includes(p.name.toLowerCase()) && msg.playerId !== p.id) {
          accuserIds.push(msg.playerId);
        }
      });
    }
  });
  
  return [...new Set(accuserIds)]; // Remove duplicates
}

function findSuspiciousPlayers(chatMessages: ChatMessage[], players: Player[]): string[] {
  const suspiciousIds: string[] = [];
  const playerMentions: Record<string, number> = {};
  
  // Count mentions of each player in a negative context
  chatMessages.forEach(msg => {
    const lowerContent = msg.content.toLowerCase();
    const accusationKeywords = [
      'suspicious', 'mafia', 'evil', 'lying', 'liar', 'kill', 'vote', 
      'suspect', 'eliminate', 'guilty', 'not innocent'
    ];
    
    if (accusationKeywords.some(keyword => lowerContent.includes(keyword))) {
      players.forEach(p => {
        if (lowerContent.includes(p.name.toLowerCase()) && msg.playerId !== p.id) {
          playerMentions[p.id] = (playerMentions[p.id] || 0) + 1;
        }
      });
    }
  });
  
  // Players mentioned negatively more than once are suspicious
  Object.entries(playerMentions).forEach(([id, count]) => {
    if (count > 1) {
      suspiciousIds.push(id);
    }
  });
  
  // If no one is suspicious yet, pick players who have been quiet
  if (suspiciousIds.length === 0) {
    const talkativePlayers = new Set(chatMessages.map(m => m.playerId));
    players.forEach(p => {
      if (p.isAlive && !talkativePlayers.has(p.id)) {
        suspiciousIds.push(p.id);
      }
    });
  }
  
  return suspiciousIds;
}

function findLikelyTargets(chatMessages: ChatMessage[], players: Player[]): string[] {
  // Players who are valuable or likely to be targeted
  const targetIds: string[] = [];
  
  // Players who claimed to be detective or doctor might be targets
  chatMessages.forEach(msg => {
    const lowerContent = msg.content.toLowerCase();
    if (lowerContent.includes('detective') || lowerContent.includes('doctor') || 
        lowerContent.includes('investigated') || lowerContent.includes('protected')) {
      targetIds.push(msg.playerId);
    }
  });
  
  // Add players who are being accused a lot (they might be innocent)
  const suspiciousIds = findSuspiciousPlayers(chatMessages, players);
  return [...new Set([...targetIds, ...suspiciousIds])]; // Remove duplicates
}

function findConfirmedMafia(gameMessages: string[]): string[] {
  const confirmedIds: string[] = [];
  
  // Look for detective messages about confirmed mafia
  gameMessages.forEach(msg => {
    // Parse messages like "Detective investigated X and found they are Mafia."
    const mafiaMatch = msg.match(/investigated ([a-zA-Z]+) and found they are (mafia|Mafia)/);
    if (mafiaMatch && mafiaMatch[1]) {
      const playerName = mafiaMatch[1];
      confirmedIds.push(playerName); // This is simplified - ideally we'd map name to ID
    }
  });
  
  return confirmedIds;
}

// Generate prompt for OpenAI based on player role and game state
function generatePrompt(
  player: Player,
  gameState: GameState,
  currentDay: number,
  playerToDiscussOrVote?: Player
): string {
  const playerRole = player.role;
  const phase = gameState.phase;
  
  let prompt = `You are a ${playerRole} in a Mafia game on day ${currentDay}. `;
  
  // Add role-specific context and strategy
  if (playerRole === 'mafia') {
    const otherMafia = gameState.players.filter(p => p.role === 'mafia' && p.id !== player.id && p.isAlive);
    prompt += `Your goal is to eliminate all villagers until mafia outnumbers them. `;
    
    if (otherMafia.length > 0) {
      prompt += `Your mafia teammates are: ${otherMafia.map(p => p.name).join(', ')}. `;
    } else {
      prompt += `You're the only mafia member left. `;
    }
    
    prompt += `As mafia, you should pretend to be innocent while subtly directing suspicion toward non-mafia players. `;
  } else if (playerRole === 'detective') {
    prompt += `Your goal is to help the villagers identify and eliminate the mafia. `;
    
    // Add detective's investigation results
    const investigations = gameState.messages.filter(msg => 
      msg.includes("detective") && msg.includes("investigated")
    );
    if (investigations.length > 0) {
      prompt += `Your investigations have revealed: ${investigations.join(' ')}. `;
    }
    
    prompt += `As a detective, use your knowledge strategically without revealing your role too early. `;
  } else if (playerRole === 'doctor') {
    prompt += `Your goal is to help the villagers by protecting players from mafia kills. `;
    prompt += `As doctor, you should try to identify valuable players to protect without revealing your role directly. `;
  } else {
    prompt += `Your goal is to help identify and eliminate the mafia through careful observation and deduction. `;
    prompt += `As a villager, analyze chat patterns and voting behavior to identify suspicious players. `;
  }
  
  // Add game state context
  prompt += `There are ${gameState.players.filter(p => p.isAlive).length} players alive. `;
  
  // Add information about eliminated players
  const eliminatedPlayers = gameState.players.filter(p => !p.isAlive);
  if (eliminatedPlayers.length > 0) {
    prompt += `The following players have been eliminated: ${eliminatedPlayers.map(p => `${p.name} (${p.role})`).join(', ')}. `;
  }
  
  // Add chat history for context
  const recentMessages = gameState.chatMessages.slice(-10); // Last 10 messages
  if (recentMessages.length > 0) {
    prompt += `\nRecent chat messages:\n`;
    recentMessages.forEach(msg => {
      const speaker = gameState.players.find(p => p.id === msg.playerId);
      prompt += `${speaker?.name}: "${msg.content}"\n`;
    });
  }
  
  // Add information about voting patterns if available
  if (Object.keys(gameState.votingResults).length > 0) {
    prompt += `\nVoting information from previous days:\n`;
    Object.entries(gameState.votingResults).forEach(([targetId, voterIds]) => {
      const target = gameState.players.find(p => p.id === targetId);
      const voters = voterIds.map(id => gameState.players.find(p => p.id === id)?.name).filter(Boolean);
      prompt += `${voters.join(', ')} voted for ${target?.name}.\n`;
    });
  }
  
  // Add specific instructions for current phase
  prompt += `The current phase is '${phase}'. `;
  
  if (phase === 'day' || phase === 'voting') {
    if (playerToDiscussOrVote) {
      prompt += `You are specifically discussing player ${playerToDiscussOrVote.name}. `;
      
      // Add what we know about this player
      const playerMessages = gameState.chatMessages.filter(msg => msg.playerId === playerToDiscussOrVote.id);
      if (playerMessages.length > 0) {
        prompt += `Here's what ${playerToDiscussOrVote.name} has said: ${playerMessages.map(m => `"${m.content}"`).join(', ')}. `;
      }
      
      prompt += `Based on your role and the game information, give your opinion on ${playerToDiscussOrVote.name} in 1-2 sentences. `;
      prompt += `Be strategic and consider what would benefit your team (${playerRole === 'mafia' ? 'mafia' : 'villagers'}). `;
    } else {
      prompt += `Generate a short, strategic message (1-2 sentences) that reflects your role and current game state. `;
      prompt += `Reference other players and previous conversations to make your response more contextual and believable. `;
    }
  }
  
  return prompt;
}

// Fallback messages in case the API call fails
function getDefaultMessage(
  player: Player,
  gameState: GameState,
  currentDay: number,
  playerToDiscussOrVote?: Player
): string {
  const role = player.role;
  
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
  
  if (playerToDiscussOrVote) {
    const accuseMessages = [
      `${playerToDiscussOrVote.name}'s arguments don't seem consistent with their earlier statements.`,
      `I've noticed ${playerToDiscussOrVote.name} has been deflecting attention from themselves.`,
      `${playerToDiscussOrVote.name}'s voting pattern is suspicious - they seem to protect certain players.`,
      `Something about ${playerToDiscussOrVote.name}'s behavior doesn't feel right to me.`,
      `${playerToDiscussOrVote.name} was quick to accuse others but offers little evidence.`
    ];
    
    const defendMessages = [
      `${playerToDiscussOrVote.name}'s arguments have been consistent throughout the game.`,
      `I think ${playerToDiscussOrVote.name} has made valid points that we should consider.`,
      `${playerToDiscussOrVote.name} has been helping us identify suspicious behavior.`,
      `I don't see strong evidence against ${playerToDiscussOrVote.name} at this point.`,
      `${playerToDiscussOrVote.name}'s voting choices make sense to me.`
    ];
    
    // Mafia will defend mafia teammates and accuse others
    if (role === 'mafia' && playerToDiscussOrVote.role === 'mafia') {
      return defendMessages[Math.floor(Math.random() * defendMessages.length)];
    } else if (role === 'mafia') {
      return accuseMessages[Math.floor(Math.random() * accuseMessages.length)];
    }
    
    // 50/50 chance of accusing or defending for others
    return Math.random() > 0.5 
      ? accuseMessages[Math.floor(Math.random() * accuseMessages.length)]
      : defendMessages[Math.floor(Math.random() * defendMessages.length)];
  }
  
  switch (role) {
    case 'mafia':
      return mafiaMessages[Math.floor(Math.random() * mafiaMessages.length)];
    case 'detective':
      return detectiveMessages[Math.floor(Math.random() * detectiveMessages.length)];
    case 'doctor':
      return doctorMessages[Math.floor(Math.random() * doctorMessages.length)];
    default:
      return genericMessages[Math.floor(Math.random() * genericMessages.length)];
  }
} 