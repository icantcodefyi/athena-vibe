# Mafia Social Deduction Game

A single-player version of the classic social deduction game Mafia, where you play with AI-powered opponents.

## Features

- Play the classic Mafia game against AI-powered opponents
- Take on different roles: Villager, Mafia, Detective, or Doctor
- Real-time chat with AI players that strategize based on their roles
- Day and night phases with role-specific actions
- Voting system to eliminate suspected Mafia members
- Dynamic game state that adapts to player actions

## Roles

### Villager
- Goal: Eliminate all Mafia members
- Ability: Vote during day phase
- No special night actions

### Mafia
- Goal: Equal or outnumber the innocent players
- Ability: Vote during day + eliminate a player at night
- Can coordinate with other Mafia members

### Detective
- Goal: Help villagers win
- Ability: Vote during day + investigate one player at night
- Learns if the investigated player is Mafia or not

### Doctor
- Goal: Help villagers win
- Ability: Vote during day + protect one player at night
- Can save a player from Mafia elimination

## Game Flow

1. **Lobby Phase**
   - Enter your name and gender
   - Generate AI players
   - Configure game settings

2. **Role Assignment**
   - You and AI players are randomly assigned roles
   - View your role and goal

3. **Day Phase**
   - Discuss with AI players to identify Mafia
   - AI players chat based on their roles and game state

4. **Voting Phase**
   - Cast your vote to eliminate a suspected Mafia member
   - AI players also vote based on their strategy
   - Player with most votes is eliminated

5. **Night Phase**
   - If you're Mafia: Choose a player to eliminate
   - If you're Detective: Choose a player to investigate
   - If you're Doctor: Choose a player to protect
   - AI players perform their night actions

6. **Results Phase**
   - Game ends when all Mafia are eliminated (Villagers win) or
     Mafia equals/outnumbers innocent players (Mafia wins)

## Setup

1. Clone the repository
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your OpenAI API key (for AI chat):
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   > You can get an API key at https://platform.openai.com/api-keys

4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- OpenAI API

## License

This project is built for educational purposes.

## Credits

- Roles images are for demonstration purposes only.
- Game mechanics based on the traditional Mafia/Werewolf party game.
