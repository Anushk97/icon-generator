/**
 * Tests for generate-icons serverless function
 * Run with: node generate-icons.test.js
 */

// Simple test framework
const tests = [];
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertArrayEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

// Helper functions extracted for testing
function generateSeed(prompt, style) {
  let hash = 0;
  const str = `${prompt}-${style}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function validateInput(prompt, style, brandColors) {
  const STYLE_PROMPTS = {
    1: "simple flat icon design",
    2: "pastel colors",
    3: "bubble style",
    4: "neon style",
    5: "3D rendered"
  };

  const errors = [];

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    errors.push('Prompt is required and must be a non-empty string');
  }

  if (prompt && prompt.length > 200) {
    errors.push('Prompt must be less than 200 characters');
  }

  if (!style || !STYLE_PROMPTS[style]) {
    errors.push('Invalid style selection');
  }

  if (brandColors && !Array.isArray(brandColors)) {
    errors.push('Brand colors must be an array');
  }

  if (brandColors && brandColors.length > 5) {
    errors.push('Maximum 5 brand colors allowed');
  }

  return errors;
}

// Tests for generateSeed
test('generateSeed: Same prompt and style should produce same seed', () => {
  const seed1 = generateSeed('coffee', 1);
  const seed2 = generateSeed('coffee', 1);
  assertEquals(seed1, seed2, 'Seeds should be identical for same inputs');
});

test('generateSeed: Different prompts should produce different seeds', () => {
  const seed1 = generateSeed('coffee', 1);
  const seed2 = generateSeed('tea', 1);
  assertTrue(seed1 !== seed2, 'Seeds should be different for different prompts');
});

test('generateSeed: Different styles should produce different seeds', () => {
  const seed1 = generateSeed('coffee', 1);
  const seed2 = generateSeed('coffee', 2);
  assertTrue(seed1 !== seed2, 'Seeds should be different for different styles');
});

test('generateSeed: Should always return positive number', () => {
  const seed = generateSeed('test', 1);
  assertTrue(seed >= 0, 'Seed should be non-negative');
});

// Tests for validateInput
test('validateInput: Should accept valid input', () => {
  const errors = validateInput('coffee', 1, ['#FF5733']);
  assertArrayEquals(errors, [], 'Valid input should have no errors');
});

test('validateInput: Should reject empty prompt', () => {
  const errors = validateInput('', 1, []);
  assertTrue(errors.length > 0, 'Empty prompt should produce errors');
  assertTrue(errors[0].includes('required'), 'Error should mention prompt is required');
});

test('validateInput: Should reject long prompts', () => {
  const longPrompt = 'a'.repeat(201);
  const errors = validateInput(longPrompt, 1, []);
  assertTrue(errors.some(e => e.includes('200 characters')), 'Should reject prompts over 200 characters');
});

test('validateInput: Should reject invalid style', () => {
  const errors = validateInput('coffee', 99, []);
  assertTrue(errors.some(e => e.includes('Invalid style')), 'Should reject invalid style');
});

test('validateInput: Should reject non-array brandColors', () => {
  const errors = validateInput('coffee', 1, 'not-an-array');
  assertTrue(errors.some(e => e.includes('must be an array')), 'Should reject non-array brandColors');
});

test('validateInput: Should reject too many brand colors', () => {
  const errors = validateInput('coffee', 1, ['#FF5733', '#C70039', '#900C3F', '#581845', '#DAF7A6', '#FFC300']);
  assertTrue(errors.some(e => e.includes('Maximum 5')), 'Should reject more than 5 colors');
});

test('validateInput: Should accept null brandColors', () => {
  const errors = validateInput('coffee', 1, null);
  assertTrue(!errors.some(e => e.includes('color')), 'Should accept null brandColors');
});

// Run all tests
async function runTests() {
  console.log('\n🧪 Running Icon Generator Function Tests\n');
  console.log('='.repeat(50));

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   ${error.message}\n`);
      failedTests++;
    }
  }

  console.log('='.repeat(50));
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed (${tests.length} total)\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
