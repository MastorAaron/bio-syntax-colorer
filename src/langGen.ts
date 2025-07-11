import * as vscode from "vscode";
import * as def from "./definitions";
import * as rW from "./ruleWriter";
import { RuleWriter, ColorDeconParams, JsonFile, DeconFile } from "./ruleWriter";
import { vscUtils, themeUtils } from "./vscUtils";

export class LangGenerator extends RuleWriter{
    private variants: string[];

    constructor(context: vscode.ExtensionContext, params : rW.LangParams){
        const theme = params.theme.toLowerCase();
        const outputFile = `${theme}-Strip.json` as  DeconFile;

        super(context, {...params, jsonKind: "syntaxes"});
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

    override writeFileTopper(): void{
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

// export class RuleStripper extends PatternRuleGenerator{
//     constructor(context: vscode.ExtensionContext, params : PatternStripParams){
//         private inputPath: JsonFile;
//         const outputFile = `${params.theme}-Strip.json` as  DeconFile;
//         super(context, {
//             jsonKind: "strip",
//             descript: `Stripped version of ${params.theme}`,
//             theme: "decon",
//             deconStripFile: outputFile 
//         });

//         this.inputPath= = params.actualRuleFile;
//         this.outputFile = outputFile;
//     }
// }


