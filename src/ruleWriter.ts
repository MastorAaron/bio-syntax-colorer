import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { getPatcherInstance, PatchColors } from "./patch";
import { RegExBuilder } from "./regExBuilder";
import { Theme as Theme } from "./extension";
import { vscUtils } from "./vscUtils";

export const LANG_REGEX = "(fasta|fastq)";
export const THEME_REGEX = "(warm|cool|cold)";

export const LANGFILE_REGEX = new RegExp(`^${LANG_REGEX}\\.tmLanguage\\.json$`);
export const COLORFILE_REGEX = new RegExp(`^${LANG_REGEX}-colors-${THEME_REGEX}\\.json$`);
export const DECONFILE_REGEX = new RegExp(`^${THEME_REGEX}-deconstruct\\.json$`);

export type RuleType  = "syntaxes" | "palettes" | "decon";
export type LangFile  = `${Lang}.tmLanguage.json`;
export type Lang  = "fasta" | "fastq" | "else";
export type ColorFile = `${Lang}-colors-${Theme}.json`;
export type DeconFile = `${string}-deconstruct.json`; // type StripFile = `${string}-stripped.json` ;
export type JsonFile = LangFile | ColorFile | DeconFile; //| StripFile;

export class FileMeta {
    //Public by default
        lang!: Lang;
        theme?: Theme;
        jsonKind!: RuleType;
        filePath: JsonFile;
        fullFilePath!: JsonFile;
        variants?: string[];

    constructor(filePath: string) {
        this.filePath = filePath as JsonFile;
        this.validateFilePath(filePath as JsonFile);
        this.fullFilePath=filePath as JsonFile;
        this.setVariants();
    }

    public validateFilePath(filePath: JsonFile){
        const base = path.basename(filePath);
        vscUtils.print(`[FileMeta] validateFilePath → full="${filePath}"   base="${base}"`);
        
        if (LANGFILE_REGEX.test(base)) {
            this.extractFromLangFile(base as LangFile);
            
        //filePath.match(COLORFILE_REGEX) //returns an array
        }else if (COLORFILE_REGEX.test(base)) {
            this.extractFromColorFile(base as ColorFile);
        
        } else if (DECONFILE_REGEX.test(base)) {
            this.extractFromDeconFile(base as DeconFile);
    
        } else {
            throw new Error(`Unrecognized file format: ${filePath}`);
        }
    }
    private extractFromLangFile(filePath: LangFile){
        this.jsonKind = "syntaxes";
        const match = filePath.match(LANGFILE_REGEX);

        if (match){ 
            this.lang = match[1] as Lang;
        }else{
            throw new Error(`Invalid LangFile format: ${filePath}`);
        }
    } 
    
    private extractFromColorFile(filePath: ColorFile){
        this.jsonKind = "palettes";
        const match = filePath.match(COLORFILE_REGEX);

        if (match) {
            this.lang = match[1] as Lang;
            this.theme = match[2] as Theme;
        }else{
            throw new Error(`Invalid ColorFile format: ${filePath}`);
        }
    } 
    
    private extractFromDeconFile(filePath: DeconFile){
        this.jsonKind = "decon";
        const match = filePath.match(DECONFILE_REGEX);
        if (match) {
            this.lang = match[1] as Lang;
            this.theme = match[2] as Theme;
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

    public filePartner(): JsonFile{ //MAYBE TOO GENERIC USE THE HELPERS TO BE EXPLICIT
        if(this.jsonKind === "palettes" || this.jsonKind === "decon"){
            return this.genLangPath();
        }
        if(this.jsonKind === "syntaxes"){
            return this.genColorPath();
        }else{
            throw new Error(`Unrecognized file format: ${this.filePath}`);
        }
    } 
    
    public genLangPath(){
        return `${this.lang}.tmLanguage.json` as LangFile;
    }

    public genColorPath(){
        return `${this.lang}-colors-${this.theme}.json` as ColorFile;
    }
    
    public genDeconFile(){
        return `${this.theme!.toLowerCase()}-deconstruct.json` as DeconFile;
    }
}

export interface LangParams{
    jsonKind: "syntaxes";

    variants: string[];
    palFlavor: Theme;
    
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

    protected patcher: PatchColors;
    protected regi = new RegExBuilder(false); 
    
constructor(protected context: vscode.ExtensionContext, fileKind: Lang, jsonKind: RuleType){
        this.fileType =fileKind;
        this.JSONType = jsonKind;
        this.patcher = getPatcherInstance();
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

    public pullRule(tokenName: string, palettePath: ColorFile): def.ColorRule | null {
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

