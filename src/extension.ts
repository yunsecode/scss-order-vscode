import * as vscode from 'vscode';
import * as fs from 'fs';

// ---------------------------------------- Order ----------------------------------------
const defaultOrder = [
    'position',
    'z-index',
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

function order(): Thenable<boolean> {
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
    // always properties before class
    // 그냥 클래스, :hover 이런 순서
}

function getConfig() {
    let config = {
        orderList: [],
        changeOnSave: true,
        showErrorMessages: false,
    };

    vscode.workspace
        .findFiles('**/package.json', '**/node_modules/**', 1)
        .then((files) => {
            console.log('aaa');

            if (files.length < 1) {
                return;
            }
            const packageJsonConfigPath = files[0].fsPath;

            fs.readFile(packageJsonConfigPath, 'utf8', (err, data) => {
                if (err) {
                    return;
                }

                const config = JSON.parse(data);
                if (!config.scssOrderConfig) {
                    return;
                }
                console.log(config.scssOrderConfig);
            });
        });
}

// ---------------------------------------- Activate ----------------------------------------
export function activate(context: vscode.ExtensionContext) {
    getConfig();

    // On save
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(
            (event: vscode.TextDocumentWillSaveEvent) => {
                // TODO: change with config value not juste true
                let changeOnSave: boolean = vscode.workspace
                    .getConfiguration('scss-order')
                    .get('changeOnSave', true);

                console.log('aaa');

                if (
                    event.document.languageId === 'scss' &&
                    event.document.isDirty &&
                    changeOnSave
                ) {
                    console.log('b2bb');

                    event.waitUntil(order());
                }
            },
        ),
    );

    // With Command + Shift + P
    let disposable = vscode.commands.registerCommand(
        'scss-order.order',
        function () {
            order();
        },
    );

    context.subscriptions.push(disposable);
}

// ---------------------------------------- deactivate ----------------------------------------
export function deactivate() {}
