import * as vscode from "vscode";
import * as def from "./definitions";
import * as fs from "fs";
import * as path from "path";
import { HoverObj } from "./hoverOver";
import { PatchColors } from "./patch";
import { vscUtils } from "./vscUtils";


interface FastaLang {
    repository?:{
        keywords?:{
            patterns?: Array<def.PatternRule>;
        };

    };
    [key: string]: unknown;
}


export type syntaxFilePath = string & { readonly __syntaxFilePath: unique symbol };

export class LangHandler{
    private langPath: syntaxFilePath;
    
    constructor(private context : vscode.ExtensionContext){
        this.langPath = path.join(this.context.extensionPath, "syntaxes", "fasta.tmLanguage.json") as syntaxFilePath;
    }

    public loadLangFile(): FastaLang {
        const raw = fs.readFileSync(this.langPath, "utf8");
        return JSON.parse(raw);
    }

    public savelang(lang : FastaLang): void {
        fs.writeFileSync(this.langPath, JSON.stringify(lang, null,2));
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
}


export class RegExBuilder{
    constructor(private allowExtended=true){}

    public genLetterRegEx(char : string, map: Record<string,string>){
        if(this.allowExtended && map[char]){
            return map[char];
        }
        return char.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&");
    }

    public genHighLightRegEx(strand: string, map: Record<string,string>): string{
        let regExStr = "";
        for(const char of strand){
            const upper = char.toUpperCase();
            const lower = char.toLowerCase();
            regExStr +=this.genLetterRegEx(upper, map);
            regExStr +=this.genLetterRegEx(lower, map);
        }
        return regExStr;
    }

    public genNukeRegEx(strand : string, remove :boolean=false): string{
        const casePrefix = remove?"":`(?i)`;
        return `${casePrefix}${this.genHighLightRegEx(strand,def.nukeRegExMap)}`;
    }

    public genAminoRegEx(strand : string, remove :boolean=false): string{
        const casePrefix = remove?"":`(?i)`;
        return `${casePrefix}${this.genHighLightRegEx(strand,def.aminoRegExMap)}`;
    } 
    
    // public genSymbolRegEx(strand : string, remove :boolean=false): string{
    //     const casePrefix = remove?"":`(?i)`;
    //     return `${casePrefix}${this.genHighLightRegEx(strand,def.symbolRegExMap)}`
    // }

    public genAminoPropertyRegEx(strand : string, remove :boolean=false): string{
        const casePrefix = remove?"":`(?i)`;
        return `${casePrefix}${this.genHighLightRegEx(strand,def.aminoPropertyRegExMap)}`;
    }

    public splitCamelCase(str:string){//Pass it a camelCase -> [camelCase, camel, Case] 
        return str.match(/^([a-z]+)([A-Z].*)$/);

    }
}