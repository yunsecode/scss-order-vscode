import * as vscode from 'vscode';
import * as fs from 'fs';

import { Config } from './interface/config';

async function getFileJson(fileName: string) {
    try {
        // 파일 검색 비동기 작업 수행
        const files = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**', 1);

        if (files.length < 1) {
            return;
        }

        const packageJsonConfigPath = files[0].fsPath;

        // 파일 읽기 비동기 작업 수행
        const data = await fs.promises.readFile(packageJsonConfigPath, 'utf8');

        return JSON.parse(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

function getCodeSetting(config: Config) {
    const scssOrderConfig = vscode.workspace.getConfiguration('scss-order');

    config.changeOnSave = scssOrderConfig.get<boolean>('changeOnSave') || config.changeOnSave;
    config.orderList = scssOrderConfig.get<string[]>('orderList') || config.orderList;
    config.showErrorMessages = scssOrderConfig.get<boolean>('showErrorMessages') || config.showErrorMessages;
    config.autoFormat = scssOrderConfig.get<boolean>('autoFormat') || config.autoFormat;
    config.tabSize = scssOrderConfig.get<number>('tabSize') || config.tabSize;
    config.spaceBetweenClass = scssOrderConfig.get<boolean>('spaceBetweenClass') || config.spaceBetweenClass;
}

// TODO: benchmarking ?
async function getPackageJsonConfig(config: Config) {
    try {
        const fileJson = await getFileJson('package.json'); // 파일에서 JSON 데이터를 가져옴

        const { scssOrderConfig } = fileJson; // scssOrderConfig 추출

        if (scssOrderConfig) {
            const { orderList, changeOnSave, showErrorMessages, autoFormat, tabSize, spaceBetweenClass } =
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
            if (spaceBetweenClass) {
                config.spaceBetweenClass = spaceBetweenClass;
            }
        }
    } catch (error) {
        console.error('Error:', error); // 에러 처리
    }
}

// TODO: check if fo in cindition with boolean conifg
async function getSassOrderSetting(config: Config, fileName: string) {
    try {
        let fileJson = await getFileJson(fileName);

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
        if (fileJson.spaceBetweenClass !== undefined) {
            config.spaceBetweenClass = fileJson.spaceBetweenClass;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getConfig(): Promise<Config> {
    // TODO: Get default valur automotically
    let config: Config = {
        orderList: [],
        changeOnSave: true,
        showErrorMessages: false,
        autoFormat: false,
        tabSize: 4,
        spaceBetweenClass: true,
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
