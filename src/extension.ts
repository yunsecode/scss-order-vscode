import * as vscode from 'vscode';

import { getConfig } from './getConfig';
import { Config, orderProperties, formatProperties } from 'scss-order';
import { VsCodeConfig } from './interface/config';

function formatWithOrder(editor: vscode.TextEditor, config: VsCodeConfig) {
    let splitTable = orderProperties(config, editor.document.getText());

    let formatted = formatProperties(config, splitTable);

    // TODO: 다른 format editor, trim 하는 거랑 사용히면 format에 조금 문제가 생김
    editor
        .edit((editBuilder) => {
            const document = editor.document;
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(editor.document.getText().length),
            );

            editBuilder.replace(fullRange, formatted);
        })
        .then((success) => {
            if (!success && config.showErrorMessages) {
                vscode.window.showErrorMessage('Could not process SCSS file.');
            }
        });
}

function order(config: VsCodeConfig): Thenable<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        // Check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return reject('No active text editor');
        }

        // TODO: Do I need now config.autoFormat?
        formatWithOrder(editor, config);
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
