import {
    expect,
    Page,
    PlaywrightTestArgs,
    PlaywrightTestOptions,
    PlaywrightWorkerArgs, PlaywrightWorkerOptions,
    TestInfo,
    TestType
} from '@playwright/test';
import { PDFReporter } from './PDFReporter';
import fs from 'fs';
import path from 'path';
import { JSONScribe } from "./JSONScribe";
import { StepObj } from "../models/StepObj";
import { DateStringObj } from "../models/DateStringObj";
import logger from "../winston/Winston";

export class ActionExecutor {
    private readonly test: any;
    private readonly projectObj: JSONScribe;
    private readonly width: number;
    private readonly height: number;
    private arrOfStepObj: StepObj[];
    private pdfReporter: PDFReporter;
    private pdfName: string;
    private resultTest: boolean;
    private readonly internalTimeout: number;

    constructor(
        test:  TestType<PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>,
        projectObjPath: string,
        width: number,
        height: number,
        internalTimeout: number
    ) {
        this.test = test;
        this.projectObj = new JSONScribe(projectObjPath);
        this.pdfReporter = new PDFReporter();
        this.resultTest = true;
        this.width = width;
        this.height = height;
        this.internalTimeout = internalTimeout * 1000;
        this.arrOfStepObj = [];
        this.pdfName = '';

        // Logging dettagliato dei dati di inizializzazione
        logger.info(`Inizializzazione con i seguenti parametri:`);
        logger.info(`JSON di configurazione: ${projectObjPath}`);
        logger.info(`Larghezza finestra browser: ${width}`);
        logger.info(`Altezza finestra browser: ${height}`);
    }

    runTests() {
        const runType = this.projectObj.getRunType();
        const runName = this.projectObj.getRunName();

        if (runType === 'cap') {
            logger.info(`Inizializzo capitolo ${runName}`);

            const capTests = this.projectObj.getAllCapTests(runName);

            for (let testName in capTests) {
                logger.info(`Esecuzione test ${testName}: ${JSON.stringify(JSON.stringify(capTests[testName].testStep))}`);

                this.arrOfStepObj = capTests[testName].testStep;
                this.runTest(testName);
            }

        } else if (runType === 'test') {
            logger.info(`Inizializzo test ${runName}`);

            this.arrOfStepObj = this.projectObj.findValueByKey(runName).testStep;
            this.runTest(runName);

        }
    }

    async runTest(testName: string) {

        this.test.use({ viewport: { width: this.width, height: this.height } });

        this.test(testName, async ({ page }: { page: Page }, testinfo: TestInfo) => {

            const testDetails = this.projectObj.findValueByKey(testName);

            if (!testDetails) {
                logger.error(`Non sono stati trovati dettagli per il test ${testName}`);
                return;
            }

            const dateStringObj = this.getActualDateStringObj();
            const dateStr = `${dateStringObj.day}/${dateStringObj.month}/${dateStringObj.year}`;
            const timeStr = `${dateStringObj.hours}:${dateStringObj.minutes}`;
            this.pdfName = `${testinfo.title}__${testinfo.project.name}__${dateStringObj.dateName}`;

            this.pdfReporter.addHeader(testinfo.title, testinfo.project.name, dateStr, timeStr);
            this.pdfReporter.addDescription(testDetails.description);
            this.pdfReporter.addPreRequisite(testDetails.preRequisite);
            this.pdfReporter.addSteps(testDetails.testStep.map((stepObj:StepObj, index:number) => `${index + 1}. ${stepObj.stepName}`));

            for (const stepObj of this.arrOfStepObj) {
                try {
                    await this.executeStep(stepObj, page);

                    if (stepObj.args.ritardo) {
                        await this.delay(stepObj.args.ritardo);
                        await this.takeScreenshot(page, testinfo, stepObj.stepName)
                    } else {
                        await this.takeScreenshot(page, testinfo, stepObj.stepName)
                    }
                } catch (error) {

                    logger.error(`Errore durante l'esecuzione dello step ${stepObj.stepName}: ${error}`);

                    this.resultTest = false;
                    break;
                }
            }

            await this.pdfReporter.savePDF(this.pdfName, false);
        });
    }

    async delay(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    private async executeStep(stepObj: StepObj, page: Page) {

        switch (stepObj.actionName) {
            case 'settaggio_storage':
                await this.withTimeout(
                    this.initializeStorage(page, stepObj.args.storageType!, stepObj.args.storageConfigName!),
                    this.internalTimeout,
                );
                break;

            case 'atterraggio_pagina':
                await this.withTimeout(
                    this.atterraggioPagina(stepObj.args.url!, page), this.internalTimeout
                );
                break;

            case 'clic_radio_e_controlla_stato':
                await this.withTimeout(
                    this.clickAndCheckInputRadio(page, stepObj.stepName, stepObj.args.selector!),
                    this.internalTimeout,
                );
                break;

            case 'clicca':
                await this.withTimeout(
                    this.click(page, stepObj.stepName, stepObj.args.selector!),
                    this.internalTimeout
                );
                break;

            case 'inserisci_testo':
                await this.withTimeout(
                    this.writeFill(page, stepObj.stepName, stepObj.args.selector!, stepObj.args.text!),
                    this.internalTimeout,
                );
                break;

            case 'controlla':
                await this.withTimeout(
                    this.controlla(page, stepObj.stepName, stepObj.args.selector!),
                    this.internalTimeout
                );
                break;

            default:
                logger.error(`Non ho trovato l'azione: ${stepObj.actionName}`);
        }
    }

    private async withTimeout(promise: Promise<void>, timeout: number): Promise<void> {

        let timeoutId: NodeJS.Timeout | null = null;

        const timeoutPromise = new Promise<void>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Timeout superato')), timeout);
        });

        await Promise.race([promise, timeoutPromise]);
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
    }

    async initializeStorage(page: Page, storageType: string, storageConfigName: string) {

        logger.info(`INIZIALIZZO ${storageType.toUpperCase()} STORAGE`);

        const storageState = JSON.parse(fs.readFileSync(`storageConfig/${storageConfigName}.json`, 'utf-8'));

        await page.evaluate(({ storageState, storageType }) => {

            for (const [key, value] of Object.entries(storageState)) {

                if (storageType === 'local') {
                    localStorage.setItem(key, JSON.stringify(value));
                } else {
                    sessionStorage.setItem(key, JSON.stringify(value));
                }

            }
        }, { storageState, storageType });

        const sessionStorageData = await page.evaluate((storageType) => {

            const data: { [key: string]: string } = {};

            if (storageType === 'local') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key !== null) {
                        data[key] = localStorage.getItem(key) || '';
                    }
                }
            } else {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key !== null) {
                        data[key] = sessionStorage.getItem(key) || '';
                    }
                }
            }

            return data;
        }, storageType);

        logger.info(`CONTENUTO ${storageType.toUpperCase()} STORAGE DOPO INIZIALIZZAZIONE: ${JSON.stringify(sessionStorageData)}`);
    }

    async atterraggioPagina(url: string, page: Page) {

        logger.info(`Raggiungo pagina -> ${url}`);

        await this.test.step('Atterraggio Pagina', async () => {
            await page.goto(url);
        });
    }

    async click(page: Page, stepName: string, selector: string) {

        await this.test.step(stepName, async () => {
            logger.info(`Eseguo click del selettore: ${selector}`);
            await page.locator(selector).click();
        });
    }

    async clickAndCheckInputRadio(page: Page, stepName: string, inputRadioSelector: string) {

        await this.test.step(stepName, async () => {

            logger.info(`Eseguo click del selettore: ${inputRadioSelector}`);

            await page.locator(inputRadioSelector).click();

            const boolInputRadio1Selector = await page.locator(inputRadioSelector).isChecked();

            logger.info(`Il radio button è selezionato? ${boolInputRadio1Selector}`);
            expect(boolInputRadio1Selector).toBeTruthy();
        });
    }

    async writeFill(page: Page, stepName: string, selector: string, text: string) {

        await this.test.step(stepName, async () => {

            logger.info(`Inserisco ['${text}'] nel selettore: ${selector}`);

            await page.locator(selector).fill(text);
        });
    }

    async controlla(page: Page, stepName: string, selector: string) {

        await this.test.step(stepName, async () => {

            logger.info(`Controllo l'elemento con selettore: ${selector}`);

            await page.locator(selector).isVisible();
        });
    }

    async takeScreenshot(page: Page, testinfo: TestInfo, name: string) {

        const dateStringObj = this.getActualDateStringObj();
        const screenshotName = `${testinfo.title}__${name}__${dateStringObj.dateName}.png`;
        const screenshotPath = path.join('PDFReports/img/', screenshotName);

        await page.screenshot({ path: screenshotPath });
        this.pdfReporter.insertStepPDF(screenshotPath, name);
    }

    getActualDateStringObj(): DateStringObj {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const dateName = `${year}_${month}_${day}__${hours}_${minutes}_${seconds}`;

        return { dateName, year, month, day, hours, minutes, seconds };
    }
}
