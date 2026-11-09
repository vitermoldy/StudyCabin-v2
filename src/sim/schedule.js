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
    cold: { line: 'Coffee in the armchair by the stove', spot: 'armchair', pose: 'sitDrink' },
  },
  { id: 'breakfast', start: h(7, 50), end: h(8, 20), word: 'Breakfast', line: 'Breakfast at the table', spot: 'dine', pose: 'sitEat' },
  { id: 'study-am', start: h(8, 20), end: h(10, 40), word: 'Study', line: 'Studying at the desk by the glass', spot: 'desk', pose: 'sitType' },
  {
    id: 'walk', start: h(10, 40), end: h(11, 40), word: 'Walk', line: 'A walk round the pond', spot: 'trail', pose: 'walkLoop',
    wet: { word: 'Reading', line: 'Reading on the sofa while the weather passes', spot: 'sofa', pose: 'sitRead' },
  },
  { id: 'lunch-cook', start: h(11, 40), end: h(12, 30), word: 'Lunch', line: 'Cooking lunch', spot: 'cook', pose: 'cook' },
  { id: 'lunch', start: h(12, 30), end: h(13, 0), word: 'Lunch', line: 'Lunch at the table', spot: 'dine', pose: 'sitEat' },
