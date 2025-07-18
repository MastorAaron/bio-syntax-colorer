import * as vscode from "vscode";
import * as def from "./definitions";
// import * as rW from "./ruleWriter";
import { RuleWriter, PaletteParams } from "./ruleWriter";
import * as fs from "fs";

import { vscUtils, themeUtils } from "./vscUtils";
import { HoverObj } from "./hoverOver";
import { Theme } from "./extension";
import { FileMeta, LangFile, DeconFile, ColorFile, JsonFile, Lang, RuleType, FilePath } from "./fileMeta";

export interface DeconstructedPalette {
  [language: string]: {
    [tokenGroup: string]: {
      [token: string]: string;
    };
  };
}

export class PaletteGenerator extends RuleWriter{
    protected fileDescript : string; 
    protected theme : Theme;
    private deconMeta?: FileMeta;

    private deconInput? : DeconFile;
    protected deconOutput? : DeconFile;

    constructor(context: vscode.ExtensionContext, params : PaletteParams){
        const meta = new FileMeta(params.paletteFile,context);

        if (meta.jsonKind !== "palettes") {
            throw new Error(`Invalid file passed to LangGenerator: ${params.paletteFile}`);
        }

        super(context, meta.lang, "palettes");
        this.theme = meta.theme!;
        this.fileDescript = params.descript;
        
        if (params.deconFile) {
            this.deconMeta = new FileMeta(params.deconFile, context);
        }
        this.finalizePathSetup();
    }

    private deterFontSytle(tokenType : string): string{
        return (tokenType === "Title")? "bold" : "";
    }

    override genOutputFileStr(): JsonFile{
        return `${this.fileType}-colors-${this.theme}.json` as ColorFile;
    }
    
    private pullDeconColor( lang : string, tokenType : string, letter : string ): def.ColorHex{
        const palette = this.pullDeconPalette();

        const tokenGroup = palette[lang]?.[tokenType] || palette[lang]?.[tokenType.toLowerCase()];
            if (!tokenGroup) {
                throw new Error(`Token group '${tokenType}' not found in palette for ${lang}`);
            }

        const colorHex = tokenGroup[letter];
            if (!colorHex) {
                throw new Error(`Color for token '${letter}' in group '${tokenType}' not found`);
            }
        return colorHex as def.ColorHex;
    }

    private genColorRule( lang : string, tokenType : string, letter : string ): def.ColorRule {
        //Use Ambigous Descriptions from Defintions as Name parameter 
        // const currAlpha = def.deterAlpha(tokenType);

        const name = def.getDescription(letter, "Ambigous" as def.Alphabet,`./null.${this.fileType}` as FilePath,true).trim();
        const scope = this.genPatternNameScope(letter, tokenType) as def.NameScope;
            const colorHex = this.pullDeconColor( lang, tokenType, letter );
            const foreground = `${colorHex}` as def.ColorHex;
            const fontStyle = this.deterFontSytle(tokenType) as string;
            const settings = (fontStyle !== "")? {foreground,fontStyle} : {foreground};

        return {name,scope,settings};
    }

    public readFromFile(filePath : FilePath): string{
        return fs.readFileSync(filePath, "utf8");      
    }

    public getColorFromSettings(rule : def.ColorRule){
        const container = rule.settings;
        const colorHex = container.foreground? container.foreground : container.background;
        return colorHex;
    }
    
    protected getColorFromRule(rule: def.ColorRule): def.ColorHex{
        if(!rule){
            return themeUtils.defaultTextColor();
        }
        return this.getColorFromSettings(rule) as def.ColorHex;
    }

    public writeRule(lang:string, tokenType : string="", letter : string, comma : string=""):void{
        const colorRule = this.genColorRule(lang, tokenType, letter);
        this.writeJSON(colorRule,comma);
        vscUtils.print(`Color bound to Rule for ${letter} (${tokenType}) to (${this.actualPalFile})`);
    }

    private pullDeconPalette():DeconstructedPalette{
        if (!this.deconMeta?.fullFilePath) {
            throw new Error("No deconstructed palette file provided.");
        }
        const raw = this.readFromFile(this.deconMeta.fullFilePath);      
        return JSON.parse(raw);
    }

    public extractTokenPairsFromPalette(): [string, string][] {
        const palette = this.pullDeconPalette();
        const fileSection = palette[this.fileType];

        const entries: [string, string][] = [];

        for (const tokenType in fileSection) {
            const letterGroup = fileSection[tokenType];
            for (const letter in letterGroup) {
                entries.push([tokenType, letter]);
            }
        }
        return entries;
    }

    public extractTokenMap(): Record<string, [string, string][]> {
        const palette = this.pullDeconPalette();
        const result: Record<string, [string, string][]> = {};

        for (const lang in palette) {
            const group = palette[lang];
            result[lang] = [];

            for (const tokenType in group) {
                const tokenGroup = group[tokenType];
                for (const letter in tokenGroup) {
                    result[lang].push([tokenType, letter]);
                }
            }
        }
    return result;
}
    override writeFileTopper(){
        this.writeToFile("{");
        this.writeToFile(`  "name": "${this.capFront(this.theme!)}",`);
        this.writeToFile(`  "description": "${this.fileDescript}",`);
        this.writeToFile(`  "tokenColors": [`);
    }

    public writeFileEnd(): void{
        this.writeToFile(`  ]`);
        this.writeToFile(`}`);
    }
    
    private writeTokens(lang : string){
        const entries = Object.entries(def.tokenStripMap[lang]);
        const total = entries.reduce((sum, [, tokens]) => sum + tokens.length, 0);
        
        let commaCtr = 0;
        for(let i = 0; i < entries.length; i++){
            const [ tokenType , tokens ] = entries[i];
            
            for(let j = 0; j < tokens.length; j++){
                const token = tokens[j];
                commaCtr++;

                const comma = (commaCtr < total) ? "," : "";
                // this.writeRule(token, tokenType, comma);
                this.writeRule(lang, tokenType, token, comma);
            }
        }
    }

    public writeRules(lang : string){
        this.writeFileTopper();
        if(lang == "fastq"){
            this.writeTokens("fasta");
            this.writeToFile(`,`)
        }
        this.writeTokens(lang);
        this.writeFileEnd();
    }
}