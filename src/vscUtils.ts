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

    public genLetterRegEx(char : string, map: Record<string,string>){
        if(this.allowExtended && map[char]){
            return map[char];
        }
        return char.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&");
    }

    public genHighLightRegEx(strand: string, map: Record<string,string>): string{
        let regExStr = "";
        for(const char of strand){
            const upper = char.toUpperCase();
            const lower = char.toLowerCase();
            regExStr +=this.genLetterRegEx(upper, map);
            regExStr +=this.genLetterRegEx(lower, map);
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


// export class ruleParameters(private context: vscode.ExtensionContext, jsonKind : ruleType, fileKind: string, descript: string, variants: string){
//     private fileName: File;
//     private targetPath: def.FilePath;
//     private targetFolder: ruleType;
//     private fileType: string;
//     private regi : RegExBuilder; 
//     private fileDescript : string; 
//     private variants: string[];
    
//     constructor(private context: vscode.ExtensionContext, jsonKind : ruleType, fileKind: string, descript: string, variants: string){
//         this.fileType = fileKind.toLowerCase();
//         this.targetFolder = jsonKind;
//         this.fileName= this.genOutputFileStr();
//         this.regi = new RegExBuilder(false);
//         this.targetPath = this.genPath();
//         this.fileDescript = descript;
//     }
// }

type ruleType = "syntaxes" | "palettes";
type File = `${string}.tmLanguage.json` | `${string}-colors.json`;

/**
 * Configuration for output file generation.
 * Determines type, filename, description, and variant extensions.
 */
interface writeRuleParams{
    fileKind: string;
    descript: string;
    jsonKind: ruleType;
    variants: string[];
}
export class RuleWriter{
    private fileName: File;
    private targetPath: def.FilePath;
    private targetFolder: ruleType;
    private fileType: string;
    private regi : RegExBuilder; 
    private fileDescript : string; 
    private variants : string[]; 
    
    constructor(private context: vscode.ExtensionContext, params : writeRuleParams){
        this.fileType = params.fileKind.toLowerCase();
        this.targetFolder = params.jsonKind;
        this.fileName= this.genOutputFileStr();
        this.regi = new RegExBuilder(false);
        this.targetPath = this.genPath();
        this.fileDescript = params.descript;
        this.variants = params.variants;
    }


    private genOutputFileStr(): File{
        switch(this.targetFolder){  
            case "syntaxes":
                return `${this.fileType}.tmLanguage.json` as File;
            case "palettes":
                return `${this.fileType}-colors.json` as File;
            default:
                throw new Error(`Unknown ruleType: ${this.targetFolder}`);
            }
    }

    private genPath(): def.FilePath{
        const filePath = 
        path.isAbsolute(this.fileName)
        ? this.fileName as def.FilePath
        : path.join(this.context.extensionPath, this.targetFolder, path.basename(this.fileName)) as def.FilePath;
        
        return filePath;
    }
    
    private extractFileType(filename: string): string{
        return path.extname(filename);
    }    

    private genRegEx(letters : string): def.RegEx{
        return this.regi.genNukeRegEx(letters);
    }

    private genPatternName(letter : string, tokenType : string=""): def.genericScope{
        const token = `${letter}${tokenType}`
        const name = `source.${this.fileType}.${token}`;
        return name as def.genericScope;
    }

    private genPattern(letter : string, tokenType : string=""): def.PatternRule {
        const name = this.genPatternName(letter, tokenType);
        const match = `${this.genRegEx(letter)}+`;

        return {name,match}
    }
    
    private writeToFile(output : string): void{
        fs.mkdirSync(path.dirname(this.targetPath), {recursive: true});
        fs.appendFileSync(this.targetPath, output+'\n', "utf8");
    } 
    
    private writeJSON(output : any): void{
        fs.mkdirSync(path.dirname(this.targetPath), {recursive: true});
        const jsonStr = JSON.stringify(output, null, 4)
        fs.appendFileSync(this.targetPath, jsonStr+'\n', "utf8");
    }

    private writePattern(letter : string, tokenType : string=""):void{
        const pattern = this.genPattern(letter,tokenType);
        this.writeJSON(pattern);
        vscUtils.print(`Wrote pattern for ${letter} (${tokenType}) to (${this.targetPath})`);
    }

    private writeFileTopper(){
        switch(this.targetFolder){  
            case "syntaxes":
                this.writeToFile(`{`)
                this.writeToFile(`  "patterns": [ { "include": "#keywords" } ],`)
                this.writeToFile(`  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",`)
                this.writeToFile(`  "scopeName": "source.fasta",`)
                this.writeToFile(`  "fileTypes": [${def.arrayToStr(this.variants)}],`)
                this.writeToFile(`  "name": "${this.fileType.toUpperCase()}",`)
                this.writeToFile(`  "repository": {`)
                this.writeToFile(`    "keywords": {`)
                this.writeToFile(`      "patterns": [`)
                break;
            case "palettes":
                this.writeToFile("{");
                this.writeToFile(`  "name": "${this.fileDescript}",`);
                this.writeToFile(`  "tokenColors": [`);
                break;
            default:
                throw new Error(`Unknown ruleType: ${this.targetFolder}`);
            }
        }

    private writeFileEnd(): void{
        switch(this.targetFolder){  
            case "syntaxes":
                this.writeToFile(`      ]`);
                this.writeToFile(`    }`);
                this.writeToFile(`  }`);
                this.writeToFile(`}`);
                break;
            case "palettes":
                this.writeToFile(`  ]`);
                this.writeToFile(`}`);
                break;
            default:
                throw new Error(`Unknown ruleType: ${this.targetFolder}`);
        }
    }

    public writePatterns(letterMap : Record<string,string>){
        const entries = Object.entries(letterMap);
        this.writeFileTopper();
        for(let i = 0; i < entries.length; i++){
            const [token, tokenType] = entries[i];
            this.writePattern(token,tokenType);
            if(i < entries.length-1){
                this.writeToFile (",");
            }
        }
        this.writeFileEnd();
    }
}   