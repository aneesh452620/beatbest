export const PRICE = 349;
export const FINISHES = [
  { id: 'chalk', name: 'Chalk', shell: '#cacbc6', pad: '#dad5c9', swatch: '#d4cfc3', note: 'Warm ivory meets brushed silver.' },
  { id: 'graphite', name: 'Graphite', shell: '#4b4e4c', pad: '#292b29', swatch: '#41433f', note: 'Deep charcoal. Quietly distinctive.' },
  { id: 'clay', name: 'Clay', shell: '#ad806b', pad: '#976a54', swatch: '#a97257', note: 'An earthy tone with a warm edge.' },
];
export function sanitizeCart(value) {
  if (!Array.isArray(value)) return [];
  return FINISHES.flatMap(f => { const item = value.find(i => i?.id === f.id); return item && Number.isInteger(item.qty) && item.qty > 0 ? [{ id: f.id, qty: Math.min(item.qty, 10) }] : []; });
}
export function changeQuantity(cart, id, qty) { return sanitizeCart([...cart.filter(i => i.id !== id), {id, qty}]); }
export function cartTotal(cart) { return cart.reduce((sum, item) => sum + item.qty * PRICE, 0); }
