import * as vscode from "vscode";
import * as def from "./definitions";
import * as rW from "./ruleWriter";
import { RuleWriter, ColorDeconParams, JsonFile, DeconFile } from "./ruleWriter";
import { vscUtils, themeUtils } from "./vscUtils";

export class LangGenerator extends RuleWriter{
    private variants: string[];
    private tmLangFile: rW.LangFile;
    // private tmLangFile: rW.langFile;

    constructor(context: vscode.ExtensionContext, params : rW.LangParams){
        const meta = new rW.FileMeta(params.tmLangFile);

        if (meta.jsonKind !== "syntaxes") {
            throw new Error(`Invalid file passed to LangGenerator: ${params.tmLangFile}`);
        }

        super(context, meta.lang, "syntaxes");
        this.variants = params.variants;
        this.tmLangFile = params.tmLangFile as rW.LangFile;
    }

    // export type alphabet = "Nucleotides" | "Aminos" | "Ambiguous" | "Aminos Properties" | "Nucleotide Categories";
    private genRegEx(letter : string | def.alphabet, tokenType=""): def.RegEx{
        switch(tokenType){  
            case "nt":
            case "Nucleotides":
            case "Nucleotide Categories":
                return `[${this.regi.genNukeRegEx(letter)}]+`;
            case "aa":
            case "Aminos":
                return `[${this.regi.genAminoRegEx(letter)}]+`;
            case "sym":
            case "Title":
                return `[${letter}.]+` 
            default:
                throw new Error(`Unknown tokenType: ${tokenType}`);
                return `[${this.regi.genNukeRegEx(letter)}]+`;
            }
    }

    override genOutputFileStr(): JsonFile{
        return `${this.fileType}.tmLanguage.json` as JsonFile;
    }

    public genPatternRule(letter : string, tokenType : string=""): def.PatternRule {
        const name = this.genPatternNameScope(letter, tokenType);
        const match = `${this.genRegEx(letter,tokenType)}`;

        return {name,match}
    }

    private writePattern(letter : string, tokenType : string="", comma : string=""):void{
        const pattern = this.genPatternRule(letter,tokenType);
        this.writeJSON(pattern,comma);
        vscUtils.print(`Wrote pattern for ${letter} (${tokenType}) to (${this.tmLangFile})`);
    }  

    public writePatterns(lang : string){
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


interface FastaLang {
    repository?:{
        keywords?:{
            patterns?: Array<def.PatternRule>;
        };

    };
    [key: string]: unknown;
}


export type syntaxFilePath = string & { readonly __syntaxFilePath: unique symbol };

import * as fs from "fs";
import * as path from "path";

export class LangFileEditor{
    private langPath: syntaxFilePath;
    
    constructor(private context : vscode.ExtensionContext){
        this.langPath = path.join(this.context.extensionPath, "syntaxes", "fasta.tmLanguage.json") as syntaxFilePath;
    }

    public loadLangFile(): FastaLang {
        const raw = fs.readFileSync(this.langPath, "utf8");
        return JSON.parse(raw);
    }

    public savelang(lang : FastaLang): void {
        fs.writeFileSync(this.langPath, JSON.stringify(lang, null, 4));
    }

    private getPatternRepo(lang : FastaLang): def.PatternRule[]{
        // "repository": {
        //     "keywords": {
        //         "patterns": []
        //     }
        // }
        lang.repository = lang.repository || {};
        lang.repository.keywords = lang.repository.keywords || {};
        lang.repository.keywords.patterns = lang.repository.keywords.patterns || [];
        return lang.repository.keywords.patterns;
    }

    public appendPattern(pattern: def.PatternRule): void{
        const langJSON = this.loadLangFile();

        //Ensure Repos exist
        const patternArr = this.getPatternRepo(langJSON);
       
        patternArr.push(pattern);
        vscUtils.vscCOUT(`Appended lang pattern:`, pattern);

        this.savelang(langJSON);
    }

    public removePattern(pattern: def.TagCategory){
        const langJSON = this.loadLangFile();
        const patternArr = this.getPatternRepo(langJSON);

        const filtered = patternArr.filter(
          (rule: def.PatternRule ) =>
                typeof rule.name !== "string" || 
                (typeof pattern === "string" && !rule.name.includes(pattern))
        );
        langJSON.repository!.keywords!.patterns = filtered;

        this.savelang(langJSON);
    }

    public removeHighLightPatterns(){
        this.removePattern("highLightRule");
    }
}//TODO: Gracefully Admit you need sleep since you forgot this was made before writing a 3 generation class to do something similar
//TODO: Cry loudly
//TODO: absorb into LangGen perhaps use this name here or drop? idk
