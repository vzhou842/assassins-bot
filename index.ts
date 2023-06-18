import app from "./bolt-app";
import Game from "./game";
import { getUserIdFromRawMention } from "./utils";

let currentGame: Game | undefined;

app.command("/start-game", async ({ command, ack, respond }) => {
  await ack();

  if (currentGame) {
    await respond("A game is already in progress!");
    return;
  }

  const playerIds = command.text.split(" ").map(getUserIdFromRawMention);
  currentGame = new Game(playerIds);

  app.client.chat.postMessage({
    channel: "#assassins",
    text: `A game of Assassins has started! Your current target has been sent to you in a DM.
Players: ${playerIds.map((id) => `<@${id}>`).join(", ")}
# players: ${playerIds.length}`,
  });

  // TODO: make #assassins actually link?
  await respond(
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

app.command("/kill", async ({ command, ack }) => {
  await ack();

  console.log(command.command, command.text);
});

app.command("/killed-by", async ({ command, ack }) => {
  await ack();

  console.log(command.command, command.text);
});

(async () => {
  // Start your app
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Running on port ${port}!`);
})();
