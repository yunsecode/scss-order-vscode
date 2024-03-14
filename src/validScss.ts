import * as vscode from 'vscode';
import * as sass from 'sass';

export function validateSCSS(filePath: string): boolean {
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
