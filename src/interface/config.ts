import { Config } from 'scss-order';

// orderList: string[];         => []
// tabSize: number;             => 4
// spaceBeforeClass: boolean;   => true
// insertFinalNewline: boolean; => true

export interface VsCodeConfig extends Config {
    changeOnSave: boolean;
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
