import { App } from "@slack/bolt";
import Game from "./game";

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

let currentGame: Game | undefined;

app.command('/start-game', async ({ command, ack, respond }) => {
  await ack();

  if (currentGame) {
    await respond('A game is already in progress!');
    return;
  }

  const playerIds = command.text.split(' ');
  currentGame = new Game(playerIds);
  await respond(`Started a new game with ${playerIds.length} players!`);
});

app.command('/end-game', async ({ command, ack }) => {
  await ack();

  console.log(command.command, command.text);
});

app.command('/kill', async ({ command, ack }) => {
  await ack();

  console.log(command.command, command.text);
});

app.command('/killed-by', async ({ command, ack }) => {
  await ack();

  console.log(command.command, command.text);
});

(async () => {
  // Start your app
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Running on port ${port}!`);
})();
