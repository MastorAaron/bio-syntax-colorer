import * as def from "./definitions";
import * as fred from "./phredHandler";
import * as vscode from "vscode";
import hoverOver from "./hoverOver"; // or "../hoverOver" if path needs adjusting
import { vscUtils, themeUtils, Neons } from "./vscUtils";
import { promises } from "dns";

const kmerText  = "Find Entered Pattern: kmer, Codon, letter, etc" as const;
const swapText  = "Swap Text Colors and Highlight Colors" as const;
const clearText = "Clear Highlight Colors" as const;

const nukeText  = "Nucleotide Categories" as const;
const aminoText = "Amino Properties" as const;
const aaAlpha   = "Amino acids" as const;
const ntAlpha   = "Nucleic acids" as const;

const HLight = { //HighLightOptions
    topLevelOptions: [
        kmerText,
        // swapText,
        clearText,
        nukeText,
        aminoText
    ] as const,

    alphaSubOptions: [
        aaAlpha,
        ntAlpha
    ] as const,
    
    
    aminoSubOptions: [
        "N: Nonpolar/Alipathic: LIMVAPG",
        "P: Polar:              STNCQ and sometimes U",
        "A: Aromatic:           WYF",
        "R: Ringed:             WYFHP",
        "+: Positive\\Basic:    KRH and sometimes O",
        "-: Negative\\Acidic:   ED",
        
        "X: All Amino Acids:    X KRHO PWYFE DSTNCQ LIMVAG BZJ * UO",

        "B: B Drift:            Asx: Asn or Asp: N or D",
        "Z: Z Drift:            Glx: Gln or Glu: Q or E",
        "J: J Drift:            (Iso)leucine: Leu or Ile: L or I",
        
        "Ext: Extended Codes:   X, B, Z, J"
    ] as const,

    nucleotideSubOptions: [
        "R: Purines:          A or G",
        "Y: Pyrimidine:       C or T/U",
        "S: Strong Bonds:     C or G",
        "W: Weak Bonds:       A or T/U",
        "K: Ketone Group:     G or T/U",
        "M: Amino Group:      A or C",
        
        "N: All Nucleotides:  A, C, G, or T/U",

        "B: Not A:            C, G, or T/U",
        "D: Not C:            A, G, or T/U",
        "H: Not G:            A, C, or T/U",
        "V: Not T/U:          A, C, or G",

        "Ext: Extended Codes: N, R, Y, S, W, K, M, B, D, H, V"
    ] as const,
};

const hoverAlpha = ["Nucleotides", "Aminos", "Ambiguous"];
export type HoverAlphabet = (typeof hoverAlpha)[number];

export function printSelectionAlpha(selection : string){
        if(selection === "Ambiguous"){
            vscUtils.print("Ambiguous: BioNotation registered letters as either Nucleotides or Amino Acids by toggle.");
        }else if(selection === "Nucleotides"){
            vscUtils.print("DNA/RNA:   BioNotation registered letters as Nucleotides on toggle.");
        }else if(selection === "Aminos"){
            vscUtils.print("Protein:   BioNotation registered letters as Amino Acids on toggle.");
        }else{
            vscUtils.print("Ambiguous: BioNotation registered letters as either Nucleotides or Amino Acids by Default.");
        }
    }

export function convertBetweenAlphs(hlAlpha: string): HoverAlphabet{
    if (hlAlpha === aaAlpha){
        return "Aminos";
    }else if (hlAlpha === ntAlpha){
        return "Nucleotides";
    }else{
        return "Ambiguous"
    }
}

export async function getStoredAlpha(): Promise<HoverAlphabet> {
    // return vscode.workspace.getConfiguration().get<HoverAlphabet>("bioNotation.alphabet") as HoverAlphabet;
    return await vscUtils.getFlagVal<HoverAlphabet>("bioNotation.alphabet")!;
}



export type HLSelect =
    typeof HLight.topLevelOptions[number] |
    typeof HLight.alphaSubOptions[number] |
    typeof HLight.aminoSubOptions[number] |
    typeof HLight.nucleotideSubOptions[number];

    export class hlMenuObj{    
        // private hoverOver;
        constructor(
            private clearOverlayFn: () => void
        ){
            this.triggerClear();
         }

        public triggerClear() {
            this.clearOverlayFn(); // Now usable inside methods
        }

        private async secondChoice(options : string[], lang : string) : Promise<[HLSelect, string] | undefined>{
            const secondSelection = await vscUtils.showInterface(options, `Choose ${lang} Highlight`) as HLSelect;
                if (!secondSelection) return;
            this.printSelectionHighLight(secondSelection, lang);
            return [secondSelection, `${lang}`];
        }
    
        public async hlUserChoice(): Promise<[HLSelect, string] | undefined> {
            const firstSelection = await vscUtils.showInterface([...HLight.topLevelOptions], "Choose or Type Highlight Category") as HLSelect;
                if (!firstSelection) return;
    
            if (firstSelection === kmerText as HLSelect) {
                const currAlpha = await getStoredAlpha();
                if(currAlpha === "Ambiguous" as HoverAlphabet){
                    const result = await this.secondChoice([...HLight.alphaSubOptions], "Alphabet"); 
                    // const secondSelection = await vscUtils.showInterface([...HLight.alphaSubOptions], "Choose Alphabet") as HLSelect;
                    if (!result) return;//     if (!secondSelection) return;  // this.printSelectionHighLight(secondSelection);
                    const [secondSelection, junk] = result;
                    hoverOver.setAlphabet(convertBetweenAlphs(secondSelection));
                    return [firstSelection, secondSelection as HLSelect]; 
                }else{
                    return [firstSelection, currAlpha as HLSelect];
                }
            }
    
            if (firstSelection === aminoText  as HLSelect) {
                const result = await this.secondChoice([...HLight.aminoSubOptions], aminoText);
                if (!result) return;
                let [secondSelection, lang] = result;
                //Distinguish Amino Properties
                if(def.arrIsSubOfString(secondSelection[0], ['B','J','Z','X'])){
                    lang = "Aminos";
                }
                hoverOver.setAlphabet("Aminos");
                return [secondSelection, lang as HLSelect];
            }
            
            if (firstSelection === nukeText as HLSelect) {
                hoverOver.setAlphabet("Nucleotides");
                return await this.secondChoice([...HLight.nucleotideSubOptions], nukeText);
            }
            
            if (firstSelection === clearText as HLSelect) {
                await this.clearOverlayFn();
                return;
            }
            
            // TODO: Limit the language choices based on getCurrAlpha() from HoverOver?
            
            // this.printSelectionHighLight(firstSelection, lang);
            hoverOver.setAlphabet("Ambiguous");
            return [firstSelection, "Ambiguous"];
        }
    
        public async hLColorChoice(): Promise<Neons | string | undefined> {
            const colorChoice = await vscUtils.showInterface([       
                "Neon Yellow",
                "Neon Green",
                "Neon Blue",
                "Neon Magneta",
    
                "Complementary Colors of Text Colors",
                "Use Text Color as Highlight Color"
            ], 
            "Choose Highlight Category") as def.ColorHex;
            if(colorChoice.includes("Neon")){
                return themeUtils.highLightColors(colorChoice);
            }else if(colorChoice.includes("Comple")){
                return "Comple";
            }else if(colorChoice.includes("Highlight")){
                return "Text";
            }else{
                vscUtils.print("[hLColorChoice]: INVALID")
            }
        }
    
        public async hlPatternChoice(selection: HLSelect, alpha: string): Promise<string | undefined> {
            if(selection === kmerText as HLSelect)
                return await vscUtils.showInputBox("Enter a kmer/Codon/pattern","ATG, GCT, etc.");
            
            if(alpha === "Nucleotide Categories" || alpha === "Aminos" || alpha === "Amino Properties"){
                return selection[0]; //return first character of the menu's item
            }
            vscUtils.print(`[Pattern Choice] INVALID: ${selection}`);
            return undefined;
        }   
       
        private printSelectLine(selection : string, alpha : string): void{
            vscUtils.print(`${selection}:   BioNotation isolated all ${selection} ${alpha}.`);
        }
        
        private printSelectionHighLight(selection: string, alpha: string ) {
            const nukeStr = "Nucleotides";
            const aminoStr = "Aminos";
    
            if(alpha === "Aminos" || alpha === "Amino Properties"){
                this.printSelectLine(selection, aminoStr);
            } else if(alpha === "Nucleotides" || alpha === "Nucleotide Categories"){
                this.printSelectLine(selection, nukeStr);
            } else if(alpha === "Alphabet" ){
                this.printSelectLine(selection, nukeStr);
            } else if(def.arrIsSubOfString(selection,["Clear"])){
                vscUtils.print("Cleared: BioNotation's highlighted blocks.");
            } else if(def.arrIsSubOfString(selection,["Kmer"])){
                vscUtils.print("Kmer:   BioNotation registered user entry as pattern.");
            } else {
                vscUtils.print(`[printSelection]: Invalid input: ${selection}.`);
            }
        }
    
    public extractAlphabet(selection: string){
        return def.arrIsSubOfString(selection, hoverAlpha);
        // return hoverAlpha.find(eachAlpha => selection.includes(eachAlpha)); //Works for small len arrays not the best for larger data
    }
}