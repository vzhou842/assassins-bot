export const IS_DEV = process.env.NODE_ENV === "dev";

if (IS_DEV) {
  console.log('Running in dev mode');
}
