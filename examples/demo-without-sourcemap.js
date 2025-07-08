// This is a demo file to show error display functionality
const modernCode = () => {
  // ES2015+ features that might cause compatibility issues
  const arrowFunction = () => "hello";
  const templateLiteral = `Hello ${arrowFunction()}`;
  const destructuring = { a: 1, b: 2 };
  const { a, b } = destructuring;
  const spread = [...[1, 2, 3]];

  // Use the variables to avoid linter warnings
  const result = `${a} ${b} ${spread.join(",")}`;
  return templateLiteral + result;
};

// This will cause a compatibility warning
const asyncFunction = async () => {
  const result = await Promise.resolve("async result");
  return result;
};

// ES2020+ features
const optionalChaining = modernCode?.toString;
const someValue = null;
const nullishCoalescing = someValue ?? "default";

export { modernCode, asyncFunction, optionalChaining, nullishCoalescing };
