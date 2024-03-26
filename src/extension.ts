import * as vscode from 'vscode';

import { getConfig } from './getConfig';
import { orderProperties, formatProperties } from 'scss-order';
import { VsCodeConfig } from './interface/config';

function formatWithOrder(editor: vscode.TextEditor, config: VsCodeConfig): void {
    let splitTable: string[] = orderProperties(config, editor.document.getText());

    let formatted: string = formatProperties(config, splitTable);

    // TODO: 다른 format editor, trim 하는 거랑 사용히면 format에 조금 문제가 생김
    editor
        .edit((editBuilder) => {
            const document: vscode.TextDocument = editor.document;
            const fullRange: vscode.Range = new vscode.Range(
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
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (!editor) {
            return reject('No active text editor');
        }

        // TODO: Do I need now config.autoFormat?
        formatWithOrder(editor, config);
    });
}

// ---------------------------------------- Activate ----------------------------------------
// TODO: reset cursor place
function onSave(): vscode.Disposable {
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
                    const conf: VsCodeConfig = await getConfig();
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
function onCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('scss-order.order', async function () {
        const config: VsCodeConfig = await getConfig();

        order(config);
    });
}

// TODO: 내 로컬에 있는 package.json에 있는 값들을 interface 파일에 넣고, 그 interface를 채우는 식으로
export function activate(context: vscode.ExtensionContext): void {
    // Cmd + s
    context.subscriptions.push(onSave());

    // Cmd + Shipt + P -> order style
    context.subscriptions.push(onCommand());
}

// ---------------------------------------- deactivate ----------------------------------------
export function deactivate(): void {}
