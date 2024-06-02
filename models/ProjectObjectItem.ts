export interface ProjectObjectItem {
    name: string;
    use: {
        viewport?: {
            width: number;
            height: number;
        };
        userAgent?: string;
        deviceScaleFactor?: number;
        isMobile?: boolean;
        hasTouch?: boolean;
        defaultBrowserType?: string;
    };
}