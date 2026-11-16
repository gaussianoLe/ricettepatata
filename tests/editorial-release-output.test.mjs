import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {auditRelease} from '../scripts/release-check.mjs';
test('release drafts, source payloads, local routes and template assets are absent from public output',()=>{
 assert.equal(auditRelease().draftLeaks,0);assert.equal(existsSync('dist/release'),false);
});
