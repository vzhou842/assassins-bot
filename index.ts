import { WebClient } from "@slack/web-api";

const web = new WebClient(process.env.SLACK_TOKEN);

async function postMessage(channel: string, text: string) {
  try {
    await web.chat.postMessage({
      channel,
      text,
    });
    console.log("Message posted!");
  } catch (error) {
    console.error(error);
  }
}
