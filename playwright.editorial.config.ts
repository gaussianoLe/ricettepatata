import {defineConfig,devices} from '@playwright/test';
import {assertTestSession} from './editorial/runtime.mjs';
if(!process.env.EDITORIAL_TEST_OUTPUT || !process.env.EDITORIAL_TEST_URL)throw new Error('Usare npm run test:editorial con sessione temporanea isolata');
assertTestSession(process.env.EDITORIAL_TEST_OUTPUT,process.env.EDITORIAL_TEST_URL);
export default defineConfig({testDir:'./tests/editorial-browser',fullyParallel:false,workers:1,retries:0,reporter:'dot',outputDir:process.env.EDITORIAL_TEST_OUTPUT,preserveOutput:'never',use:{baseURL:process.env.EDITORIAL_TEST_URL,trace:'off',screenshot:'off',video:'off'},projects:[{name:'editorial-desktop',use:{...devices['Desktop Chrome']}},{name:'editorial-mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}]});
