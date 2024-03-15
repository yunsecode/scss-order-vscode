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

function noFormatWithOrder(editor: vscode.TextEditor, config: Config, orderListArr: string[]) {
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
            if (!success && config.showErrorMessages) {
                vscode.window.showErrorMessage('Could not process SCSS file.');
            }
        });
}

function splitPerLine(resultArr: string[], input: string) {
    let currentIndex = 0;

    for (let i = 0; i < input.length; i++) {
        if (input[i] === '{' || input[i] === ';' || input[i] === '}') {
            const substring = input.substring(currentIndex, i + 1).trim();
            if (substring !== '') {
                resultArr.push(substring);
            }
            currentIndex = i + 1;
        }
    }

    if (currentIndex < input.length) {
        const substring = input.substring(currentIndex).trim();
        if (substring !== '') {
            resultArr.push(substring);
        }
    }
}

function splitTextWithDelimiter(text: string): string[] {
    // 줄바꿈 문자('\n')을 기준으로 문자열을 분할
    const lines = text.split('\n');
    const resultArr: string[] = [];

    for (const line of lines) {
        splitPerLine(resultArr, line);
    }

    return resultArr;
}

function addSpacesToBeginning(input: string, count: number): string {
    if (count <= 0) {
        return input;
    }
    const spaces = ' '.repeat(count);
    return spaces + input;
}

function formatWithOrder(editor: vscode.TextEditor, config: Config, orderListArr: string[]) {
    const splitTable = splitTextWithDelimiter(editor.document.getText());

    let i = 0;

    while (i < splitTable.length) {
        let next = i + 1;
        let startCheck = 0;
        let endCheck = 0;

        // Check between where do I have to sort
        if (splitTable[i].includes('{')) {
            startCheck = i;
            while (next < splitTable.length) {
                if (splitTable[next].includes('{') || splitTable[next].includes('}')) {
                    endCheck = next;
                    i = next - 1;
                    break;
                }
                next++;
            }
        }

        // Sort
        if (endCheck - startCheck > 2) {
            reOrderArray(orderListArr, splitTable, startCheck, endCheck);
        }
        i++;
    }

    // Format
    // let newText = splitTable.join('\n');
    // console.log('newText:\n', newText);
    let newText = splitTable[0];
    let tabNum = 0;

    for (let i = 1; i < splitTable.length; i++) {
        if (splitTable[i - 1].includes('{')) {
            newText += '\n';
            newText += addSpacesToBeginning(splitTable[i], (tabNum + 1) * config.tabSize);
            tabNum++;
        } else if (splitTable[i] === '}') {
            newText += '\n';
            newText += addSpacesToBeginning(splitTable[i], (tabNum - 1) * config.tabSize);
            tabNum = tabNum - 1;
        } else if (splitTable[i].includes('{')) {
            if (config.spaceBetweenClass) {
                newText += '\n';
            }
            newText += '\n';
            newText += addSpacesToBeginning(splitTable[i], tabNum * config.tabSize);
        } else {
            newText += '\n';
            newText += addSpacesToBeginning(splitTable[i], tabNum * config.tabSize);
        }
    }
    newText += '\n';
    // console.log(newText);

    // TODO: 다른 format editor, trim 하는 거랑 사용히면 format에 조금 문제가 생김
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
            if (!success && config.showErrorMessages) {
                vscode.window.showErrorMessage('Could not process SCSS file.');
            }
        });
}

function order(config: Config): Thenable<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        // Check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return reject('No active text editor');
        }

        // Set Order List
        const orderListArr = setOrderArray(config);

        if (!config.autoFormat) {
            noFormatWithOrder(editor, config, orderListArr);
        } else {
            formatWithOrder(editor, config, orderListArr);
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
                try {
                    // TODO: check valid scss (problem with import src/)
                    if (
                        !event.document.isDirty ||
                        (event.document.languageId !== 'scss' && event.document.languageId !== 'sass')
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
