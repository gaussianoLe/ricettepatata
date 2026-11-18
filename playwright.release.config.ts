import {defineConfig,devices} from '@playwright/test';
import {assertTestSession} from './release/test-session.mjs';
assertTestSession(process.env.RC_TEST_OUTPUT,process.env.RC_TEST_URL);
export default defineConfig({testDir:'./tests/release-browser',workers:1,fullyParallel:false,retries:0,reporter:'dot',outputDir:process.env.RC_TEST_OUTPUT,preserveOutput:'never',use:{baseURL:process.env.RC_TEST_URL,trace:'off',screenshot:'off',video:'off'},projects:[{name:'release-desktop',use:{...devices['Desktop Chrome']}},{name:'release-mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}]});
