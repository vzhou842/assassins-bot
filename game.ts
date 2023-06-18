import { messageChannel, messagePlayer } from "./bolt-app";

export default class Game {
  private readonly currentOrder: string[];

  constructor(private readonly playerIds: string[]) {
    // Assign targets by randomizing players
    this.currentOrder = playerIds.slice().sort(() => Math.random() - 0.5);

    // DM everyone their initial target
    const numPlayers = playerIds.length;
    for (let i = 0; i < numPlayers; i++) {
      const playerId = this.currentOrder[i];

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
    return (index - 1) % this.currentOrder.length;
  }

  private getTargetIndex(index: number) {
    return (index + 1) % this.currentOrder.length;
  }

  private sendChannelDeathUpdate(playerId: string) {
    // TODO: fun variants
    messageChannel(`<@${playerId}> died! 💀`);
  }

  private sendChannelGameUpdate() {
    if (this.currentOrder.length === 2) {
      const [a, b] = this.currentOrder;
      messageChannel(
        `Time for the FINAL SHOWDOWN! The last two remaining players are <@${a}> and <@${b}>. First player to shoot the other wins!`
      );
    } else {
      messageChannel(
        `Players left: ${this.currentOrder
          .slice()
          .sort()
          .map((id) => `<@${id}>`)
          .join(", ")}
# players left: ${this.currentOrder.length}
[DEBUG] The current order is: ${this.currentOrder.map((id) => `<@${id}>`).join(" -> ")}`
      );
    }
  }

  private sendTargetInfo(playerId: string) {
    // If only 1 player is left, they already won
    if (this.currentOrder.length === 1) {
      return;
    }

    // Find this player's index
    const index = this.currentOrder.indexOf(playerId);
    if (index < 0) {
      console.error("Cannot send target info to player not in game!");
      return;
    }

    // Send them their target
    messagePlayer(
      playerId,
      `Your current target is: <@${this.currentOrder[this.getTargetIndex(index)]}>`
    );
  }

  kill(killer: string, target: string): string {
    const killerIndex = this.currentOrder.indexOf(killer);
    if (killerIndex < 0) {
      return `<@${killer}> isn't part of the current game!`;
    }
    const targetIndex = this.currentOrder.indexOf(target);
    if (targetIndex < 0) {
      return `<@${target}> isn't part of the current game!`;
    }

    if (this.getTargetIndex(killerIndex) === targetIndex) {
      // Successful normal kill
      messagePlayer(target, `You were killed by your assassin <@${killer}>! GG`);

      this.currentOrder.splice(targetIndex, 1);

      this.sendTargetInfo(killer);
      this.sendChannelDeathUpdate(target);
    } else if (this.getTargetIndex(targetIndex) === killerIndex) {
      // Successful anti-kill
      messagePlayer(target, `You were anti-killed by your target <@${killer}>! GG`);
      const targetsKiller = this.currentOrder[this.getKillerIndex(targetIndex)];

      this.currentOrder.splice(targetIndex, 1);

      this.sendTargetInfo(targetsKiller);
      this.sendChannelDeathUpdate(target);
    } else {
      // Failed kill
      messagePlayer(
        killer,
        `You attempted to kill <@${target}> who is neither your target nor your assassin! As a result, you are now dead ☠️ GG`
      );
      const killersKiller = this.currentOrder[this.getKillerIndex(killerIndex)];

      this.currentOrder.splice(killerIndex, 1);

      this.sendChannelDeathUpdate(killer);
      this.sendTargetInfo(killersKiller);
    }

    if (this.currentOrder.length === 1) {
      const [winner] = this.currentOrder;
      messageChannel(`GAME OVER - <@${winner}> wins!!!`);
      messagePlayer(winner, "Congratulations on winning Assassins!");

      // TODO: send analytics
    } else {
      this.sendChannelGameUpdate();
    }

    return "Kill logged!";
  }
}
