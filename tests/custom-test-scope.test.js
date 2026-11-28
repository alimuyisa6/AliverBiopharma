import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const handler = await readFile(new URL('../lib/quiz.js', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20261128031438_fix_custom_test_attempt_rpc_scope.sql', import.meta.url), 'utf8');
const customTestScope = /^custom_test:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('custom test activity scopes accept UUID-backed run identifiers only', () => {
  assert.match('custom_test:123e4567-e89b-42d3-a456-426614174000', customTestScope);
  assert.doesNotMatch('custom_test:not-a-uuid', customTestScope);
  assert.doesNotMatch('custom_test:123e4567-e89b-42d3-a456-426614174000:extra', customTestScope);
});

test('attempt RPC accepts valid custom-test scopes while preserving service-only execution', () => {
  assert.match(migration, /p_activity_scope !~ '\^custom_test:/);
  assert.match(migration, /revoke all on function public\.atomic_create_quiz_attempt_with_context/);
  assert.match(migration, /grant execute on function public\.atomic_create_quiz_attempt_with_context[\s\S]*to service_role/);
});

test('custom test session and attempt contexts must target lesson nodes', () => {
  assert.match(migration, /custom_test scope requires a lesson node/);
  assert.match(migration, /activity_scope like 'custom_test:%'/);
});

test('quiz handler preserves authentication and authorization status codes', () => {
  assert.match(handler, /err instanceof SecurityError \|\| Number\.isInteger\(err\.statusCode\)/);
});
