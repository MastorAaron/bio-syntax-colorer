import * as def from "./definitions";
import * as menu from "./menus";
import { vscUtils } from "./vscUtils";
import * as vscode from "vscode";

export class RegExBuilder{
    constructor(private allowExtended=true){}

    public genLetterRegEx(char : string, map: Record<string,string>){
        const upper = char.toUpperCase();
        console.log(`Looking up: ${upper} in map:`, map);
        if(this.allowExtended && map[upper]){
            return map[upper];
        }
        return upper.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&");
    }

    public genHighLightRegEx(strand: string, map: Record<string,string>): string{
        let regExStr = "";
        for(const char of strand){
            const upper = char.toUpperCase(); // const lower = char.toLowerCase();
            regExStr +=this.genLetterRegEx(upper, map); // regExStr +=this.genLetterRegEx(lower, map);
        }
        return regExStr;
    }

    public genTypedRegEx(strand: string, map: Record<string, string>, allCase : boolean = false, block : boolean = false): string {
        const blocked = block ? "+" : ""; 
        const caseSuffix = allCase ? `/i` : "";

        return `${this.genHighLightRegEx(strand, map)}${caseSuffix}${blocked}`;
    }

    public genNukeRegEx(strand : string, allCase : boolean =false, block : boolean=false): string{
        return this.genTypedRegEx(strand, def.nukeRegExMap,allCase,block);
    }
    
    public genAminoRegEx(strand : string, allCase : boolean =false, block : boolean=false): string{
        return this.genTypedRegEx(strand, def.aminoRegExMap,allCase,block);
    } 
    
    public genAminoPropertyRegEx(strand : string, allCase : boolean =false, block : boolean=false): string{
        return this.genTypedRegEx(strand, def.aminoPropertyRegExMap,allCase,block);
    }

    public genRegEx(letter: string, alphabet: string): RegExp {
        if(letter == 'E'){
            if (alphabet === "Nucleotide Categories")       return new RegExp("[NRYSWKMBDHV]", "gi");
            if (alphabet === "Amino Properties")            return new RegExp("[XBZJ]", "gi");
        }

        const reg = this.regExSwitch(letter, alphabet);
            if (!reg) throw new Error(`Unknown alphabet: ${alphabet}`);

        return new RegExp(reg, "gi");
    }

        public genRegBlockEx(letter : string | menu.HoverAlphabet, tokenType=""): string {
            switch(tokenType){  
                case "nt":
                case "Nucleotides":
                case "Nucleotide Categories":
                    return `[${this.genNukeRegEx(letter)}]+`;
                case "aa":
                case "Aminos":
                    return `[${this.genAminoRegEx(letter)}]+`;
                case "sym":
                case "Title":
                    return `[${letter}.]+` 
                default:
                    throw new Error(`Unknown tokenType: ${tokenType}`);
                    return `[${this.genNukeRegEx(letter)}]+`;
                }
        }

    public regExSwitch(strand: string, alpha: string){
        vscUtils.print(`regExSwitch → strand: ${strand}, alpha: ${alpha}`);
        vscUtils.print(`alpha check =`, alpha === "Nucleotides", alpha === "Aminos", alpha === "Aminos Properties");

        vscode.window.showInformationMessage(`Map check: ${JSON.stringify(def.nukeRegExMap)}`);
        vscode.window.showInformationMessage(`genNukeRegEx map key check for S:`, def.nukeRegExMap["S"]);

        const allCase : boolean = false;
        const block : boolean = false;
        switch(alpha){
            case "Nucleotides":
            case "Nucleotide Categories":
            case "Nucleic acids":
                console.log(`Map check:`, def.nukeRegExMap);
                console.log(`genNukeRegEx map key check for S:`, def.nukeRegExMap["S"]);
                return this.genNukeRegEx(strand, allCase, block);
            case "Amino acids":
            case "Aminos":
                return this.genAminoRegEx(strand, allCase, block)
            case "Amino Properties":
                return this.genAminoPropertyRegEx(strand, allCase, block);
            default:
                vscUtils.print("regExSwitch used default");
                return strand; 
        }
    }

    public splitCamelCase(str:string){//Pass it a camelCase -> [camelCase, camel, Case] 
        return str.match(/^([a-z]+)([A-Z].*)$/);

    }
}