import * as vscode from 'vscode';
import * as fs from 'fs';

import { VsCodeConfig } from './interface/config';

import { PackageJson, ConfigFile } from './interface/config';

async function getFileJson(fileName: string): Promise<Object | null> {
    // 파일 검색 비동기 작업 수행
    const files: vscode.Uri[] = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**', 1);

    if (files.length < 1) {
        return null;
    }

    const packageJsonConfigPath: string = files[0].fsPath;

    // 파일 읽기 비동기 작업 수행
    try {
        const data: string = await fs.promises.readFile(packageJsonConfigPath, 'utf8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

function getCodeSetting(config: VsCodeConfig): void {
    const scssOrderConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('scss-order');

    config.changeOnSave = scssOrderConfig.get<boolean>('changeOnSave') || config.changeOnSave;
    config.orderList = scssOrderConfig.get<string[]>('orderList') || config.orderList;
    config.showErrorMessages = scssOrderConfig.get<boolean>('showErrorMessages') || config.showErrorMessages;
    config.autoFormat = scssOrderConfig.get<boolean>('autoFormat') || config.autoFormat;
    config.tabSize = scssOrderConfig.get<number>('tabSize') || config.tabSize;
    config.spaceBeforeClass = scssOrderConfig.get<boolean>('spaceBeforeClass') || config.spaceBeforeClass;
}

// TODO: benchmarking ?
async function getPackageJsonConfig(config: VsCodeConfig): Promise<void> {
    const fileJson: PackageJson | null = await getFileJson('package.json');

    if (!fileJson) {
        return;
    }

    const { scssOrderConfig } = fileJson;

    if (scssOrderConfig) {
        const { orderList, changeOnSave, showErrorMessages, tabSize, spaceBeforeClass, insertFinalNewline } =
            scssOrderConfig;

        if (typeof orderList === 'object') {
            config.orderList = orderList;
        }
        if (typeof tabSize === 'number') {
            config.tabSize = tabSize;
        }
        if (typeof spaceBeforeClass === 'boolean') {
            config.spaceBeforeClass = spaceBeforeClass;
        }
        if (typeof insertFinalNewline === 'boolean') {
            config.insertFinalNewline = insertFinalNewline;
        }
        if (typeof changeOnSave === 'boolean') {
            config.changeOnSave = changeOnSave;
        }
        if (typeof showErrorMessages === 'boolean') {
            config.showErrorMessages = showErrorMessages;
        }
    }
}

// TODO: check if fo in cindition with boolean conifg
async function getSassOrderSetting(config: VsCodeConfig, fileName: string): Promise<void> {
    const fileJson: ConfigFile | null = await getFileJson(fileName);

    if (!fileJson) {
        return;
    }
    if (typeof fileJson.orderList === 'object') {
        config.orderList = fileJson.orderList;
    }
    if (typeof fileJson.tabSize === 'number') {
        config.tabSize = fileJson.tabSize;
    }
    if (typeof fileJson.spaceBeforeClass === 'boolean') {
        config.spaceBeforeClass = fileJson.spaceBeforeClass;
    }
    if (typeof fileJson.insertFinalNewline === 'boolean') {
        config.insertFinalNewline = fileJson.insertFinalNewline;
    }
    if (typeof fileJson.changeOnSave === 'boolean') {
        config.changeOnSave = fileJson.changeOnSave;
    }
    if (typeof fileJson.showErrorMessages === 'boolean') {
        config.showErrorMessages = fileJson.showErrorMessages;
    }
}

export async function getConfig(): Promise<VsCodeConfig> {
    // TODO: Get default valur automotically
    let config: VsCodeConfig = {
        orderList: [],
        tabSize: 4,
        spaceBeforeClass: true,
        insertFinalNewline: true,
        changeOnSave: true,
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
