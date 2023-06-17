import app from "./bolt-app";

export default class Game {
  private currentTargetOrder: string[];

  constructor(private playerIds: string[]) {
    // Assign targets by randomizing players
    this.currentTargetOrder = playerIds.sort(() => Math.random() - 0.5);

    // DM everyone their initial target
    const numPlayers = playerIds.length;
    for (let i = 0; i < numPlayers; i++) {
      const playerId = this.currentTargetOrder[i];

      app.client.chat.postMessage({
        channel: playerId,
        text: `A game of Assassins has begun! Your current target is: <@${
          this.currentTargetOrder[(i + 1) % numPlayers]
        }>`,
      });
    }
  }
}
