import * as vscode from 'vscode';
import * as fs from 'fs';
import * as sass from 'sass';

// ---------------------------------------- Order ----------------------------------------
const defaultOrder = [
    'position',
    'z-index',
    'top',
    'right',
    'bottom',
    'left',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'border',
    'border-width',
    'border-radius',
    'border-color',
    'width',
    'height',
    'display',
    'flex-direction',
    'flex-shrink',
    'flex-wrap',
    'justify-content',
    'align-items',
    'background-color',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'color',
    'font-family',
    'font-weight',
    'font-size',
];

function reOrderArray(text: any, startCheck: number, endCheck: number) {
    let newArr: any[] = [];
    let reorderedProperties: any[] = [];

    for (let i = startCheck + 1; i < endCheck; i++) {
        newArr.push(text[i]);
    }
    // console.log(newArr);

    defaultOrder.forEach((orderItem) => {
        const foundIndex = newArr.findIndex((property) => property.trim().startsWith(orderItem + ':'));

        if (foundIndex !== -1) {
            reorderedProperties.push(newArr[foundIndex]);
            newArr.splice(foundIndex, 1);
        }
    });

    const finalProperties = reorderedProperties.concat(newArr);

    let x = 0;
    for (let i = startCheck + 1; i < endCheck; i++) {
        text[i] = finalProperties[x];
        x++;
    }
}

function order(config: Config): Thenable<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return reject('No active text editor');
        }
        editor
            .edit((editBuilder: vscode.TextEditorEdit) => {
                const text = editor.document.getText();
                let splitResult = [];
                const lineCount = editor.document.lineCount;
                let i = 0;

                while (i < lineCount) {
                    splitResult.push(editor.document.lineAt(i).text);
                    i++;
                }

                // parse
                i = 0;

                while (i < lineCount) {
                    let next = i + 1;
                    let startCheck = 0;
                    let endCheck = 0;

                    if (splitResult[i].includes('{')) {
                        startCheck = i;
                        while (next < lineCount) {
                            if (splitResult[next].includes('{') || splitResult[next].includes('}')) {
                                endCheck = next;
                                i = next - 1;
                                break;
                            }
                            next++;
                        }
                    }
                    if (startCheck !== 0 && endCheck - startCheck > 2) {
                        reOrderArray(splitResult, startCheck, endCheck);
                    }
                    i++;
                }

                let newText = splitResult.join('\n');
                // newText = newText + "\n";

                editor
                    .edit((editBuilder) => {
                        const document = editor.document;
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(editor.document.getText().length),
                        );

                        editBuilder.replace(fullRange, newText);
                    })
                    .then((success) => {
                        if (success) {
                            vscode.window.showInformationMessage('Success to process SCSS file.');
                        } else {
                            vscode.window.showErrorMessage('Could not process SCSS file.');
                        }
                    });
            })
            .then((success) => {
                if (success) {
                    // vscode.window.showInformationMessage(
                    //     'Processed SCSS file.',
                    // );
                    resolve(true);
                } else {
                    vscode.window.showErrorMessage('Could not process SCSS file.');
                }
            });
    });
}

// ---------------------------------------- Get Config ----------------------------------------
interface FormatForm {
    tabSize: number;
}

interface Config {
    orderList: string[];
    changeOnSave: boolean;
    showErrorMessages: boolean;
    autoFormat: boolean;
    formatForm: FormatForm;
    // 그냥 클래스, :hover 이런 순서
}

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
    config.formatForm = scssOrderConfig.get<FormatForm>('formatForm') || config.formatForm;
}

// TODO: benchmarking ?
async function getPackageJsonConfig(config: Config) {
    try {
        const fileJson = await getFileJson('package.json'); // 파일에서 JSON 데이터를 가져옴

        const { scssOrderConfig } = fileJson; // scssOrderConfig 추출

        if (scssOrderConfig) {
            const { orderList, changeOnSave, showErrorMessages, autoFormat, formatForm } = scssOrderConfig;

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
            if (formatForm) {
                console.log('formatForm', formatForm);

                config.formatForm = formatForm;
                console.log(config.formatForm);
            }
        }
    } catch (error) {
        console.error('Error:', error); // 에러 처리
    }
}

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
        if (fileJson.formatForm) {
            config.formatForm = fileJson.formatForm;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getConfig(): Promise<Config> {
    // TODO: Get default valur automotically
    let config: Config = {
        orderList: [],
        changeOnSave: true,
        showErrorMessages: false,
        autoFormat: false,
        formatForm: {
            tabSize: 4,
        },
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

// ---------------------------------------- Sass ----------------------------------------
function validateSCSS(filePath: string): boolean {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return false;
        }
        const text = editor.document.getText();
        const result = sass.compileString(text);

        return true;
    } catch (error) {
        return false;
    }
}

// ---------------------------------------- Activate ----------------------------------------
// TODO: reset cursor place
// On Cmd + s

function waitForOneSecond() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 1초 후에 resolve를 호출하여 Promise를 완료합니다.
            resolve(true);
        }, 1000); // 1초는 1000밀리초 입니다.
    });
}

function onSave() {
    return vscode.workspace.onWillSaveTextDocument((event: vscode.TextDocumentWillSaveEvent) => {
        event.waitUntil(
            (async () => {
                try {
                    if (
                        !event.document.isDirty ||
                        (event.document.languageId !== 'scss' && event.document.languageId !== 'sass') ||
                        !validateSCSS(event.document.uri.fsPath)
                    ) {
                        return;
                    }
                    const conf = await getConfig();
                    if (conf.changeOnSave) {
                        order(conf);
                    }
                } catch (error) {
                    console.error('Async operation failed:', error);
                }
            })(),
        );
    });
}

// With Command + Shift + P
function onCommand() {
    return vscode.commands.registerCommand('scss-order.order', async function () {
        const config = await getConfig();

        order(config);
    });
}

// TODO: 내 로컬에 있는 package.json에 있는 값들을 interface 파일에 넣고, 그 interface를 채우는 식으로
export function activate(context: vscode.ExtensionContext) {
    // const startTimestamp = Date.now();
    // // ---------------------------------------
    // // ---------------------------------------
    // const endTimestamp = Date.now();
    // const elapsedTime = endTimestamp - startTimestamp;
    // console.log(`실행 시간: ${elapsedTime}밀리초`);

    // Cmd + s
    context.subscriptions.push(onSave());

    // Cmd + Shipt + P -> order style
    context.subscriptions.push(onCommand());
}

// ---------------------------------------- deactivate ----------------------------------------
export function deactivate() {}
