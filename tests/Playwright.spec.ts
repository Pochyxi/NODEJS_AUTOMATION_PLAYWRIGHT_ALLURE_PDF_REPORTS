import { test } from '@playwright/test';
import {ActionExecutor} from "../utils/ActionExecutor";
import {CONFIG} from "../CONFIG";

const testExecutor = new ActionExecutor(
    test, `./test-suites/${CONFIG.nomeProgetto}.json`,
    CONFIG.larghezzaFinestraInPixels,
    CONFIG.altezzaFinestraInPixels,
    CONFIG.attesaPrimaDelFallimentoInSecondi
)

testExecutor.runTests()
