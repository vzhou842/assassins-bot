import { messageChannel, messagePlayer } from "./bolt-app";
import { pickBy } from "ramda";
import { IS_DEV } from "./settings";
import { pickRandom } from "./utils";

interface PlayerStats {
  kills: number;
}

const DEATH_EMOJIS = [
  "🔫",
  "✌️",
  "👋",
  "💀",
  "😵",
  "🪦",
  "⽍",
  "⚰️",
  "👻",
  "🌹",
  "😢",
  "😿",
  "🫤",
  "👼",
  "⚱️",
  "😮",
  "😱",
  "🙃",
  "😬",
];

export default class Game {
  private readonly currentOrder: string[];
  private stats: { [id: string]: PlayerStats } = {};

  constructor(readonly playerIds: string[], private readonly onGameOver: VoidFunction) {
    // Assign targets by randomizing players
    this.currentOrder = playerIds.slice().sort(() => Math.random() - 0.5);

    // DM everyone their initial target
    const numPlayers = playerIds.length;
    for (let i = 0; i < numPlayers; i++) {
      const playerId = this.currentOrder[i];

      messagePlayer(playerId, "A game of Assassins has begun!");
      this.sendTargetInfo(playerId);
    }

    // Init stats for everyone
    this.currentOrder.forEach((playerId) => {
      this.stats[playerId] = {
        kills: 0,
      };
    });

    // Send channel start messages
    messageChannel(
      `🔫🔫🔫 *A game of Assassins has started!* 🔫🔫🔫\n\nYour current target has been sent to you in a DM.`
    ).then(() => this.sendChannelGameUpdate());
  }

  private getKillerIndex(index: number) {
    return (index - 1) % this.currentOrder.length;
  }

  private getTargetIndex(index: number) {
    return (index + 1) % this.currentOrder.length;
  }

  private sendChannelDeathUpdate(playerId: string, killer: string) {
    const baseMessage = pickRandom([
      `was killed by <@${killer}>!`,
      `was shot by <@${killer}>!`,
      `was assassinated by <@${killer}>!`,
      `has been assassinated... and you can thank <@${killer}>`,
      `was killed! Nice shot <@${killer}>`,
      `was sent to the shadow realm by <@${killer}>!`,
      `met their unfortunate fate at the hands of <@${killer}>`,
      `met their demise thanks to <@${killer}>`,
      `was taken out by <@${killer}>!`,
      `hopes of claiming victory have been dashed by <@${killer}>!`,
      `was ambushed by <@${killer}>!`,
      `fell prey to the deadly precision of <@${killer}>!`,
      `has been eliminated by <@${killer}>!`,
      `had no room for escape from <@${killer}>! Nice shot`,
      `has been terminated by <@${killer}>! Goodbye`,
      `fell victim to <@${killer}>!`,
    ]);

    let emojiSuffix = "";
    const numEmojis = Math.ceil(1 + Math.random() * 4);
    for (let i = 0; i < numEmojis; i++) {
      emojiSuffix += pickRandom(DEATH_EMOJIS);
    }

    messageChannel(`☠️ <@${playerId}> ${baseMessage} ${emojiSuffix}`);

    // Debug mode - send extra death updates to test
    if (IS_DEV && Math.random() < 0.66) {
      this.sendChannelDeathUpdate(playerId, killer);
    }
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
# players left: ${this.currentOrder.length}`
      );
      if (IS_DEV) {
        messageChannel(
          `[DEBUG] The current order is: ${this.currentOrder.map((id) => `<@${id}>`).join(" -> ")}`
        );
      }
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

  private logKillStat(playerId: string) {
    const playerStats = this.stats[playerId];
    if (playerStats) {
      playerStats.kills++;
    }
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

    let response = `Kill logged: <@${killer}> killed <@${target}>`;

    if (this.getTargetIndex(killerIndex) === targetIndex) {
      // Successful normal kill
      this.logKillStat(killer);
      messagePlayer(target, `You were killed by your assassin <@${killer}>! GG`);

      this.currentOrder.splice(targetIndex, 1);

      this.sendTargetInfo(killer);
      this.sendChannelDeathUpdate(target, killer);
    } else if (this.getTargetIndex(targetIndex) === killerIndex) {
      // Successful anti-kill
      this.logKillStat(killer);
      messagePlayer(target, `You were anti-killed by your target <@${killer}>! GG`);
      const targetsKiller = this.currentOrder[this.getKillerIndex(targetIndex)];

      this.currentOrder.splice(targetIndex, 1);

      this.sendTargetInfo(targetsKiller);
      this.sendChannelDeathUpdate(target, killer);
    } else {
      // Failed kill
      messagePlayer(
        killer,
        `You attempted to kill <@${target}> who is neither your target nor your assassin! As a result, you are now dead ☠️ GG`
      );
      const killersKiller = this.currentOrder[this.getKillerIndex(killerIndex)];

      this.currentOrder.splice(killerIndex, 1);

      messageChannel(`<@${killer}> died due to an invalid kill attempt on <@${target}>! Oops 😬`);
      this.sendTargetInfo(killersKiller);

      response = `Kill attempt logged: <@${killer}> attempted to kill <@${target}>`;
    }

    if (this.currentOrder.length === 1) {
      this.handleGameOver();
    } else {
      this.sendChannelGameUpdate();
    }

    return response;
  }

  private async handleGameOver() {
    const [winner] = this.currentOrder;
    messagePlayer(winner, "Congratulations on winning Assassins!");
    await messageChannel(`🔫🔫🔫 *GAME OVER - <@${winner}> wins!!!* 🔫🔫🔫`);

    // Kills leaderboard
    const killers: Record<string, PlayerStats> = pickBy(({ kills }) => kills > 0, this.stats);
    const leaderboard = Object.entries(killers).sort(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_a, { kills: killsA }], [_b, { kills: killsB }]) => killsB - killsA
    );
    messageChannel(
      `☠️ *Kills Leaderboard* ☠️\n${leaderboard
        .map(([playerId, { kills }], index) => `${index + 1}. <@${playerId}>: ${kills} kills`)
        .join("\n")}`
    );

    this.onGameOver();
  }
}
