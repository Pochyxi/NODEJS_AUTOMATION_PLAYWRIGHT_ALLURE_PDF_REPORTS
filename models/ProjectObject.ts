export interface ProjectObject {
    info: {
        name: string;
        runType: string;
        runName: string;
        browsers: string[];
    };
    tests: {
        [key: string]: any;
    };
}