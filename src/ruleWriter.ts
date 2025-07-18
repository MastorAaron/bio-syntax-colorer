import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { getPatcherInstance, PatchColors } from "./patch";
import { RegExBuilder } from "./regExBuilder";
import { Theme as Theme } from "./extension";
import { vscUtils } from "./vscUtils";
import { LangFile, DeconFile, ColorFile, JsonFile, Lang, RuleType, FilePath } from "./fileMeta";

export interface LangParams{
    jsonKind: "syntaxes";

    variants: string[];
    theme: Theme;
    
    tmLangFile : LangFile;//langFile  = `${lang}.tmLanguage.json`
    deconInputFile? : DeconFile;
}

export interface PaletteParams{
    descript: string;

    paletteFile : ColorFile;
    deconFile?: DeconFile;
}

export interface ColorDeconParams{
    jsonKind: "decon";

    paletteFile : ColorFile;
    deconFile?: DeconFile;
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
    protected actualPalFile!: FilePath;
    
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
        /**
     * Subclasses must call finalizePathSetup() once fileType and outputFile are determined.
     * This guarantees actualPalFile is ready before calling clear(), writeFileTopper(), etc.
     */


    protected abstract writeFileTopper(): void
    protected abstract writeFileEnd(): void
    
    abstract genOutputFileStr(): JsonFile

    // protected 
    public genPath(): FilePath{ 
        const folders = (this.JSONType == "decon")? "palettes/decon": this.JSONType 

        const filePath = 
        path.isAbsolute(this.outputFile)
        ? this.outputFile as FilePath
        : path.resolve(this.context.extensionPath, folders, path.basename(this.outputFile)) as FilePath;
        
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
        const source = (tokenType == "title")? "": "source.";
        const name = `${source}${this.fileType}.${token}`;
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

