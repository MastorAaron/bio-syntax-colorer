import * as vscode from "vscode";
import * as vscUtils from "./vscUtils";
import { Theme } from "./extension";
import * as def from "./definitions";
import * as fs from "fs";
import * as rW from "./ruleWriter";

import { ColorDeconParams, JsonFile, DeconFile, PaletteParams, FileMeta} from "./ruleWriter";
import { PaletteGenerator } from "./paletteGen";

export class PaletteDeconstructor extends PaletteGenerator{
    private inputPath: rW.ColorFile;
    private theme: Theme;
    

   constructor(context: vscode.ExtensionContext, params: ColorDeconParams) {
        const meta = new FileMeta(params.paletteFile);
        const colorParams: PaletteParams = {
           jsonKind: "palettes",
            descript: `Deconstructed version of ${meta.theme}`,
            paletteFile: params.paletteFile,
            deconPalFile: meta.genDeconFile()
        };

        super(context, colorParams);
        this.theme = meta.theme as Theme;
        this.inputPath = params.paletteFile;
        this.finalizePathSetup();
        this.deconOutput = meta.genDeconFile();
    }

    override genOutputFileStr(): DeconFile{
        return `${this.theme.toLowerCase()}-deconstruct.json` as  DeconFile;
    }
    
    // private pullRuleColor(tokenType : string, letter : string, fileScope : string, palettePath : def.PaletteFilePath): def.ColorHex{
    //     const rule = this.pullRule(letter, palettePath);
    //     if(!rule){
    //         return themeUtils.defaultTextColor();
    //     }
    //     const colorHex = this.getColorFromRule(rule);
    //     return colorHex as def.ColorHex;
    // }

    private pullRulePalette(palettePath : rW.ColorFile):def.ColorRule[]{
        return this.patcher.loadColors(palettePath);
    }
    
    public decomposeScope(scopeName : string): string[]{
        let frags = scopeName.split('.');

        if (frags[0] === "source") {
            frags = frags.slice(1); // remove first element
        }
        if (frags.length < 2) {
            throw new Error(`Invalid scope: ${scopeName}`);
        } 
        if (frags.length === 2 && frags.includes("title")) {
            const [lang, alpha] = frags;
            const letter = def.lookUpTitle(lang,alpha);
            return [lang, alpha, letter]; // Enforce third level as alpha again
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
        
    override writeFileTopper(){
        this.writeToFile(`{`);
        this.writeToFile(`"$schema": "./schemas/deconstruct.schema.json",`);
        this.writeToFile(`"description": "${this.capFront(this.theme)} Decon Palette",`);
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

    public removeLineAfter(catergory : string) {
        const contents = fs.readFileSync(this.actualPalFile, "utf8").split("\n");
        const themeIndex = contents.findIndex(line => line.includes(catergory));

        if (themeIndex >= 0) {
            const strayIndex = themeIndex + 1;
            if (contents[strayIndex]?.trim() === "{") {
                contents.splice(strayIndex, 1);
            }
        }

        fs.writeFileSync(this.actualPalFile, contents.join("\n"), "utf8");
}

    public writeDeconFile():void{
        const deconMap = this.genDeconMap();
        this.writeFileTopper();
        // this.writeToFile(`  "theme": "${this.fileDescript ?? this.fileType}",`); //overkill
        this.writeJSON(deconMap);
        this.removeLineAfter("description"); //TODO: add function to consume stray `{` from stringify that is breaking the formatting 
        // this.writeToFile("}");
    }


}
    
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
        
  