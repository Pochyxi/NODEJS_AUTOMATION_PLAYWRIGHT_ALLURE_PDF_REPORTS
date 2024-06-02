import PDFDocument from 'pdfkit';
import path from "path";
import fs from 'fs-extra';
import logger from "../winston/Winston";

export class PDFReporter {
    private doc;
    private stepCount = 0
    private stepCheckBG = true

    constructor() {
        this.doc = new PDFDocument({
            margins: {
                top: 20,
                bottom: 20,
                left: 12,
                right: 12
            },
            bufferPages: true

        });
        this.stepCount++
    }

    getCurrentPage() {
        return this.doc._pageBuffer.length;
    }

    addHeader(testName: string, projectName: string, data:string, ora:string) {
        // Imposta il background della pagina
        this.doc.rect(0, 0, this.doc.page.width, this.doc.page.height).fill('#222222');

        this.doc.fillColor('#D3D3D3');

        this.doc.fontSize(20);
        this.doc.font('Helvetica-Bold');

        this.doc.text(testName, {align: 'center'});
        this.doc.moveDown(2);
        this.doc.fontSize(14);
        this.doc.text("Progetto: " + projectName, {align: 'left'});
        this.doc.text("Del: " + data, {align: 'left'});
        this.doc.text("Ore: " + ora, {align: 'left'});

        this.doc.moveDown(5);

    }

    addDescription(description:string) {
        this.doc.fontSize(14);
        this.doc.text("Descrizione", {align: 'left'});
        this.doc.moveDown(1);

        this.doc.fontSize(12);
        this.doc.fillColor('#B7B7B7');
        this.doc.text(description, {align: 'center'})

        this.doc.moveDown(3);
    }

    addPreRequisite(requisite:string) {
        this.doc.fontSize(14);
        this.doc.fillColor('#D3D3D3');
        this.doc.text("Pre - Requisiti", {align: 'left'});
        this.doc.moveDown(1);

        this.doc.fontSize(12);
        this.doc.fillColor('#B7B7B7');
        this.doc.text(requisite, {align: 'center'})

        this.doc.moveDown(3);
    }

    addSteps(ArrOfSteps: string[]) {
        this.doc.fontSize(14);
        this.doc.fillColor('#D3D3D3');
        this.doc.text("Azioni Eseguite", {align: 'left'});
        this.doc.moveDown(1);

        this.doc.fontSize(12);
        this.doc.fillColor('#B7B7B7');

        for (let stringStep of ArrOfSteps) {
            if (this.getCurrentPage() > 1 && this.stepCheckBG === true) {
                this.doc.rect(0, 0, this.doc.page.width, this.doc.page.height).fill('#222222');
                this.stepCheckBG = false
                this.doc.fillColor('#B7B7B7');
            }

            this.doc.text(stringStep, {align: 'center'})
            this.doc.moveDown(1);
        }

        this.doc.moveDown(3);
    }

    insertStepPDF(imagePath:string, stepName:string) {

        this.doc.addPage();
        this.doc.rect(0, 0, this.doc.page.width, this.doc.page.height).fill('#222222');


        this.doc.fillColor('#D3D3D3');

        const docWidth = this.doc.page.width;
        const image = this.doc.openImage(imagePath);
        const imageWidth = docWidth;

        this.doc.fontSize(14);

        this.doc.text("STEP - " + this.stepCount, {align: 'left'});
        this.doc.fontSize(10);
        this.doc.fillColor('#8FBC8F');
        this.doc.text(stepName, {align: 'left'});
        this.doc.moveDown(1);
        this.doc.image(image, {width: imageWidth, x: 0});

        this.doc.moveDown(4);

        this.stepCount++
    }

    async savePDF(filename:string, failed:string | boolean) {
        const [name, project, date, time] = filename.split('__');
        const [year, month, day] = date.split('_');
        const pdfFolderPath = path.join(__dirname, '../PDFReports/' + project);
        const imgFolderPath = path.join(__dirname, '../PDFReports/', 'img'); // Path per la cartella img
        const filePath = path.join(pdfFolderPath, `${filename}__${failed ? "FAILED" : "PASSED"}.pdf`);


        // Crea la cartella di destinazione
        await fs.promises.mkdir(pdfFolderPath, {recursive: true});

        this.doc.fontSize(20);

        if (failed) {
            this.doc.moveDown(4);
            this.doc.fillColor("red")
            this.doc.text("FAILED", {align: 'center'})
            this.doc.fontSize(12);
            this.doc.text(failed, {align: 'center'})
        } else {
            this.doc.moveDown(4);
            this.doc.fillColor("green")
            this.doc.text("PASSED", {align: 'center'})
        }


        // Salva il file PDF
        await new Promise((resolve, reject) => {
            const stream = this.doc.pipe(fs.createWriteStream(filePath));
            stream.on('finish', resolve);
            stream.on('error', reject);
            this.doc.end();
        });

        // Sposta il file PDF nella cartella di destinazione
        const targetFolderPath = path.join(pdfFolderPath, name + "__" + project, year, month, day);
        const targetFilePath = path.join(targetFolderPath, `${filename}__${failed ? "FAILED" : "PASSED"}.pdf`);

        await fs.promises.mkdir(targetFolderPath, {recursive: true});
        await fs.promises.rename(filePath, targetFilePath);

        logger.info('File spostato correttamente.');

        // Svuota la cartella img
        const files = await fs.promises.readdir(imgFolderPath);
        for (const file of files) {
            await fs.promises.unlink(path.join(imgFolderPath, file));
        }

        logger.info('Cartella img svuotata.');
    }
}