export interface StepObj {
    actionName: string;
    stepName: string;
    args: {
        selector?: string;
        text?: string;
        url?: string;
        storageType?: string;
        storageConfigName?: string;
    };
}