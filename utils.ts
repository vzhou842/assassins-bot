// <@U03GMS9EJ74|karenying7>  ->  U03GMS9EJ74
export function getUserIdFromRawMention(mention: string) {
  return mention.match(/@([^|]+)/)[1];
}
