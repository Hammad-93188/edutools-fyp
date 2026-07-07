import assert from 'node:assert/strict';
import test from 'node:test';

import { isGeminiServiceUnavailableError } from './gemini';

test('detects Gemini overload and unavailable responses', () => {
  assert.equal(
    isGeminiServiceUnavailableError({
      message: 'This model is currently experiencing high demand. Please try again later.'
    }),
    true
  );

  assert.equal(
    isGeminiServiceUnavailableError({
      error: { code: 503, message: 'Service unavailable', status: 'UNAVAILABLE' }
    }),
    true
  );

  assert.equal(
    isGeminiServiceUnavailableError({ message: 'Some other AI error' }),
    false
  );
});
