import { Config } from 'scss-order';

export interface VsCodeConfig extends Config {
    showErrorMessages: boolean;
}

export interface PackageJson extends Object {
    scssOrderConfig?: {
        orderList: string[];
        tabSize: number;
        spaceBeforeClass: boolean;
        insertFinalNewline: boolean;
        changeOnSave?: boolean;
        autoFormat?: boolean;
        showErrorMessages: boolean;
    };
}

export interface ConfigFile extends Object {
    orderList?: string[];
    tabSize?: number;
    spaceBeforeClass?: boolean;
    insertFinalNewline?: boolean;
    changeOnSave?: boolean;
    autoFormat?: boolean;
    showErrorMessages?: boolean;
}
