import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export type Asset = {
    _id: string;
    text: string;
};

export function registerOpenCodexNotebookInScribeEditor(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('codex-wordmap.openCodexNotebookInScribeEditor', () => {
        const scribeEditorWebview = new ScribeEditorWebview(context);
        scribeEditorWebview.show();
    });

    context.subscriptions.push(disposable);
}

class ScribeEditorWebview {
    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    constructor(private _context: vscode.ExtensionContext) { }

    public async show() {
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.One);
        } else {
            this._panel = vscode.window.createWebviewPanel(
                'scribeEditor',
                'Scribe Editor',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'webview-ui', 'scribe-editor', 'dist')]
                }
            );

            this._panel.webview.html = await this._getHtmlForWebview();

            this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

            this._panel.webview.onDidReceiveMessage(
                (message: any) => {
                    switch (message.command) {
                        case 'alert':
                            vscode.window.showErrorMessage(message.text);
                            return;
                    }
                },
                null,
                this._disposables
            );
        }
    }

    private async _getHtmlForWebview() {
        const scriptUri = await this._getFileUri('**/webview-ui/scribe-editor/dist/assets/index-*.js');
        const styleUri = await this._getFileUri('**/webview-ui/scribe-editor/dist/assets/index-*.css');

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Scribe Editor</title>
                <script type="module" crossorigin src="${scriptUri}"></script>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="root"></div>
            </body>
            </html>`;
    }

    private async _getFileUri(globPattern: string): Promise<vscode.Uri> {
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(this._context.extensionUri, globPattern));

        if (files.length === 0) {
            throw new Error(`No file found matching pattern: ${globPattern}`);
        }

        return this._panel!.webview.asWebviewUri(files[0]);
    }

    public dispose() {
        this._panel?.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    // You might want to add methods here to handle communication with the webview,
    // such as sending the initial USJ data, handling changes, etc.
    // For example:
    private _sendMessage(message: any) {
        this._panel?.webview.postMessage(message);
    }

    public updateContent(asset: Asset) {
        // This method could be called to update the editor content
        // You would need to implement the logic to convert the asset to USJ format
        const usj = this._convertAssetToUsj(asset);
        this._sendMessage({
            command: 'updateContent',
            content: usj
        });
    }

    private _convertAssetToUsj(asset: Asset) {
        // Implement the conversion logic here
        // This is just a placeholder
        return {
            type: 'USJ',
            version: '0.2.1',
            content: [
                {
                    type: 'para',
                    content: [
                        {
                            type: 'verse',
                            number: '1',
                            sid: asset._id,
                            content: asset.text || ''
                        }
                    ]
                }
            ]
        };
    }
}