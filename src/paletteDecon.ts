import * as vscode from "vscode";
import * as def from "./definitions";
import * as rW from "./ruleWriter";
import { RuleWriter, ColorDeconParams, JsonFile, DeconFile } from "./ruleWriter";
import { PaletteGenerator } from "./paletteGen";

export class PaletteDeconstructor extends PaletteGenerator{
    private inputPath: JsonFile;
    
    
    // constructor(context: vscode.ExtensionContext, params : ColorDeconParams){
    //     private inputPath: params.actualPalFile;
    //     const theme = params.theme;
    //     const outputFile = `${params.theme}-Deconstruct.json` as  DeconFile;
        
    //     super(context, {
    //         jsonKind: "palettes",
    //         theme: "decon",
    //         fileKind: "decon", // treat theme as fileKind for patching logic
    //         descript: `Deconstructed version of ${params.theme}`,
    //         actualPalFile: params.actualPalFile,
    //         deconPalFile: outputFile // or params.deconPalFile ?? ...
    //     });

    //     this.inputPath = params.actualPalFile;
    //     this.deconOutput = this.outputFile;
    // }
        
  
   constructor(context: vscode.ExtensionContext, params: ColorDeconParams) {
        const outputFile = `${params.theme}-Deconstruct.json` as DeconFile;

        // You must prepare this separately first:
        const colorParams: rW.PaletteParams = {
            jsonKind: "palettes",
            fileKind: params.theme, // treat theme as fileKind for patching logic
            descript: `Deconstructed version of ${params.theme}`,
            theme: params.theme,
            actualPalFile: params.actualPalFile,
            deconPalFile: outputFile
        };

        super(context, colorParams);
        
        this.inputPath = params.actualPalFile;
        this.deconOutput = outputFile;
    }

    override genOutputFileStr(): DeconFile{
        return `${this.theme}-Deconstruct.json` as  DeconFile;
    }
    
    // private pullRuleColor(tokenType : string, letter : string, fileScope : string, palettePath : def.PaletteFilePath): def.ColorHex{
    //     const rule = this.pullRule(letter, palettePath);
    //     if(!rule){
    //         return themeUtils.defaultTextColor();
    //     }
    //     const colorHex = this.getColorFromRule(rule);
    //     return colorHex as def.ColorHex;
    // }

    private pullRulePalette(palettePath : JsonFile):def.ColorRule[]{
        return this.patcher.loadColors(palettePath);
    }
    
    private decomposeScope(scopeName : string): string[]{
        let frags = scopeName.split('.');

        if (frags[0] === "source") {
            frags = frags.slice(1); // remove first element
        }
        if (frags.length < 2) {
            throw new Error(`Invalid scope: ${scopeName}`);
        }
        if (frags.length === 3) {
            return frags;   //examples like [fastq, quality, low/mid/high] are valid already  
        }

        const lang = frags[0];
        const tokenPart = frags[1];
        
        const camelMatch = this.regi.splitCamelCase(tokenPart);
        if(camelMatch){
            const [, prefix, suffix] = camelMatch;
            return [lang, prefix, suffix];
        }

        // Fallback: dot-separated tokenType.label
        const split = tokenPart.split(".");
        if (split.length === 2) {
            const [prefix, suffix] = split;
            return [lang, prefix, suffix];
        }

        throw new Error(`Unable to decompose token scope: ${scopeName}`);
        // return [lang, "unknown", tokenPart];
    }


    //    if(!langs.includes(tokens[0])){ //push fasta,fastq or other dual type syntaxes
    //                 langs.push(tokens[0]);
    //             }
    //             if(!alpha.includes(tokens[1])){
        //                 alpha.push(tokens[1]);
        //             }if(){
            
        //             }
        
        //     {lang: {alphabet : {letters,color}}}

        
    override writeFileTopper(){
        this.writeToFile(`"$schema": "./deconstruct.schema.json",`);
        this.writeToFile(`"description": ${this.theme} Decon Palette`);
    }

    private genDeconMap(){
        type DeconColorMap = Record<string, Record<string, Record<string, string>>>;
        let deconMap: DeconColorMap = {};
        
        const palette = this.pullRulePalette(this.inputPath);
        for(const rule of palette){
            const color = this.getColorFromRule(rule) as def.ColorHex;
            const [lang, alpha, letter] = this.decomposeScope(rule.scope);
            if(!deconMap[lang])
                deconMap[lang] = {};
            if(!deconMap[lang][alpha])
                deconMap[lang][alpha] = {};

            deconMap[lang][alpha][letter] = color;
        }
        return deconMap;
    }

    public writeDeconFile():void{
        const deconMap = this.genDeconMap();
        this.writeFileTopper();
        this.writeToFile(`  "theme": "${this.fileDescript ?? this.fileType}",`);
        this.writeJSON(deconMap);
        this.writeToFile("}");
    }

}


