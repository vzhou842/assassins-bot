// <@U03GMS9EJ74|karenying7>  ->  U03GMS9EJ74
export function getUserIdFromRawMention(mention: string) {
  return mention.match(/@([^|]+)/)?.[1];
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())];
}
