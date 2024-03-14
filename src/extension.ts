import * as vscode from 'vscode';

import { validateSCSS } from './validScss';
import { getConfig } from './getConfig';
import { Config } from './interface/config';

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

function reOrderArray(orderListArr: string[], text: any, startCheck: number, endCheck: number) {
    let newArr: any[] = [];
    let reorderedProperties: any[] = [];

    for (let i = startCheck + 1; i < endCheck; i++) {
        newArr.push(text[i]);
    }

    orderListArr.forEach((orderItem) => {
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

function setOrderArray(config: Config) {
    const new_arr: string[] = [...config.orderList];

    // arr1에서 중복되지 않는 요소를 필터링하여 new_arr에 추가
    for (const item of defaultOrder) {
        if (!config.orderList.includes(item)) {
            new_arr.push(item);
        }
    }

    return new_arr;
}

function formatWithOrder(editor: vscode.TextEditor, config: Config, orderListArr: string[]) {
    editor
        .edit((editBuilder: vscode.TextEditorEdit) => {
            const text = editor.document.getText();
            let splitResult = [];
            const lineCount = editor.document.lineCount;
            let i = 0;

            while (i < lineCount) {
                splitResult.push(editor.document.lineAt(i).text);
                // TODO: if in one line, there are many properties, have to split it
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
                    reOrderArray(orderListArr, splitResult, startCheck, endCheck);
                }
                i++;
            }

            let newText = splitResult.join('\n');
            // newText = newText + "\n";

            editor.edit((editBuilder) => {
                const document = editor.document;
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(editor.document.getText().length),
                );

                editBuilder.replace(fullRange, newText);
            });
        })
        .then((success) => {
            if (!success && config.showErrorMessages) {
                vscode.window.showErrorMessage('Could not process SCSS file.');
            }
        });
}

function noFormatWithOrder() {}

function order(config: Config): Thenable<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        // Check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return reject('No active text editor');
        }

        // Set Order List
        const orderListArr = setOrderArray(config);

        vscode.window.showInformationMessage(`order ck 1`);
        if (!config.autoFormat) {
            vscode.window.showInformationMessage(`order ck 2`);
            formatWithOrder(editor, config, orderListArr);
        } else {
            noFormatWithOrder();
        }
    });
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
                vscode.window.showInformationMessage(
                    `isDirty ${event.document.isDirty}, lang ${
                        event.document.languageId !== 'scss' && event.document.languageId !== 'sass'
                    }, isValid ${validateSCSS(event.document.uri.fsPath)}`,
                );

                console.log('isDirty', event.document.isDirty);
                console.log('lang', event.document.languageId !== 'scss' && event.document.languageId !== 'sass');
                console.log('isValid', validateSCSS(event.document.uri.fsPath));

                try {
                    if (
                        (event.document.languageId !== 'scss' && event.document.languageId !== 'sass') ||
                        !validateSCSS(event.document.uri.fsPath)
                    ) {
                        // TODO: if not valid err Msg?
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
