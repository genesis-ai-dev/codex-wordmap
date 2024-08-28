import * as vscode from 'vscode';
import { getPerfFromActiveNotebook } from './usfmStuff/importUsfm';
import { perfToUsfmWithoutAlignmentData } from './usfmStuff/utils';

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

            this._setupMessageHandlers();

            // Send initial codex files when the webview is created
            this._sendCodexFiles();
        }
    }

    private async _sendCodexFiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const codexFiles = await vscode.workspace.findFiles('files/target/*.codex');
        const codexFilePaths = codexFiles.map(file => file.fsPath);

        this._sendMessage({
            command: 'updateCodexFiles',
            files: codexFilePaths
        });
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

    private async _handleCodexSelection(codexPath: string) {
        // Get the usfm data from the codex file
        try {
            const uri = vscode.Uri.file(codexPath);
            const notebook = await vscode.workspace.openNotebookDocument(uri);
            const perf = await getPerfFromActiveNotebook(notebook);

            console.log("perf", perf);
            let usfmData: string;
            try {
                usfmData = await perfToUsfmWithoutAlignmentData(perf);
                console.log("usfmDataWithoutAlignment", usfmData);
            } catch (error) {
                console.error("error", error);
                usfmData = "error";
            }

            this._sendMessage({
                command: 'updateUsfm',
                usfm: usfmData
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading codex: ${error}`);
        }
    }

    private _setupMessageHandlers() {
        this._panel?.webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'getCodexFiles':
                        await this._sendCodexFiles();
                        return;
                    case 'selectCodex':
                        await this._handleCodexSelection(message.codexPath);
                        return;
                }
            },
            null,
            this._disposables
        );
    }
}