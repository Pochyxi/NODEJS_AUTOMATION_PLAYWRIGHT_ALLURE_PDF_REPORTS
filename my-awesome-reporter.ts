import { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

// POSSIBILITA' DI IMPLEMENTARE UN REPORTER PERSONALIZZATO(ATTUALMENTE NON UTILIZZATO)

class MyReporter implements Reporter {
    constructor(options: { customOption?: string } = {}) {
        // console.log(`my-awesome-reporter setup with customOption set to ${options.customOption}`);
    }

    onBegin(config: FullConfig, suite: Suite) {
        // console.log(`MR--Starting the run with ${suite.allTests().length} tests`);
    }

    onTestBegin(test: TestCase) {
        // console.log(`MR--Starting test ${test.title}`);
    }

    onTestEnd(test: TestCase, result: TestResult) {
        // console.log(`MR--Finished test ${test.title}: ${result.status}`);
    }

    onEnd(result: FullResult) {
        // console.log(`MR--Finished the run: ${result.status}`);
    }
}
export default MyReporter;