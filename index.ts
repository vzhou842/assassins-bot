import app from "./bolt-app";
import Game from "./game";
import { getUserIdFromRawMention } from "./utils";

let currentGame: Game | undefined;

app.command("/start-game", async ({ command, ack, respond }) => {
  await ack();

  if (currentGame) {
    return respond("A game is already in progress!");
  }

  const playerIds = command.text.split(" ").map(getUserIdFromRawMention).filter(Boolean);

  if (playerIds.length < 3) {
    return respond(`Only ${playerIds.length} valid players provided - minimum game size is 3!`);
  }

  currentGame = new Game(playerIds);

  // TODO: make #assassins actually link?
  return respond(
    `Started a new game with ${playerIds.length} players! Check #assassins for updates.`
  );
});

app.command("/end-game", async ({ command, ack, respond }) => {
  await ack();

  if (command.text !== process.env.ADMIN_PASSWORD) {
    await respond("You don't have permission to end the game!");
    return;
  }

  if (currentGame) {
    currentGame = undefined;
    await respond("Ending the current game!");
    app.client.chat.postMessage({
      channel: "#assassins",
      text: "The current game has been stopped by the admins.",
    });
  } else {
    await respond("No game in progress!");
  }
});

app.command("/kill", async ({ command, ack, respond }) => {
  await ack();
  if (!currentGame) {
    return respond("No active game!");
  }

  const target = getUserIdFromRawMention(command.text);
  if (!target) {
    return respond("Invalid target. Please @mention your target.");
  }

  respond(currentGame.kill(command.user_id, target));
});

app.command("/killed-by", async ({ command, ack, respond }) => {
  await ack();
  if (!currentGame) {
    return respond("No active game!");
  }

  const killer = getUserIdFromRawMention(command.text);
  if (!killer) {
    return respond("Invalid killer. Please @mention the killer.");
  }

  respond(currentGame.kill(killer, command.user_id));
});

(async () => {
  // Start your app
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Running on port ${port}!`);
})();
