import { defineConfig, devices } from '@playwright/test';
import {CONFIG} from "./CONFIG";
import {JSONScribe} from "./utils/JSONScribe";
import {ProjectObjectItem} from "./models/ProjectObjectItem";
import logger from "./winston/Winston";


class ProjectAgent {
  private jsonScribe: JSONScribe;
  private projectObject: ProjectObjectItem[];

  constructor(path: string) {
    this.jsonScribe = new JSONScribe(path);

    logger.info('JSON letto correttamente');
    logger.info(JSON.stringify(this.jsonScribe.getOBJ()));

    this.projectObject = [];
    this.setProjectObject(
        this.jsonScribe.getProjectName(),
        this.jsonScribe.getOBJ().info.browsers
    );

    logger.info('Project object: ', JSON.stringify(this.projectObject));
  }

  setProjectObject(projectName: string, browserNames: string[]): void {
    for (const name of browserNames) {
      switch (name) {
        case 'chrome':
          this.projectObject.push({
            name: `${projectName}--${name}`,
            use: { ...devices['Desktop Chrome'] },
          });
          break;
        case 'firefox':
          this.projectObject.push({
            name: `${projectName}--${name}`,
            use: { ...devices['Desktop Firefox'] },
          });
          break;
        case 'safari':
          this.projectObject.push({
            name: `${projectName}--${name}`,
            use: { ...devices['Desktop Safari'] },
          });
          break;
        default:

          logger.error('Nessun browser fornito!!');
      }
    }
  }

  getProjectObject(): ProjectObjectItem[] {
    return this.projectObject;
  }
}

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 5 * 60 * 1000,
  expect: {
    timeout: 30000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['line'],
    // ['./my-awesome-reporter.ts'],
    ['allure-playwright', {outputFolder: 'allure-results'}]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    screenshot: 'on'
  },

  /* Configure projects for major browsers */
  // @ts-ignore
  projects: new ProjectAgent("./test-suites/" + CONFIG.nomeProgetto + ".json").getProjectObject()
});
