import fs from 'fs-extra';
import {ProjectObject} from "../models/ProjectObject";


export class JSONScribe {
    private readonly internalPath: string;
    private readonly projectObject: ProjectObject;

    constructor(path: string) {
        this.internalPath = path;
        this.projectObject = fs.readJSONSync(this.internalPath);
    }

    getOBJ(): ProjectObject {
        return this.projectObject;
    }

    getProjectName(): string {
        return this.projectObject.info.name;
    }

    getAllCapTests(capName: string): any {
        return this.projectObject.tests[capName];
    }

    getRunType(): string {
        return this.projectObject.info.runType;
    }

    getRunName(): string {
        return this.projectObject.info.runName;
    }

    findValueByKey(searchKey: string): any {
        const stack: any[] = [this.projectObject.tests];

        while (stack.length > 0) {
            const currentObj = stack.pop();

            for (let key in currentObj) {
                if (currentObj.hasOwnProperty(key)) {
                    if (key === searchKey) {
                        return currentObj[key];
                    }

                    if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
                        stack.push(currentObj[key]);
                    }
                }
            }
        }

        return null;
    }
}