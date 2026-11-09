import {defineConfig,devices} from '@playwright/test';
import {deployment} from './src/lib/config.mjs';
const {base} = deployment(process.env.TEST_TARGET || 'production', process.env);
export default defineConfig({
 testDir:'./tests/browser', fullyParallel:true, forbidOnly:!!process.env.CI, retries:process.env.CI?1:0,
 reporter:process.env.CI?'github':'list', use:{baseURL:`http://127.0.0.1:4321${base}`,trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
 // A stale shell must not override the target, origin or base saved by the build.
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4321',url:`http://127.0.0.1:4321${base}`,reuseExistingServer:false,
 env:{BUILD_TARGET:'invalid-stale-target',BASE_PATH:'/stale-base/',SITE_URL:'https://stale.example'}},
});
