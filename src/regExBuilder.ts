import * as def from "./definitions";

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
            const upper = char.toUpperCase(); // const lower = char.toLowerCase();
            regExStr +=this.genLetterRegEx(upper, map); // regExStr +=this.genLetterRegEx(lower, map);
        }
        return regExStr;
    }

   

    public genTypedRegEx(strand: string, map: Record<string, string>, allCase : boolean = true, block : boolean = true): string {
        const blocked = block ? "+" : ""; 
        const caseSuffix = allCase ? `/i` : "";

        return `${this.genHighLightRegEx(strand, map)}${caseSuffix}${blocked}`;
    }

    public genNukeRegEx(strand : string, allCase : boolean =true, block : boolean=true): string{
        return this.genTypedRegEx(strand, def.nukeRegExMap,allCase,block);
    }
    
    public genAminoRegEx(strand : string, allCase : boolean =true, block : boolean=true): string{
        return this.genTypedRegEx(strand, def.aminoRegExMap,allCase,block);
    } 
    
    public genAminoPropertyRegEx(strand : string, allCase : boolean =true, block : boolean=true): string{
        return this.genTypedRegEx(strand, def.aminoPropertyRegExMap,allCase,block);
    }


    public regExSwitch(strand: string, alpha: def.alphabet){
        const allCase : boolean = true;
        const block : boolean = false;
        switch(alpha){
            case "Nucleotides":
            case "Nucleotide Categories":
                return this.genNukeRegEx(strand, allCase, block);
            case "Aminos":
                return this.genAminoRegEx(strand, allCase, block)
            case "Aminos Properties":
                return this.genAminoPropertyRegEx(strand, allCase, block);
        }
    }

    public splitCamelCase(str:string){//Pass it a camelCase -> [camelCase, camel, Case] 
        return str.match(/^([a-z]+)([A-Z].*)$/);

    }
}