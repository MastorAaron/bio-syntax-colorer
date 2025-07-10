import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { HoverObj } from "./hoverOver";
import { PatchColors } from "./patch";
import { RegExBuilder } from "./regExBuilder";
import { vscUtils, themeUtils } from "./vscUtils";

type ruleType  = "syntaxes" | "palettes";
type langFile  = `${string}.tmLanguage.json`;
type colorFile = `${string}-colors.json`;
type JsonFile  = langFile | colorFile;
type DeconFile = `${string}-Deconstruct.json` | `${string}-colors.json`;

interface PatternRuleParams{
    fileKind: string;
    variants: string[];
}
interface ColorRuleParams{
    jsonKind: "palettes";
    fileKind: string;
    
    descript: string;
    temperature: string;
    deconPalFile: DeconFile;
    actualPalFile : JsonFile;

}



/**
 * Configuration for output file generation.
 * Determines type, filename, description, and variant extensions.
*/

type PatternParams = { jsonKind: "syntaxes" } & PatternRuleParams;
type ColorParams = { jsonKind: "palettes" } & ColorRuleParams;
type RuleParams = PatternParams | ColorParams;

abstract class RuleWriter{
    //Both Types
        protected outputFile: JsonFile;
        protected targetPath: def.FilePath;
        
        protected fileType: string;
        protected JSONType: ruleType;
    
    //Other Class Objects
        // private regi : RegExBuilder; 
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
    
    protected writeJSON(output : any, comma? : string): void{
        const jsonStr = JSON.stringify(output, null, 4)
        this.writeToFile(`${jsonStr+comma}`);
    }

    public capitalizeFirstLetter(val: string) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
}   

export class PatternRuleGenerator extends RuleWriter{
    private variants: string[];
    private regi = new RegExBuilder(false);

    constructor(context: vscode.ExtensionContext, params : PatternRuleParams){
        super(context, params as RuleParams);
        this.variants = params.variants;
    }

    private genRegEx(letter : string, tokenType=""): def.RegEx{
        switch(tokenType){  
            case "nt":
                return `[${this.regi.genNukeRegEx(letter,true)}]+`;
            case "aa":
                return `[${this.regi.genAminoRegEx(letter,true)}]+`;
            case "sym":
            case "Title":
                return `[${letter}.]+` 
            default:
                throw new Error(`Unknown tokenType: ${tokenType}`);
                return `[${this.regi.genNukeRegEx(letter,true)}]+`;
            }
    }

    override genOutputFileStr(): JsonFile{
        return `${this.fileType}.tmLanguage.json` as JsonFile;
    }

    private genPatternRule(letter : string, tokenType : string=""): def.PatternRule {
        const name = this.genPatternNameScope(letter, tokenType);
        const match = `${this.genRegEx(letter,tokenType)}`;

        return {name,match}
    }

     
    private writePattern(letter : string, tokenType : string="", comma : string=""):void{
        const pattern = this.genPatternRule(letter,tokenType);
        this.writeJSON(pattern,comma);
        vscUtils.print(`Wrote pattern for ${letter} (${tokenType}) to (${this.targetPath})`);
    }  

    
    public writePatterns(letterMap : Record<string,string[]>){
        const entries = Object.entries(letterMap);
        this.writeFileTopper();

        const total = entries.reduce((sum, [, tokens]) => sum + tokens.length, 0);
        let count = 0;

        for(let i = 0; i < entries.length; i++){
            const [ tokenType , tokens ] = entries[i];
            
            for(let j = 0; j < tokens.length; j++){
                const token = tokens[j];
                count++;

                const comma = count < total ? "," : "";
                this.writePattern(token, tokenType, comma);
            }
        }
        this.writeFileEnd();
    } 

    override writeFileTopper(){
        this.writeToFile(`{`)
        this.writeToFile(`  "patterns": [ { "include": "#keywords" } ],`)
        this.writeToFile(`"$schema": "./schema/tmLanguage.schema.json,"`),
        this.writeToFile(`"$comment": "Forked from https://github.com/martinring/tmlanguage. Canonical source may change.",`)
        this.writeToFile(`  "scopeName": "source.${this.fileType}",`)
        this.writeToFile(`  "fileTypes": [${def.arrayToArrStr(this.variants!)}],`)
        this.writeToFile(`  "name": "${this.fileType.toUpperCase()}",`)
        this.writeToFile(`  "repository": {`)
        this.writeToFile(`      "keywords": {`)
        this.writeToFile(`          "patterns": [`)
    }

    override writeFileEnd(): void{
        this.writeToFile(`            ]`);
        this.writeToFile(`        }`);
        this.writeToFile(`    }`);
        this.writeToFile(`}`);
    }
}

export class ColorRuleGenerator extends RuleWriter{
    private fileDescript : string; 
    private temperature : string;

    private deconInput? : DeconFile;
        

    //Other Class Objects
    private copter  = new HoverObj;

    constructor(context: vscode.ExtensionContext, params : ColorRuleParams){
        super(context, params);

        this.fileDescript = params.descript;
        this.temperature = params.temperature?.toLowerCase();
        this.deconInput = params.deconPalFile;
    }

    private getFontSytle(tokenType : string): string{
        return (tokenType === "Title")? "bold" : "";
    }

    override genOutputFileStr(): JsonFile{
        return `${this.fileType}-colors-${this.temperature!}.json` as JsonFile;
    }

    private genColorRule( fileScope : string, tokenType : string, letter : string ): def.ColorRule {
        //Use Ambigous Descriptions from Defintions as Name parameter 
        const name = this.copter.getDescription(letter, `./null.${this.fileType}` as def.FilePath,true).trim();
        const scope = this.genPatternNameScope(letter, tokenType) as def.NameScope;
            const colorHex = this.pullDeconColor( fileScope, tokenType, letter );
            const foreground = `${colorHex}` as def.ColorHex;
            const fontStyle = this.getFontSytle(tokenType) as string;
            const settings = (fontStyle !== "")? {foreground,fontStyle} : {foreground};

        return {name,scope,settings};
    }

       public readFromFile(filePath:JsonFile | DeconFile): string{
        return fs.readFileSync(filePath, "utf8");      
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

    private pullDeconPalette():def.DeconstructedPalette{
        if (!this.deconInput) {
            throw new Error("No deconstructed palette file provided.");
        }
        const raw = this.readFromFile(this.deconInput);      
        return JSON.parse(raw);
    } 

        public getRuleColor(rule : def.ColorRule){
        const container = rule.settings;
        const colorHex = container.foreground? container.foreground : container.background;
        return colorHex;
    }
    
    private pullRuleColor(tokenType : string, letter : string, fileScope : string, palettePath : def.PaletteFilePath): def.ColorHex{
        const rule = this.pullRule(letter, palettePath);
        if(!rule){
            return themeUtils.defaultTextColor();
        }
        const colorHex = this.getRuleColor(rule);
        return colorHex as def.ColorHex;
    }

    private pullRulePalette(palettePath : JsonFile):def.ColorRule[]{
        return this.patcher.loadColors(palettePath);
    }

     public writeRule(fileScope:string, tokenType : string="", letter : string, comma : string=""):void{
        const colorRule = this.genColorRule(fileScope, tokenType, letter);
        this.writeJSON(colorRule,comma);
        vscUtils.print(`Color bound to Rule for ${letter} (${tokenType}) to (${this.targetPath})`);
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
    
    public writeRules(letters : string[], fileScope : string){//TODO: incorp actual structure of letterMap here
        // for(const token of letters){
        //     this.writeRule(token, fileScope, comma="", fileScope);

        // }
    }

           
    override writeFileTopper(){
        this.writeToFile("{");
        this.writeToFile(`  "name": "${this.capitalizeFirstLetter(this.temperature!)}",`);
        this.writeToFile(`  "description": "${this.fileDescript}",`);
        this.writeToFile(`  "tokenColors": [`);
    }

    public writeFileEnd(): void{
        this.writeToFile(`  ]`);
        this.writeToFile(`}`);
    }

}

// export class PaletteDeconstructor extends ColorRuleGenerator{
//     private outputFile: JsonFile;
//     private inputFile: JsonFile;

//     constructor(input:langFile){
//         this.inputFile=input;
//     }
        
//       private pullRuleColor(rule: def.ColorRule): def.ColorHex{
//         if(!rule){
//             return themeUtils.defaultTextColor();
//         }
//         const colorHex = this.getRuleColor(rule);
//         return colorHex as def.ColorHex;
//     }

// }


