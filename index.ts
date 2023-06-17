import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.command('/start-game', async ({ command, ack }) => {
  await ack();

  console.log(command.command, command.text);
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
