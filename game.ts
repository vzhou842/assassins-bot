export default class Game {
  private currentTargetOrder: string[];

  constructor(private playerIds: string[]) {
    // Assign targets by randomizing players
    this.currentTargetOrder = playerIds.sort(() => Math.random() - 0.5);
  }


}
