import * as vscode from "vscode";
import * as def from "./definitions";
import * as rW from "./ruleWriter";
import * as fs from "fs";

import { RuleWriter, PaletteParams, JsonFile, DeconFile } from "./ruleWriter";
import { vscUtils, themeUtils } from "./vscUtils";
import { HoverObj } from "./hoverOver";
import { Themes } from "./extension";

export class PaletteGenerator extends RuleWriter{
    protected fileDescript : string; 
    protected palFlavor : Themes;

    private deconInput? : DeconFile;
    protected deconOutput? : DeconFile;

    constructor(context: vscode.ExtensionContext, params : PaletteParams){
        const meta = new rW.FileMeta(params.paletteFile);

        if (meta.jsonKind !== "syntaxes") {
            throw new Error(`Invalid file passed to LangGenerator: ${params.paletteFile}`);
        }

        super(context, meta.lang, "palettes");

        this.palFlavor = meta.theme!;
        this.fileDescript = params.descript;
        this.deconInput = params.deconPalFile;
    }

    private deterFontSytle(tokenType : string): string{
        return (tokenType === "Title")? "bold" : "";
    }

    override genOutputFileStr(): JsonFile{
        return `${this.fileType}-colors-${this.palFlavor}.json` as JsonFile;
    }
    
    private pullDeconColor( lang : string, tokenType : string, letter : string ): def.ColorHex{
        const palette = this.pullDeconPalette();

        const tokenGroup = palette[lang]?.[tokenType];
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
        const currAlpha = def.deterAlpha(tokenType);

        const name = def.getDescription(letter, currAlpha,`./null.${this.fileType}` as def.FilePath,true).trim();
        const scope = this.genPatternNameScope(letter, tokenType) as def.NameScope;
            const colorHex = this.pullDeconColor( lang, tokenType, letter );
            const foreground = `${colorHex}` as def.ColorHex;
            const fontStyle = this.deterFontSytle(tokenType) as string;
            const settings = (fontStyle !== "")? {foreground,fontStyle} : {foreground};

        return {name,scope,settings};
    }

    public readFromFile(filePath : JsonFile | DeconFile): string{
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

        private pullDeconPalette():def.DeconstructedPalette{
        if (!this.deconInput) {
            throw new Error("No deconstructed palette file provided.");
        }
        const raw = this.readFromFile(this.deconInput);      
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
        this.writeToFile(`  "name": "${this.capFront(this.palFlavor!)}",`);
        this.writeToFile(`  "description": "${this.fileDescript}",`);
        this.writeToFile(`  "tokenColors": [`);
    }

    public writeFileEnd(): void{
        this.writeToFile(`  ]`);
        this.writeToFile(`}`);
    }
    
    public writeRules(lang : string){
        const entries = Object.entries(def.tokenStripMap[lang]);
        this.writeFileTopper();

        const total = entries.reduce((sum, [, tokens]) => sum + tokens.length, 0);
        let count = 0;

        for(let i = 0; i < entries.length; i++){
            const [ tokenType , tokens ] = entries[i];
            
            for(let j = 0; j < tokens.length; j++){
                const token = tokens[j];
                count++;

                const comma = count < total ? "," : "";
                this.writeRule(token, tokenType, comma);
            }
        }
        this.writeFileEnd();
    }

}