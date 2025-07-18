import * as def from "./definitions";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
// import { getPatcherInstance, PatchColors } from "./patch";
// import { RegExBuilder } from "./regExBuilder";
import { Theme as Theme } from "./extension";
import { vscUtils } from "./vscUtils";

export const LANG_REGEX = "(fasta|fastq)";
export const MYTHOS_REGEX = "(hades|jadedragon)";
export const ALPHA_ONLY_REGEX = "[a-zA-Z]+";
export const TEMP_REGEX = "(warm|cool|cold)";
export const THEME_REGEX = `(${MYTHOS_REGEX}|${TEMP_REGEX})`;
export const DEV_THEME_REGEX = `(${MYTHOS_REGEX}|${TEMP_REGEX}|${ALPHA_ONLY_REGEX})`;

export const LANGFILE_REGEX = new RegExp(`^${LANG_REGEX}\\.tmLanguage\\.json$`);
export const COLORFILE_REGEX = new RegExp(`^${LANG_REGEX}-colors-${THEME_REGEX}\\.json$`);
export const DECONFILE_REGEX = new RegExp(`^${THEME_REGEX}-deconstruct\\.json$`);

export type RuleType  = "syntaxes" | "palettes" | "decon";
export type LangFile  = `${Lang}.tmLanguage.json`;
export type Lang  = "fasta" | "fastq" | "else";
export type ColorFile = `${Lang}-colors-${Theme}.json`;
export type DeconFile = `${Theme}-deconstruct.json`; // type StripFile = `${string}-stripped.json` ;
export type JsonFile = LangFile | ColorFile | DeconFile; //| StripFile;


export type FilePath = string & { readonly __paletteFilePath: unique symbol }; // Used for external paths

export class FileMeta {
    //Public by default
        lang!: Lang;
        theme?: Theme;
        jsonKind!: RuleType;
        fullFilePath!: FilePath;
        variants?: string[];

    constructor(public fileName: JsonFile, private context: vscode.ExtensionContext) {
        this.validateFileName();
        if(this.jsonKind == "syntaxes")this.setVariants();
        this.genFullFilePath();
        vscUtils.print(`[FileMeta] validateFilePath → full="${this.fullFilePath} → fileName=\"${this.fileName}\"}"`);
    }

    private genFullFilePath(){
        const folder = (this.jsonKind == "decon")? "palettes/decon" :  this.jsonKind;
        this.fullFilePath = path.join(this.context.extensionPath, folder, this.fileName) as FilePath;
    }

    public isTmLangFile(base : string){
        return LANGFILE_REGEX.test(base);
    }
    
    public isPalatteFile(base : string){
        return COLORFILE_REGEX.test(base);
    }
    public isDeconFile(base : string){
        return DECONFILE_REGEX.test(base);
    }

    private validateFileName(){
        const base = path.basename(this.fileName);
        vscUtils.print(`[FileMeta] validateFileName → fileName="${this.fileName}" base="${base}"`);

       
        
        if(this.isTmLangFile(base)) {
            this.decomposeLangFileName(base as LangFile);
            
        } else if (this.isPalatteFile(base)) {
            this.decomposeColorFileName(base as ColorFile);
            
        } else if (this.isDeconFile(base)) {
            this.decomposeDeconFileName(base as DeconFile);
            
        } else {
            throw new Error(`Unrecognized file format: ${this.fullFilePath}`);
        }
    }
    private decomposeLangFileName(fileName: LangFile){
        this.jsonKind = "syntaxes"
        const match = fileName.match(LANGFILE_REGEX);
        
        if (match){ //fileName.match(COLORFILE_REGEX) //returns an array
            this.lang = match[1] as Lang;
        }else{
            throw new Error(`Invalid LangFile format: ${fileName}`);
        }
    } 
    
    private decomposeColorFileName(fileName: ColorFile){
        this.jsonKind = "palettes";
        const match = fileName.match(COLORFILE_REGEX);

        if (match) {
            this.lang = match[1] as Lang;
            this.theme = match[2] as Theme;
        }else{
            throw new Error(`Invalid ColorFile format: ${fileName}`);
        }
    } 
    
    private decomposeDeconFileName(fileName: DeconFile){
        this.jsonKind = "decon";
        const match = fileName.match(DECONFILE_REGEX);
        if (match) {
            this.theme = match[1] as Theme;
        } else {
            throw new Error(`Invalid DeconFile format: ${fileName}`);
        }
    } 
    
    public genNewColorFile(theme: Theme): FileMeta{
        const newFile = `${this.lang}-colors-${theme}.json`
        vscUtils.vscCOUT(`File Meta created for : ${newFile}`);
        const newMeta = new FileMeta(newFile as ColorFile, this.context);
        return newMeta;
        
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
            throw new Error(`Unrecognized file format: ${this.fullFilePath}`);
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
