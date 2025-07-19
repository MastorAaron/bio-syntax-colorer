import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";


interface TokenCustomization {
    textMateRules?: def.ColorRule[];
    [key: string]: unknown;
}

export const dev : boolean = true;

export const DARK_FG : def.ColorHex = "#D4D4D4";
export const LIGHT_FG: def.ColorHex = "#57606C";

export const NeonYellow    : def.ColorHex = "#FFFF33";
export const NeonGreen     : def.ColorHex = "#39FF14";
export const NeonBlue      : def.ColorHex = "#1F51FF";
export const NeonMagneta   : def.ColorHex = "#FF00FF";

const NeonsColors = [NeonYellow,NeonGreen,NeonBlue,NeonMagneta];
export type Neons = (typeof NeonsColors)[number];

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
    },

    highLightColors(color : string): def.ColorHex {
        switch(color){
            case "Neon Yellow":
                return NeonYellow;
            case "Neon Green":
                return NeonGreen;
            case "Neon Blue":
                return NeonBlue;            
            case "Neon Magneta":
                return NeonMagneta;
            default:
                return NeonYellow;
        }
    }
};
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

    // export const vscUtils = {
    //     print: function (message: string, forcePopup: boolean = false) {
    //         const outputChannel = vscode.window.createOutputChannel("BioNotation");
    //         outputChannel.appendLine(message);
    //         debugLog.push(message);
    //         fs.appendFileSync("vscUtilsDebugLog.txt", `${message}\n`);
    //         if (forcePopup) {
    //             vscode.window.showInformationMessage(message);
    //         }
    //     }
    // };


    export function print(...args: unknown[]){
          const formatted = args.map(arg => {
            if(typeof arg === "string") return arg;

            try{
                return JSON.stringify(arg, null, 2);
            }catch{
                return String(arg);  // Fallback for circular refs or edge cases
                }
            }).join(" ");

        if(dev == true){
            console.log(formatted);
            vscCOUT(formatted);
        }else{
            console.log(formatted);
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
    
    export async function showInterface(dropDownOptions: string[], searchBarText: string): Promise<string | undefined>{
        return await vscode.window.showQuickPick(
            dropDownOptions,
            { placeHolder: searchBarText }
        );
    }
    
    export async function showInputBox(userText: string, givenEx: string=""): Promise<string | undefined>{
        return await vscode.window.showInputBox({
            prompt: userText,
            placeHolder: givenEx
        });
    }

    export function mockContext(): vscode.ExtensionContext {
        return {
            extensionPath: "./",
            subscriptions: []
        } as unknown as vscode.ExtensionContext;
    }

} 

export class RegExBuilder{
    constructor(private allowExtended=true){}

    public genHighLightRegEx(strand: string, map: Record<string,string>): string{
        let regExStr = "";
        for(const char of strand){
            const upper = char.toUpperCase();
            if(this.allowExtended && map[upper]){
                regExStr += map[upper];
            }else{
                regExStr += upper.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&");
            }
        }
        return regExStr;
    }

    public genNukeRegEx(strand : string): string{
        return `(?i)${this.genHighLightRegEx(strand,def.nukeRegExMap)}`
    }

    public genAminoRegEx(strand : string): string{
        return `(?i)${this.genHighLightRegEx(strand,def.aminoRegExMap)}`
    }

    public genAminoPropertyRegEx(strand : string): string{
        return `(?i)${this.genHighLightRegEx(strand,def.aminoPropertyRegExMap)}`
    }//TODO: remove (?i) possibly and add lowerCase to regEx? 
}