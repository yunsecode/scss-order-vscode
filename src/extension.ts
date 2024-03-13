import * as vscode from 'vscode';
import * as fs from 'fs';

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
        const foundIndex = newArr.findIndex((property) =>
            property.trim().startsWith(orderItem + ':'),
        );

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
                            if (
                                splitResult[next].includes('{') ||
                                splitResult[next].includes('}')
                            ) {
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
                            document.positionAt(
                                editor.document.getText().length,
                            ),
                        );

                        editBuilder.replace(fullRange, newText);
                    })
                    .then((success) => {
                        if (success) {
                            vscode.window.showInformationMessage(
                                'Success to process SCSS file.',
                            );
                        } else {
                            vscode.window.showErrorMessage(
                                'Could not process SCSS file.',
                            );
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
                    vscode.window.showErrorMessage(
                        'Could not process SCSS file.',
                    );
                }
            });
    });
}

// ---------------------------------------- Get Config ----------------------------------------
interface Config {
    orderList: string[];
    changeOnSave: boolean;
    showErrorMessages: boolean;
    // 그냥 클래스, :hover 이런 순서
}

async function getFileJson(fileName: string) {
    try {
        // 파일 검색 비동기 작업 수행
        const files = await vscode.workspace.findFiles(
            `**/${fileName}`,
            '**/node_modules/**',
            1,
        );

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

    const changeOnSave: boolean | undefined =
        scssOrderConfig.get('changeOnSave');
    const orderList: string[] | undefined = scssOrderConfig.get('orderList');
    const showErrorMessages: boolean | undefined =
        scssOrderConfig.get('showErrorMessages');

    if (changeOnSave) {
        config.changeOnSave = changeOnSave;
    }
    if (orderList) {
        config.orderList = orderList;
    }
    if (showErrorMessages) {
        config.showErrorMessages = showErrorMessages;
    }
}

async function getPackageJsonConfig(config: Config) {
    try {
        let fileJson = await getFileJson('package.json');

        if (!fileJson.scssOrderConfig) {
            return;
        }
        if (fileJson.scssOrderConfig.orderList) {
            config.orderList = fileJson.scssOrderConfig.orderList;
        }
        if (fileJson.scssOrderConfig.changeOnSave) {
            config.changeOnSave = fileJson.scssOrderConfig.changeOnSave;
        }
        if (fileJson.scssOrderConfig.showErrorMessages) {
            config.showErrorMessages =
                fileJson.scssOrderConfig.showErrorMessages;
        }
    } catch (error) {
        console.error('Error:', error);
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
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getConfig(): Promise<Config> {
    let config: Config = {
        orderList: [],
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

// ---------------------------------------- Activate ----------------------------------------
// On Cmd + s
function onSave() {
    return vscode.workspace.onWillSaveTextDocument(
        (event: vscode.TextDocumentWillSaveEvent) => {
            getConfig()
                .then((config) => {
                    if (
                        (event.document.languageId === 'scss' ||
                            event.document.languageId === 'sass') &&
                        event.document.isDirty &&
                        config.changeOnSave
                    ) {
                        event.waitUntil(order(config));
                    }
                })
                .catch((error) => {
                    console.error('Error while getting config:', error);
                });
        },
    );
}

// With Command + Shift + P
function onCommand() {
    return vscode.commands.registerCommand(
        'scss-order.order',
        async function () {
            console.log('order style');

            const config = await getConfig();

            order(config);
        },
    );
}

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
