/**
 * Array Shuffle Utility for LAN Mafia
 *
 * Provides cryptographically secure random shuffling for role assignment
 * and other game randomization needs.
 */
/**
 * Utility function to shuffle an array.
 * Usage: shuffle([1,2,3,4]) → randomly ordered array
 * Used in role assignment to randomize role distribution.
 */

/**
 * Fisher-Yates shuffle algorithm for random array shuffling
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array (original is not modified)
 */
function shuffle(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Shuffle array in place (modifies original array)
 * @param {Array} array - Array to shuffle in place
 * @returns {Array} The same array, now shuffled
 */
function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * Get random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element from array
 */
function getRandomElement(array) {
  if (array.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Get multiple random elements from array (without replacement)
 * @param {Array} array - Array to pick from
 * @param {number} count - Number of elements to pick
 * @returns {Array} Array of random elements
 */
function getRandomElements(array, count) {
  if (count >= array.length) {
    return shuffle(array);
  }

  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
}

/**
 * Weighted random selection
 * @param {Array} items - Array of items
 * @param {Array} weights - Array of weights (same length as items)
 * @returns {*} Randomly selected item based on weights
 */
function weightedRandom(items, weights) {
  if (items.length !== weights.length) {
    throw new Error("Items and weights arrays must have the same length");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

module.exports = {
  shuffle,
  shuffleInPlace,
  getRandomElement,
  getRandomElements,
  weightedRandom,
};
