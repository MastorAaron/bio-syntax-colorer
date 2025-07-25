import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";

export type syntaxFilePath = string & { readonly __syntaxFilePath: unique symbol };

interface TokenCustomization {
    textMateRules?: def.ColorRule[];
    [key: string]: unknown;
}

export const DARK_FG: def.colorHex  = "#D4D4D4";
export const LIGHT_FG: def.colorHex = "#57606C";
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
        }
        // else if(stream === "else"){
        //     (toPrint);
        // }
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
    
    export async function showInterface(options: Array<string>, userText: string): Promise<string | undefined>{
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
    
    defaultTextColor(): def.colorHex {
        return this.isDark() ? DARK_FG : LIGHT_FG;
    }
};

interface FastaLang {
    repository?:{
        keywords?:{
            patterns?: Array<def.PatternRule>;
        };

    };
    [key: string]: unknown;
}

export class LangHandler{
    private langPath: syntaxFilePath;
    
    constructor(private context : vscode.ExtensionContext){
        this.langPath = path.join(this.context.extensionPath,  "syntaxes", "fasta.tmLanguage.json") as syntaxFilePath;
    }

    public loadLangFile(): FastaLang {
        const raw = fs.readFileSync(this.langPath, "utf8");
        return JSON.parse(raw);
    }

    public savelang(lang : FastaLang): void {
        fs.writeFileSync(this.langPath, JSON.stringify(lang, null,2));
    }

    private getPatternRepo(lang : FastaLang): def.PatternRule[]{
        // "repository": {
        //     "keywords": {
        //         "patterns": []
        //     }
        // }
        lang.repository = lang.repository || {};
        lang.repository.keywords = lang.repository.keywords || {};
        lang.repository.keywords.patterns = lang.repository.keywords.patterns || [];
        return lang.repository.keywords.patterns;
    }

    public appendPattern(pattern: def.PatternRule): void{
        const langJSON = this.loadLangFile();

        //Ensure Repos exist
        const patternArr = this.getPatternRepo(langJSON);
       
        patternArr.push(pattern);
        vscUtils.vscCOUT(`Appended lang pattern:`, pattern);

        this.savelang(langJSON);
    }

    public removePattern(pattern: def.TagCategory){
        const langJSON = this.loadLangFile();
        const patternArr = this.getPatternRepo(langJSON);

        const filtered = patternArr.filter(
          (rule: def.PatternRule ) =>
                typeof rule.name !== "string" || 
                (typeof pattern === "string" && !rule.name.includes(pattern))
        );
        langJSON.repository!.keywords!.patterns = filtered;

        this.savelang(langJSON);
    }

    public removeHighLightPatterns(){
        this.removePattern("highLightRule");
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