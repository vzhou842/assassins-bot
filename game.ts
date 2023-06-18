import { messageChannel, messagePlayer } from "./bolt-app";

export default class Game {
  private currentTargetOrder: string[];

  constructor(private playerIds: string[]) {
    // Assign targets by randomizing players
    this.currentTargetOrder = playerIds.sort(() => Math.random() - 0.5);

    // DM everyone their initial target
    const numPlayers = playerIds.length;
    for (let i = 0; i < numPlayers; i++) {
      const playerId = this.currentTargetOrder[i];

      messagePlayer(playerId, "A game of Assassins has begun!");
      this.sendTargetInfo(playerId);
    }

    // Send channel start messages
    messageChannel(
      `A game of Assassins has started! Your current target has been sent to you in a DM.`
    );
    this.sendChannelGameUpdate();
  }

  private getKillerIndex(index: number) {
    return (index - 1) % this.currentTargetOrder.length;
  }

  private getTargetIndex(index: number) {
    return (index + 1) % this.currentTargetOrder.length;
  }

  private sendChannelDeathUpdate(playerId: string) {
    // TODO: fun variants
    messageChannel(`<@${playerId}> died! 💀`);
  }

  private sendChannelGameUpdate() {
    messageChannel(
      `Players left: ${this.currentTargetOrder
        .sort()
        .map((id) => `<@${id}>`)
        .join(", ")}
# players left: ${this.currentTargetOrder.length}`
    );
  }

  private sendTargetInfo(playerId: string) {
    const index = this.currentTargetOrder.indexOf(playerId);
    if (index < 0) {
      console.error("Cannot send target info to player not in game!");
      return;
    }

    messagePlayer(
      playerId,
      `Your current target is: <@${this.currentTargetOrder[this.getTargetIndex(index)]}>`
    );
  }

  kill(killer: string, target: string): string {
    const killerIndex = this.currentTargetOrder.indexOf(killer);
    if (killerIndex < 0) {
      return `<@${killer}> isn't part of the current game!`;
    }
    const targetIndex = this.currentTargetOrder.indexOf(target);
    if (targetIndex < 0) {
      return `<@${target}> isn't part of the current game!`;
    }

    if (this.getTargetIndex(killerIndex) === targetIndex) {
      // Successful normal kill
      messagePlayer(target, `You were killed by your assassin <@${killer}>! GG`);

      this.currentTargetOrder.splice(targetIndex, 1);

      this.sendTargetInfo(killer);
      this.sendChannelDeathUpdate(target);
    } else if (this.getTargetIndex(targetIndex) === killerIndex) {
      // Successful anti-kill
      messagePlayer(target, `You were anti-killed by your target <@${killer}>! GG`);
      const targetsKiller = this.currentTargetOrder[this.getKillerIndex(targetIndex)];

      this.currentTargetOrder.splice(targetIndex, 1);

      this.sendTargetInfo(targetsKiller);
      this.sendChannelDeathUpdate(target);
    } else {
      // Failed kill
      messagePlayer(
        killer,
        `You attempted to kill <@${target}> who is neither your target nor your assassin! As a result, you are now dead ☠️ GG`
      );
      const killersKiller = this.currentTargetOrder[this.getKillerIndex(killerIndex)];

      this.currentTargetOrder.splice(killerIndex, 1);

      this.sendChannelDeathUpdate(killer);
      this.sendTargetInfo(killersKiller);
    }

    this.sendChannelGameUpdate();

    return "Kill logged!";
  }
}
