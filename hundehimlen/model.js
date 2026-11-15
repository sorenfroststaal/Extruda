(function (root) {
  'use strict';
  const bounds = { capacity: [1, 200], days: [1, 366], occupancy: [0, 100], price: [0, 10000], variable: [0, 10000], fixed: [0, 1000000], debt: [0, 1000000], owner: [0, 1000000] };
  function valid(inputs) {
    return inputs && Object.entries(bounds).every(([key, [min, max]]) => Number.isInteger(inputs[key]) && inputs[key] >= min && inputs[key] <= max);
  }
  function calculate(inputs) {
    if (!valid(inputs)) throw new Error('Invalid scenario');
    const { capacity, days, occupancy, price, variable, fixed, debt, owner } = inputs;
    const nights = capacity * days * occupancy / 100 / 12;
    const revenue = nights * price / 1.25;
    const contribution = nights * (price / 1.25 - variable);
    const target = fixed + debt + owner;
    const fullContribution = capacity * days / 12 * (price / 1.25 - variable);
    return { nights, revenue, contribution, remaining: contribution - target,
      breakEven: target === 0 ? 0 : fullContribution > 0 ? target / fullContribution * 100 : null };
  }
  const api = { bounds, valid, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HundehimlenModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
