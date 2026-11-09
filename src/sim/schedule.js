// The resident's day. Times are game minutes from midnight.
// `wet` is the version used when rain, storm or snow keeps them inside.
const h = (hh, mm = 0) => hh * 60 + mm;

export const DAY = [
