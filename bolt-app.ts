import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

export default app;

export function messagePlayer(playerId: string, text: string) {
  return app.client.chat.postMessage({
    channel: playerId,
    text,
  });
}

// Messages #assassins
export function messageChannel(text: string) {
  return app.client.chat.postMessage({
    channel: "#assassins",
    text,
  });
}
