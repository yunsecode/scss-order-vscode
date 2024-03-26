import * as vscode from 'vscode';
import * as fs from 'fs';

import { VsCodeConfig } from './interface/config';

async function getFileJson(fileName: string): Promise<Object | null> {
    try {
        // 파일 검색 비동기 작업 수행
        const files = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**', 1);

        if (files.length < 1) {
            return null;
        }

        const packageJsonConfigPath = files[0].fsPath;

        // 파일 읽기 비동기 작업 수행
        const data = await fs.promises.readFile(packageJsonConfigPath, 'utf8');
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        throw(null);
    }
}

function getCodeSetting(config: VsCodeConfig): void {
    const scssOrderConfig = vscode.workspace.getConfiguration('scss-order');

    config.changeOnSave = scssOrderConfig.get<boolean>('changeOnSave') || config.changeOnSave;
    config.orderList = scssOrderConfig.get<string[]>('orderList') || config.orderList;
    config.showErrorMessages = scssOrderConfig.get<boolean>('showErrorMessages') || config.showErrorMessages;
    config.autoFormat = scssOrderConfig.get<boolean>('autoFormat') || config.autoFormat;
    config.tabSize = scssOrderConfig.get<number>('tabSize') || config.tabSize;
    config.spaceBeforeClass = scssOrderConfig.get<boolean>('spaceBeforeClass') || config.spaceBeforeClass;
}

interface PackageJson extends Object {
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

interface ConfigFile extends Object {
    orderList?: string[];
    tabSize?: number;
    spaceBeforeClass?: boolean;
    insertFinalNewline?: boolean;
    changeOnSave?: boolean;
    autoFormat?: boolean;
    showErrorMessages?: boolean;
}

// TODO: benchmarking ?
async function getPackageJsonConfig(config: VsCodeConfig): Promise<void> {
    try {
        const fileJson: PackageJson | null = await getFileJson('package.json');

        if (!fileJson) {
            return;
        }

        const { scssOrderConfig } = fileJson;

        if (scssOrderConfig) {
            const { orderList, changeOnSave, showErrorMessages, autoFormat, tabSize, spaceBeforeClass } =
                scssOrderConfig;

            if (orderList) {
                config.orderList = orderList;
            }
            if (changeOnSave) {
                config.changeOnSave = changeOnSave;
            }
            if (showErrorMessages) {
                config.showErrorMessages = showErrorMessages;
            }
            if (autoFormat) {
                config.autoFormat = autoFormat;
            }
            if (tabSize) {
                config.tabSize = tabSize;
            }
            if (spaceBeforeClass) {
                config.spaceBeforeClass = spaceBeforeClass;
            }
        }
    } catch (error) {
        console.error('Error:', error); // 에러 처리
    }
}

// TODO: check if fo in cindition with boolean conifg
async function getSassOrderSetting(config: VsCodeConfig, fileName: string): Promise<void> {
    try {
        const fileJson: ConfigFile | null = await getFileJson(fileName);

        if (!fileJson) {
            return;
        }
        // TODO: check type
        if (fileJson.orderList) {
            config.orderList = fileJson.orderList;
        }
        if (fileJson.changeOnSave) {
            config.changeOnSave = fileJson.changeOnSave;
        }
        if (fileJson.showErrorMessages) {
            config.showErrorMessages = fileJson.showErrorMessages;
        }
        if (fileJson.autoFormat) {
            config.autoFormat = fileJson.autoFormat;
        }
        if (fileJson.tabSize) {
            config.tabSize = fileJson.tabSize;
        }
        if (fileJson.spaceBeforeClass !== undefined) {
            config.spaceBeforeClass = fileJson.spaceBeforeClass;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getConfig(): Promise<VsCodeConfig> {
    // TODO: Get default valur automotically
    let config: VsCodeConfig = {
        orderList: [],
        tabSize: 4,
        spaceBeforeClass: true,
        insertFinalNewline: true,
        showErrorMessages: false,
    };

    // settings.json / .vscode/setting.json
    getCodeSetting(config);

    // package.json
    await getPackageJsonConfig(config);

    // scss-order.json
    await getSassOrderSetting(config, 'scss-order.json');

    // .scss-order.json
    await getSassOrderSetting(config, '.scss-order.json');

    // scss-orderrc
    await getSassOrderSetting(config, 'scss-orderrc');

    return config;
}
