import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { PatchColors } from "./patch";
import { RegExBuilder } from "./regExBuilder";
import { Themes } from "./extension";
import { vscUtils } from "./vscUtils";

export type RuleType  = "syntaxes" | "palettes" | "decon";
export type LangFile  = `${Lang}.tmLanguage.json`;
export type Lang  = "fasta" | "fastq" | "else";
export type ColorFile = `${Lang}-${string}-colors.json`;
export type DeconFile = `${string}-Deconstruct.json`; // type StripFile = `${string}-stripped.json` ;
export type JsonFile = LangFile | ColorFile | DeconFile; //| StripFile;

export class FileMeta {
    lang!: Lang;
    theme?: Themes;
    jsonKind!: RuleType;
    filePath: JsonFile;
    variants?: string[];

    constructor(filePath: string) {
        this.filePath = filePath as JsonFile;
        this.parseFilePath(filePath as JsonFile);
    }

    private parseFilePath(filePath: JsonFile){
        if (filePath.endsWith(".tmLanguage.json")) {
            this.parseLangFile(filePath as LangFile);
        } else if (filePath.endsWith("-colors.json")) {
            this.parseColorFile(filePath as ColorFile);
        } else if (filePath.endsWith("-Deconstruct.json")) {
            this.parseDeconFile(filePath as DeconFile);
        } else {
            throw new Error(`Unrecognized file format: ${filePath}`);
        }
        this.setVariants();
    }
    private parseLangFile(filePath: LangFile){
        this.jsonKind = "syntaxes";
        const match = filePath.match(/^(.+)\.tmLanguage\.json$/);
        
        if (match){ 
            this.lang = match[1] as Lang;
        }else{
            throw new Error(`Invalid LangFile format: ${filePath}`);
        }
    } 
    
    private parseColorFile(filePath: ColorFile){
        this.jsonKind = "palettes";
        const match = filePath.match(/^(.+)-(.+)-colors\.json$/);
        if (match) {
            this.lang = match[1] as Lang;
            this.theme = match[2] as Themes;
        }else{
            throw new Error(`Invalid ColorFile format: ${filePath}`);
        }
    } 
    
    private parseDeconFile(filePath: DeconFile){
        this.jsonKind = "decon";
        const match = filePath.match(/^(.+)-(.+)-Deconstruct\.json$/);
        if (match) {
            this.lang = match[1] as Lang;
            this.theme = match[2] as Themes;
        } else {
            throw new Error(`Invalid DeconFile format: ${filePath}`);
        }
    }

    private setVariants(){
        if(this.lang == "fasta"){
            this.variants = [ "fasta", "fastq", "fa" ]
        } 
        if(this.lang == "fastq"){
            this.variants = [ "fastq", "fa", "fna", "faa" ]
        } 
    }

    public filePartner(){
        if(this.jsonKind === "palettes" || this.jsonKind === "decon"){
            return `${this.lang}.tmLanguage.json` as LangFile;
        }
        if(this.jsonKind === "syntaxes"){
            return `${this.lang}-${this.theme}-colors.json` as ColorFile;
        }else{
            throw new Error(`Unrecognized file format: ${this.filePath}`);
        }
    }
}

export interface LangParams{
    jsonKind: "syntaxes";

    variants: string[];
    palFlavor: Themes;
    
    tmLangFile : LangFile;//langFile  = `${lang}.tmLanguage.json`
    stripRuleFile?: DeconFile;
}

export interface PaletteParams{
    jsonKind: "palettes";
    
    descript: string;

    paletteFile : ColorFile;
    deconPalFile?: DeconFile;
}

export interface ColorDeconParams{
    jsonKind: "decon";

    paletteFile : ColorFile;
    deconPalFile?: DeconFile;
}
// export interface PatternStripParams{
//     jsonKind: "strip";
//     theme: string;
    
//     actualRuleFile : JsonFile;
//     stripRuleFile?: DeconFile;
// }
/**
 * Configuration for output file generation.
 * Determines type, filename, description, and variant extensions.
*/

type PatternParams = { jsonKind: "syntaxes" } & LangParams;
type ColorParams = { jsonKind: "palettes" } & PaletteParams;
type RuleParams = PatternParams | ColorParams;

export abstract class RuleWriter{
    protected outputFile!: JsonFile;
    protected actualPalFile!: def.FilePath;
    
    protected fileType: Lang;
    protected JSONType: RuleType;

    protected regi = new RegExBuilder(false); 
    protected patcher  = new PatchColors(this.context);
    
    constructor(protected context: vscode.ExtensionContext, fileKind: Lang, jsonKind: RuleType){
        this.fileType =fileKind;
        this.JSONType = jsonKind;
    }

    public clear(): void {
        const file = this.actualPalFile;
        fs.mkdirSync(path.dirname(file), { recursive: true });

        fs.writeFileSync(file, "", "utf8");
        vscUtils.print(`Cleared file at: ${file}`);
    }

    protected finalizePathSetup() {
        this.outputFile = this.genOutputFileStr();
        this.actualPalFile = this.genPath();
    }

    protected abstract writeFileTopper(): void
    protected abstract writeFileEnd(): void
    
    abstract genOutputFileStr(): JsonFile

    // protected 
    public genPath(): def.FilePath{
        const filePath = 
        path.isAbsolute(this.outputFile)
        ? this.outputFile as def.FilePath
        : path.resolve(this.context.extensionPath, this.JSONType, path.basename(this.outputFile)) as def.FilePath;
        
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
        fs.mkdirSync(path.dirname(this.actualPalFile), {recursive: true});
        fs.appendFileSync(this.actualPalFile, output+'\n', "utf8");
    } 
    
    protected writeJSON(output : any, commaORsuffix? : string): void{
        const jsonStr = JSON.stringify(output, null, 4)
        this.writeToFile(`${jsonStr+ (commaORsuffix ?? "")}`);
    }

    public capFront(val: string) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
}   

