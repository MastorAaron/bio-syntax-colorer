import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { HoverObj } from "./hoverOver";
import { PatchColors } from "./patch";

interface TokenCustomization {
    textMateRules?: def.ColorRule[];
    [key: string]: unknown;
}

export const DARK_FG: def.ColorHex  = "#D4D4D4";
export const LIGHT_FG: def.ColorHex = "#57606C";
export namespace vscUtils{

    export function vscCOUT(...args: unknown[]): void {
        const formatted = args.map(arg => {
        if(typeof arg === "string") return arg;

        try{
            return JSON.stringify(arg, null, 2);
        }catch{
            return String(arg);  // Fallback for circular refs or edge cases
            }
        }).join(" ");

        vscode.window.showInformationMessage(formatted);
    }

    export function print(toPrint:string, stream:string="console"){
        if(stream === "console"){
            console.log(toPrint);
        }else if(stream === "vsc"){
            vscCOUT(toPrint);
        }else{
            throw new Error(`Unknown stream`);
        }
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
    
    export async function showInterface(options: string[], userText: string): Promise<string | undefined>{
        return await vscode.window.showQuickPick(
            options,
            { placeHolder: userText }
        );
    }

    // export function mockContext(){
    //     return { extensionPath: "./" } as unknown as vscode.ExtensionContext;
    // }

    export function mockContext(): vscode.ExtensionContext {
        return {
            extensionPath: "./",
            subscriptions: []
        } as unknown as vscode.ExtensionContext;
    }

} 

export const themeUtils = {
    themeKind(){
        return vscode.window.activeColorTheme.kind;
    },
    
    isDark(): boolean{
        return this.themeKind() === vscode.ColorThemeKind.Dark;
    },
        
    isLight(): boolean{
        return this.themeKind() === vscode.ColorThemeKind.Light;
    },
    
    defaultTextColor(): def.ColorHex {
        return this.isDark() ? DARK_FG : LIGHT_FG;
    }
};