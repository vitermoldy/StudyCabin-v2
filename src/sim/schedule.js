// The resident's day. Times are game minutes from midnight.
// `wet` is the version used when rain, storm or snow keeps them inside.
const h = (hh, mm = 0) => hh * 60 + mm;

export const DAY = [
  { id: 'sleep-early', start: h(0), end: h(6, 30), word: 'Sleep', line: 'Asleep under the duvet', spot: 'bed', pose: 'sleep' },
  { id: 'wake', start: h(6, 30), end: h(6, 45), word: 'Waking', line: 'Up and stretching by the bed', spot: 'bedside', pose: 'stretch' },
  { id: 'coffee-make', start: h(6, 45), end: h(7, 10), word: 'Coffee', line: 'Making coffee in the kitchen', spot: 'cook', pose: 'cook' },
  {
    id: 'coffee', start: h(7, 10), end: h(7, 50), word: 'Coffee', line: 'Coffee on the deck', spot: 'deckChair', pose: 'sitDrink',
    wet: { line: 'Coffee in the armchair, rain on the glass', spot: 'armchair', pose: 'sitDrink' },
