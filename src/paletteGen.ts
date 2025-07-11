import * as vscode from "vscode";
import * as def from "./definitions";
import * as rW from "./ruleWriter";
import * as fs from "fs";
import { RuleWriter, ColorDeconParams, JsonFile, DeconFile } from "./ruleWriter";
import { vscUtils, themeUtils } from "./vscUtils";
import { HoverObj } from "./hoverOver";

export class PaletteGenerator extends RuleWriter{
    protected fileDescript : string; 
    protected theme : string;

    private deconInput? : DeconFile;
    protected deconOutput? : DeconFile;

    //Other Class Objects
    private copter  = new HoverObj;

    constructor(context: vscode.ExtensionContext, params : rW.PaletteParams){
        super(context, {...params, jsonKind: "palettes"});

        this.fileDescript = params.descript;
        this.theme = params.theme?.toLowerCase();
        this.deconInput = params.deconPalFile;
    }

    private deterFontSytle(tokenType : string): string{
        return (tokenType === "Title")? "bold" : "";
    }

    override genOutputFileStr(): JsonFile{
        return `${this.fileType}-colors-${this.theme!}.json` as JsonFile;
    }
    
    private pullDeconColor( fileScope : string, tokenType : string, letter : string ): def.ColorHex{
        const palette = this.pullDeconPalette();

        const tokenGroup = palette[fileScope]?.[tokenType];
            if (!tokenGroup) {
                throw new Error(`Token group '${tokenType}' not found in palette for ${fileScope}`);
            }

        const colorHex = tokenGroup[letter];
            if (!colorHex) {
                throw new Error(`Color for token '${letter}' in group '${tokenType}' not found`);
            }
        return colorHex as def.ColorHex;
    }

    private genColorRule( fileScope : string, tokenType : string, letter : string ): def.ColorRule {
        //Use Ambigous Descriptions from Defintions as Name parameter 
        const name = this.copter.getDescription(letter, `./null.${this.fileType}` as def.FilePath,true).trim();
        const scope = this.genPatternNameScope(letter, tokenType) as def.NameScope;
            const colorHex = this.pullDeconColor( fileScope, tokenType, letter );
            const foreground = `${colorHex}` as def.ColorHex;
            const fontStyle = this.deterFontSytle(tokenType) as string;
            const settings = (fontStyle !== "")? {foreground,fontStyle} : {foreground};

        return {name,scope,settings};
    }

    public readFromFile(filePath:JsonFile | DeconFile): string{
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

    public writeRule(fileScope:string, tokenType : string="", letter : string, comma : string=""):void{
        const colorRule = this.genColorRule(fileScope, tokenType, letter);
        this.writeJSON(colorRule,comma);
        vscUtils.print(`Color bound to Rule for ${letter} (${tokenType}) to (${this.targetPath})`);
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

        for (const fileScope in palette) {
            const group = palette[fileScope];
            result[fileScope] = [];

            for (const tokenType in group) {
                const tokenGroup = group[tokenType];
                for (const letter in tokenGroup) {
                    result[fileScope].push([tokenType, letter]);
                }
            }
        }
    return result;
}
    override writeFileTopper(){
        this.writeToFile("{");
        this.writeToFile(`  "name": "${this.capitalizeFirstLetter(this.theme!)}",`);
        this.writeToFile(`  "description": "${this.fileDescript}",`);
        this.writeToFile(`  "tokenColors": [`);
    }

    public writeFileEnd(): void{
        this.writeToFile(`  ]`);
        this.writeToFile(`}`);
    }
    
    public writeRules(letters : string[], fileScope : string){//TODO: incorp actual structure of letterMap here
        // for(const token of letters){
        //     this.writeRule(token, fileScope, comma="", fileScope);

        // }
    }

}