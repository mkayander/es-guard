// Test file with modern JavaScript features
const test = () => {
  const obj = { a: 1, b: 2 };
  const { a, b } = obj; // Destructuring
  const arr = [1, 2, 3];
  const [first, ...rest] = arr; // Rest operator
  const arrow = () => 'arrow function';
  
  // Optional chaining
  const result = obj?.c?.d;
  
  // Nullish coalescing
  const value = result ?? 'default';
  
  return { a, b, first, rest, value, arrow };
};

export default test; 