'use strict';

import * as vscode from 'vscode';
import * as proxy from './jediProxy';
import * as telemetryContracts from "../common/telemetryContracts";

export class PythonSymbolProvider implements vscode.DocumentSymbolProvider {
    private jediProxyHandler: proxy.JediProxyHandler<proxy.ISymbolResult, vscode.SymbolInformation[]>;

    public constructor(context: vscode.ExtensionContext, jediProxy: proxy.JediProxy = null) {
        this.jediProxyHandler = new proxy.JediProxyHandler(context, jediProxy);
    }
    private static parseData(data: proxy.ISymbolResult): vscode.SymbolInformation[] {
        if (data) {
            var symbols = data.definitions.map(sym => {
                var symbol = sym.kind;
                var range = new vscode.Range(sym.lineIndex, sym.columnIndex, sym.lineIndex, sym.columnIndex);
                return new vscode.SymbolInformation(sym.text, symbol, range, vscode.Uri.file(sym.fileName));
            });

            return symbols;
        }
        return [];
    }
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.SymbolInformation[]> {
        var filename = document.fileName;

        var cmd: proxy.ICommand<proxy.ISymbolResult> = {
            command: proxy.CommandType.Symbols,
            fileName: filename,
            columnIndex: 0,
            lineIndex: 0
        };

        if (document.isDirty) {
            cmd.source = document.getText();
        }

        return this.jediProxyHandler.sendCommand(cmd, token).then(data => {
            return PythonSymbolProvider.parseData(data);
        });
    }
}
