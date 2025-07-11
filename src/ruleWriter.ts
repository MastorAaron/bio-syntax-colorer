import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { PatchColors } from "./patch";
import { RegExBuilder } from "./regExBuilder";
import { vscUtils, themeUtils } from "./vscUtils";

export type ruleType  = "syntaxes" | "palettes" | "strip";
export type langFile  = `${string}.tmLanguage.json`;
export type colorFile = `${string}-colors.json`;
export type DeconFile = `${string}-Deconstruct.json`;
// type StripFile = `${string}-stripped.json` ;
export type JsonFile = langFile | colorFile | DeconFile; //| StripFile;

export interface LangParams{
    fileKind: string;
    variants: string[];
    theme: string;
    
    stripRuleFile?: DeconFile;
}

// export interface PatternStripParams{
//     jsonKind: "strip";
//     theme: string;
    
//     actualRuleFile : JsonFile;
//     stripRuleFile?: DeconFile;
// }

export interface PaletteParams{
        jsonKind: "palettes";
        fileKind: string;
        
        descript: string;
        theme: string;
        actualPalFile : JsonFile;
        deconPalFile?: DeconFile;

    }

export interface ColorDeconParams{
    jsonKind: "decon";
    theme: string;
    actualPalFile : JsonFile;
    deconPalFile?: DeconFile;
}

/**
 * Configuration for output file generation.
 * Determines type, filename, description, and variant extensions.
*/

type PatternParams = { jsonKind: "syntaxes" } & LangParams;
type ColorParams = { jsonKind: "palettes" } & PaletteParams;
type RuleParams = PatternParams | ColorParams;

export abstract class RuleWriter{
    //Both Types
        protected outputFile: JsonFile;
        protected targetPath: def.FilePath;
        
        protected fileType: string;
        protected JSONType: ruleType;
    
    //Other Class Objects
        protected regi = new RegExBuilder(false); 
        protected patcher  = new PatchColors(this.context);
    
    constructor(protected context: vscode.ExtensionContext, params :  RuleParams){
        this.JSONType = params.jsonKind;
        this.fileType = params.fileKind.toLowerCase();
        this.outputFile = this.genOutputFileStr();
        this.targetPath = this.genPath();
    }

    public clear(): void {
        const file = this.targetPath;
        fs.mkdirSync(path.dirname(file), { recursive: true });

        fs.writeFileSync(file, "", "utf8");
        vscUtils.print(`Cleared file at: ${file}`);
    }

    protected abstract writeFileTopper(): void
    protected abstract writeFileEnd(): void
    
    abstract genOutputFileStr(): JsonFile

    protected genPath(): def.FilePath{
        const filePath = 
        path.isAbsolute(this.outputFile)
        ? this.outputFile as def.FilePath
        : path.join(this.context.extensionPath, this.JSONType, path.basename(this.outputFile)) as def.FilePath;
        
        return filePath;
    }
    
    private extractFileType(filename: string): string{
        return path.extname(filename);
    }    

    protected genPatternNameScope(letter : string, tokenType : string=""): def.GenericScope {
       // Resolve symbol alias if it's a known special symbol, otherwise fallback to original letter
        const resolvedToken = def.isSymbol(letter)
        ? def.symbolLookUpMap[letter as keyof typeof def.symbolLookUpMap] ?? letter
        : letter;

        const spacer = (tokenType === "quality")? '.':'';
        const token = `${tokenType}${spacer!}${resolvedToken}`;
        const name = `source.${this.fileType}.${token}`;
        return name as def.GenericScope;
    }

    public pullRule(tokenName: string, palettePath: def.PaletteFilePath): def.ColorRule | null {
        const palette = this.patcher.loadColors(palettePath);
        const scope = def.tokenMap[tokenName.toUpperCase() as def.tokenType];
        if (!scope) {
            vscUtils.vscCOUT(`Token "${tokenName}" not found in tokenMap.`);
            return null;
        }
        return palette.find(rule => rule.scope === scope) || null;
    }//TODO: Implement Edits to rules as a seperate rule with its own "userEdit" Tag
    //TODO: For ease of deletion and reset to defaults but also prioritization of `UserEdit`s above Default settings
    
    protected writeToFile(output : string): void{
        fs.mkdirSync(path.dirname(this.targetPath), {recursive: true});
        fs.appendFileSync(this.targetPath, output+'\n', "utf8");
    } 
    
    protected writeJSON(output : any, commaORsuffix? : string): void{
        const jsonStr = JSON.stringify(output, null, 4)
        this.writeToFile(`${jsonStr+ (commaORsuffix ?? "")}`);
    }

    public capitalizeFirstLetter(val: string) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
}   

