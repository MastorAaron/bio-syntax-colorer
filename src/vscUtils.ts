import * as vscode from "vscode";
import * as def from "./definitions";


interface TokenCustomization {
    textMateRules?: def.ColorRule[];
    [key: string]: unknown;
}

export namespace vscUtils{
    export function vscCOUT(outStr: string): void {
        vscode.window.showInformationMessage(outStr);
    }
    
    export function globalConfig(): vscode.WorkspaceConfiguration{
        return vscode.workspace.getConfiguration() || {};
    }
    
    export function editorConfig(): vscode.WorkspaceConfiguration{
        return vscode.workspace.getConfiguration("editor") || {};
    }
    
    export function currCustomization(config : vscode.WorkspaceConfiguration): TokenCustomization {
        return config.get("tokenColorCustomizations") || {};
    }
    
    export function isScoped(rule : def.ColorRule): boolean {
        const scope = rule.scope || "";
        return typeof scope === "string" && scope.startsWith("source.fasta.");
    }
} 