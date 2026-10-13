import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createId } from '../src/utils/createId.js';

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('IDs remain valid and distinct without secure-context randomUUID', () => {
    const httpCrypto = { getRandomValues: bytes => webcrypto.getRandomValues(bytes) };
    const ids = Array.from({ length: 1000 }, () => createId(httpCrypto));
    assert.equal(new Set(ids).size, ids.length);
    ids.forEach(id => assert.match(id, uuidV4));
});

test('IDs also work with the native crypto UUID implementation', () => {
    assert.match(createId(webcrypto), uuidV4);
});
