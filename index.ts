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

  currentGame = new Game(playerIds, () => {
    currentGame = null;
  });

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

app.command("/admin-kill", async ({ command, ack, respond }) => {
  await ack();

  const { text } = command;
  const words = text.split(" ");

  if (words.length !== 3) {
    return respond("Incorrect format");
  }

  if (words[0] !== process.env.ADMIN_PASSWORD) {
    return respond("You don't have permission to do this!");
  }

  if (!currentGame) {
    return respond("No active game!");
  }

  const killer = getUserIdFromRawMention(words[1]);
  const target = getUserIdFromRawMention(words[2]);

  respond(currentGame.kill(killer, target));
});

(async () => {
  // Start your app
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Running on port ${port}!`);
})();

process
  .on("unhandledRejection", (reason) => {
    console.error("Ignoring unhandled promise rejection", reason);
  })
  .on("uncaughtException", (err) => {
    console.error("Ignoring uncaught exception!", err);
  });
