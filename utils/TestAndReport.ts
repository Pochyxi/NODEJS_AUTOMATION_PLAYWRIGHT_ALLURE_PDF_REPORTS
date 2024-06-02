import { exec } from 'child_process';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import { ExecuteTestParams } from '../models/ExecuteTestParams';
import logger from "../winston/Winston";

export function executeTest(params?: ExecuteTestParams): void {
    const checkedShow = params?.show ?? false;
    const showDashboard = params?.showDashboard ?? false;

    const conditionalTestName = checkedShow
        ? ' --reporter=allure-playwright,line,./my-awesome-reporter.ts --headed'
        : ' --reporter=allure-playwright,line,./my-awesome-reporter.ts';

    executeTestReportDashboard(`test ${conditionalTestName}`, showDashboard);
}

export function executeCommand(command: string): void {
    const options = { cwd: resolve(__dirname, '../') };

    const childProcess = exec(command, options);

    childProcess.stdout?.on('data', (data: string) => logger.debug(`ChildProcess:\n${data}`));
    childProcess.stderr?.on('data', (data: string) => logger.error(`Errore durante l'esecuzione del comando:\n${data}`));
    childProcess.on('close', (code: number | null) => logger.info(`Completato con codice di uscita ${code}`));
}

function executeTestReportDashboard(pwCommand: string, showDashboard: boolean): void {
    logger.info(`Eseguo comando -> npx playwright ${pwCommand}`);
    const command = `npx playwright ${pwCommand}`;
    const options = { cwd: resolve(__dirname, '../') };

    const childProcess = exec(command, options);

    childProcess.stdout?.on('data', (data: string) => logger.debug(`ChildProcess:\n${data}`));
    childProcess.stderr?.on('data', (data: string) => logger.error(`Errore durante l'esecuzione del comando:\n${data}`));
    childProcess.on('close', (code: number | null) => {
        logger.info(`Completato con codice di uscita ${code}`);
        executeAllureReport(showDashboard);
    });
}

function executeAllureReport(showDashboard: boolean): void {
    logger.info('Generazione report PDF, apertura dashboard allure e lancio del trace viewer');
    logger.warn('CARICAMENTO...');

    const command = 'npx allure generate ./allure-results --clean';
    const options = { cwd: resolve(__dirname, '../') };

    const childProcess = exec(command, options);

    childProcess.stdout?.on('data', (data: string) => logger.debug(`ChildProcess:\n${data}`));
    childProcess.stderr?.on('data', (data: string) => logger.error(`Errore durante l'esecuzione del comando:\n${data}`));
    childProcess.on('close', (code: number | null) => {
        logger.info(`Completato con codice di uscita ${code}`);

        if (showDashboard) {
            executeCommand('npx allure open');
            executeCommand('npx playwright show-trace');
        }

        copyAndRenameTrace();
    });
}

function copyAndRenameTrace(): void {
    const baseDestinationFolder = './TracesReports';
    const testOriginPath = './test-results';
    const arrOfTraceNames = getSubfolderNames(testOriginPath);

    ensureDirectoryExists(testOriginPath);

    arrOfTraceNames.forEach(originalPath => {
        const formattedDate = getFormattedDate();
        const destinationFolder = path.join(baseDestinationFolder, originalPath);
        const datePath = path.join(destinationFolder, formattedDate.year, formattedDate.month, formattedDate.day);

        ensureDirectoryExists(datePath);

        const folderName = path.basename(path.dirname(`${testOriginPath}/${originalPath}/trace.zip`));
        const newFileName = `${folderName}___${formattedDate.date}___${formattedDate.time}`;
        const newPath = path.join(datePath, newFileName);

        ensureDirectoryExists(newPath);

        copyTraceFiles(testOriginPath, originalPath, newPath);
    });
}

function ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
        try {
            fs.mkdirSync(directory, { recursive: true });

            logger.info(`La cartella ${directory} è stata creata con successo.`);
        } catch (error) {
            logger.error(`Si è verificato un errore durante la creazione della cartella ${directory}:`, error);
        }
    } else {
        logger.info(`La cartella ${directory} esiste già.`);
    }
}

function getFormattedDate(): { year: string, month: string, day: string, date: string, time: string } {
    const currentDate = new Date();
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('it-IT', options);
    const [day, month, yearAndTime] = formatter.format(currentDate).split('/');
    const [year, time] = yearAndTime.split(', ').map(str => str.trim());

    return { year, month, day, date: `${year}-${month}-${day}`, time: time.replace(/:/g, '-') };
}

function getSubfolderNames(destinationFolder: string): string[] {
    return fs.readdirSync(destinationFolder)
        .filter(item => fs.statSync(path.join(destinationFolder, item)).isDirectory());
}

function copyTraceFiles(origin: string, originalPath: string, destination: string): void {
    fs.readdirSync(path.join(origin, originalPath)).forEach(file => {
        const extension = path.extname(file);
        if (['.zip', '.png', '.webm'].includes(extension)) {
            const newFile = path.join(destination, path.basename(file));
            const oldFile = path.join(origin, originalPath, file);

            fs.copyFile(oldFile, newFile, (error) => {
                if (error) {
                    logger.error(`Errore durante la copia del file: ${error}`);
                    return;
                }
                logger.info(`Traccia copiata e rinominata come: ${newFile}`);
            });
        }
    });
}
