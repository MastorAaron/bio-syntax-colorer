import { boolUtils } from "./booleans";

export type ColorHex = `#${string}`;

export type FastAScope = `source.fasta.${string}${'' | `.${TagCategory}`}`;
export type FastQScope = `source.fastq.${'' | `.${string}`}${'' | `.${string}`}`;
export type GenericScope =`source.${string}.${string}`


export type TokenScope = FastAScope | FastQScope;
export type HeaderScope = `fast${'a' | 'q'}.title`;
export type NameScope = TokenScope | HeaderScope| GenericScope; 

export interface TokenColorSetting {
  foreground?: string;
  fontStyle?: string;
}

export interface TokenColorRule {
  name?: string;
  scope: string | string[];
  settings: TokenColorSetting;
}

export interface FlatTokenPalette {
  name?: string;
  description?: string;
  tokenColors: TokenColorRule[];
}

export interface DeconstructedPalette {
  [language: string]: {
    [tokenGroup: string]: {
      [token: string]: string;
    };
  };
}

export interface ColorRule {
    name: string;      
    scope: NameScope;     
    comment?: string;     //optional Comment
    settings: {
        foreground: ColorHex;
        background?: ColorHex; //optional Background color
        fontStyle?: string; //optional Font style
    };
    
}

export type RegEx = string;
export interface PatternRule {
    name: NameScope;      
    match: RegEx; 
}

export function isColorRule(obj: any): obj is ColorRule {
    return (
        obj &&
        typeof obj.name === 'string' &&
        typeof obj.scope === 'string' &&
        typeof obj.settings === 'object' &&
        typeof obj.settings.foreground === 'string'
    );
}


export const aaProperty  = ['N','P','A','R','+','-'] as const;//'R' Ringed

export const aaAliphatic = ['L','I','M','V','A','P','I','G'] as const;
export const aaPolar     = ['S','T','N','C','Q','U'] as const; //U?
export const aaAromatic  = ['W','Y','F'] as const;
export const aaRinged    = ['W','Y','F','H','P'] as const;
export const aaPositive  = ['K','R','H','O'] as const; //O is from Archae
export const aaNegative  = ['E', 'D'] as const; 


export const aaRecoded   = ['O','U'] as const; //UGA  for U
export const aaDrifts    = ['B', 'Z', 'J'] as const;
export const aaWild      = ['X'] as const;

export const extendedAminos = [
    ...aaRecoded,
    ...aaDrifts,
    ...aaRinged,
    ...aaWild
] as const;

export const regAminos = [
    ...aaAliphatic,
    ...aaPolar,
    ...aaAromatic,
    ...aaPositive,
    ...aaNegative
] as const;


export const nukeTrio    = ['A','C','G'] as const;
export const nukeDuo     = ['T','U'] as const;
export const nucleotides = [...nukeTrio, ...nukeDuo]
export const nukeSymbols = ['-'] as const;
export const symbols     = ['@','>','*','+','-'] as const;
export const symString   = ["Title","Stop","Gap"] as const;
export const aaSymbols   = ['*','-'] as const;//TODO: Stop Codon is Amino not Nuke
                                            //TODO: Update for parts of FastQ files
                                            //TODO: Quality Scores, ignore lines, etc 
export const nukeNots        = ['B', 'D', 'H', 'V'] as const;
export const nukeBondStrgth  = ['S', 'W'] as const;
export const functGroupNukes = ['K', 'M'] as const;
export const ringStructNukes = ['R', 'Y'] as const; 
export const nukeWild        = ['N'] as const;

export const extendedNukes = [
    ...nukeNots,
    ...nukeBondStrgth,
    ...functGroupNukes,
    ...ringStructNukes,
    ...nukeWild
] as const;

export type typesAA = (typeof aaProperty)[number];//'R' Ringed

export type nonPolarAA = (typeof aaAliphatic)[number];
export type polarAA    = (typeof aaPolar)[number];
export type aroAA      = (typeof aaAromatic)[number];
export type ringAA     = (typeof aaRinged)[number];
export type posAA      = (typeof aaPositive)[number]; 
export type negAA      = (typeof aaNegative)[number];

export type recodedAA  = (typeof aaRecoded)[number];
export type driftsAA   = (typeof aaDrifts)[number];
export type wildAA     = (typeof aaWild)[number];


export type aa      = negAA | posAA | aroAA | ringAA | polarAA | nonPolarAA;
export type aaAmbig = driftsAA | wildAA;
export type aaExtd  = aaAmbig | recodedAA;

export type syms    = (typeof symbols)[number];
export type symStrs = (typeof symString)[number];
export type ntSyms  = (typeof nukeSymbols)[number];
export type aaSyms  = (typeof aaSymbols)[number];

export type aminos  = aa | aaExtd | aaSyms;


export type ntTrio = (typeof nukeTrio )[number];
export type ntDuo  = (typeof nukeDuo)[number];
export type nt     = (typeof nukeTrio | typeof nukeDuo)[number];

export type ntNots   = (typeof nukeNots)[number];
export type ntStrgth = (typeof nukeBondStrgth)[number];
export type ntFunct  = (typeof functGroupNukes)[number];
export type ntRingQt = (typeof ringStructNukes)[number];

export type ntWild   = (typeof nukeWild)[number];

export type ntExtd = ntDuo | ntNots | ntStrgth | ntFunct | ntRingQt | ntWild ; 

export type nukes  = nt | ntExtd  | ntSyms;

// export type AminoDescript = [string]
export const nukeInfoMap : Record<nukes,string[]>= {
    'A':["Adenine","Purine","A"],
    'C':["Cytosine","Pyrimidine","C"],
    'G':["Guanine","Purine","G"],
    'T':["Thymine","Pyrimidine","T"],
    'U':["Uracil","Pyrimidine","U"],

    'N':["Any Nucleotide","N"],
    
    'R':["Purine","A or G","R"],
    'Y':["Pyrimidine","C or T/U","Y"],
    
    'S':["Strong","C or G","S"],
    'W':["Weak","A or T/U","W"],
    
    'K':["Ketone","G or T/U","K"],
    'M':["Amino","A or C","M"],
    
    'B':["C, G, or T/U (not A)","B"],
    'D':["A, G, or T/U (not C)","D"],
    'H':["A, C, or T/U (not G)","H"],
    'V':["A, C, or G (not T/U)","V"],
    
    '-':["Gap","-"],
}

export const symInfoMap : Record<string,string[]>= {
    '@'  : ["Header"],
    '>'  : ["Header"],
    '*'  : ["Stop Codon"],
    '-'  : ["Gap or Minus Sign"],
    '+'  : ["Sequence_ID line"],
    "low": ["Phred Score: Low Quality Read Score"],
    "mid": ["Phred Score: Medium Quality Read Score"],
   "high": ["Phred Score: High Quality Read Score"]
}

// + is Basic Amino Acids
// - is Acidic Amino Acids

export const aminoInfoMap : Record<aminos,string[]>= {
    'K':["Lys","Lysine","Positively Charged","pKa = 10.7"],
    'R':["Arg","Arginine","Positively Charged","pKa = 12.1"],
    
    'H':["His","Histidine","Positively Charged","pKa = 6.0"],
    
    'P':["Pro","Proline","Nonpolar","Aliphatic"],
    'W':["Trp","Tryptophan", "Aromatic", "Hydrophobic" ],
    'Y':["Tyr","Tyrosine","Aromatic","Hydrophobic","pKa = 10.0"],
    'F':["Phe","Phenylalanine","Aromatic","Hydrophobic"],
    
    
    'E':["Glu","Glutamic Acid","Negatively Charged","pKa = 4.2"],
    'D':["Asp","Aspartic Acid","Negatively Charged","pKa = 3.7"],
    
    
    'S':["Ser","Serine","Polar Uncharged"],
    'T':["Thr","Threonine","Polar Uncharged"],
    'N':["Asn","Asparagine","Polar Uncharged"],
    'C':["Cys","Cysteine","Polar","pKa = 8.2"],
    
    'Q':["Gln","Glutamine","Polar Uncharged"],
    'U':["Sec","Selenocysteine","Special Case"],
    'O':["Pyr","Pyrrolysine","Special Case"],
    
    'B':["Asx: Asn or Asp"],
    'J':["(Iso)leucine: L or I"],
    'Z':["Glx: Gln or Glu"], 
    
    'L':["Leu","Leucine","Aliphatic","Nonpolar","Hydrophobic"],
    'I':["Ile","Isoleucine","Aliphatic","Nonpolar","Hydrophobic"],
    'M':["Met","Methionine","Aliphatic","Nonpolar","Hydrophobic"],
    
    'V':["Val","Valine","Aliphatic","Nonpolar","Hydrophobic"],
    'A':["Ala","Alanine","Aliphatic","Nonpolar","Hydrophobic"],
    'G':["Gly","Glycine","Aliphatic","Nonpolar"],
    
    'X':["Any Amino Acid"],

    '*':["Stop Codon","*"],
    '-':["Gap","-"]
}

export const conflictInfoMap : Record<nukes,string[]>= {
    'A':["Adenine OR Alanine"], 
    'C':["Cytosine OR Cysteine"], 
    'G':["Guanine OR Glycine"], 
    'T':["Thymine OR Threonine"], 
    'U':["Uracil OR Selenocysteine","(Rare Amino Acid)"], 
    
    'N':["Any Nuke or Asparagine"], 

    'R':["Arginine OR Purine"], 
    'Y':["Tyrosine OR Pyrimidine"], 

    'S':["Serine OR Strong"],
    'W':["Tryptophan OR Weak"],
    
    'K':["Lysine OR Ketone"],
    'M':["Methionine OR Amino"],
    
    'B':["Asx: Asn or Asp OR not A"],
    'D':["Aspartate OR not C"], 
    'H':["Histidine OR not G"],
    'V':["Valine OR not T/U"],
    
    '-':["Gap or Minus Sign"]
}

export type alphabet = "Nucleotides" | "Aminos" | "Ambiguous" | "Aminos Properties" | "Nucleotide Categories";
export type TagCategory = "version" | "userRule" | "highLightRule";

// export const symbolRegExMap : Record<syms,string>= {
//     '-': "[\-.]",
//     '*': "[\*.]",
//     '@': "[\@.]",
//     '>': "[\>.]",
// }

export const symbolLookUpMap : Record<syms,string>= {
    '*':"Stop",
    '-':"Gap",
    '@':"",
    '+':"",
    '>':""
}

export function getDescription(letter: string, currAlpha: alphabet, file : FilePath, directName :boolean=false): string{
    return arrayToStr(getInfoMap(letter, currAlpha, file, directName));
}

export function getInfoMap(letter: string, currAlpha: alphabet, fileName: FilePath, directName: boolean=false): Array<string | nukes | aminos>{
    if (currAlpha === "Nucleotides" || boolUtils.isFna(fileName)) {
        return nukeInfoMap[letter as nukes] || letter;
    } 
    if (currAlpha === "Aminos" ||  boolUtils.isFaa(fileName)) {
        return aminoInfoMap[letter as aa] || letter;
    } // Mixed mode, show raw or dual-name

    const conflicting = conflictInfoMap[letter as nukes];
        if (conflicting) return (directName && conflicting.length > 1)? [conflicting[0]]: conflicting;

    const nuke = nukeInfoMap[letter as nukes];
        if (nuke) return nuke;

    const amino = aminoInfoMap[letter as aminos];
        if (amino) return (directName && amino.length > 1)? [amino[1]]: amino;

    const sym = symInfoMap[letter as symStrs];
        if (sym) return sym;
    return [letter];
}

export function getRegEx(letter: string, currAlpha: alphabet, directName: boolean=false): string | nukes | aminos{
    if (currAlpha === "Nucleotides" ) {
        return nukeRegExMap[letter as ntExtd] || letter;
    } 
    if (currAlpha === "Aminos") {
        return aminoRegExMap[letter as aaAmbig] || letter;
    } 
    if (currAlpha === "Aminos Properties") {
        return aminoPropertyRegExMap[letter as typesAA] || letter;
    } 
    if (currAlpha === "Nucleotide Categories" ) {
        return aminoRegExMap[letter as aaAmbig] || letter;
    }
    return letter;
}

export const nukeRegExMap : Record<ntExtd,string>= {
    'N': "[NRYSWKMBDHVACGTU-*]",

    'R': "[RAG]",
    'Y': "[YTCU]",
    'U': "[UT]",
    'T': "[TU]",

    'S': "[SGC]",
    'W': "[WTAU]",

    'K': "[KTUG]",
    'M': "[NAC]",

    'B': "[BCGTUY]",
    'D': "[DAGTURW]",
    'H': "[HACTUYW]",
    'V': "[VACGRS]",
}

export const aminoPropertyRegExMap : Record<typesAA,string>= {
    'N': "[LIMVAPIG]",
    'P': "[STNCQU]",
    'A': "[WYF]",
    'R': "[HPWYF]",
    '+': "[KRHO]",
    '-': "[ED]",
}

export const aminoRegExMap : Record<aaAmbig,string>= {
    'B': "[BND]",
    'Z': "[ZQE]",
    'J': "[JLI]",
    'X': "[XKRHOPWYFEDSTNCQUOLIMVAGBZJ-*]",
}

export const fileTypes = ["aTitle","qTitle"] as const
export type fileTitles = (typeof fileTypes)[number];
export type tokenType = aminos | fileTitles; 

export const tokenMap : Record<tokenType,NameScope>= {
    "aTitle":"fasta.title",
    "qTitle":"fastq.title",
    'A': "source.fasta.ntA",
    'C': "source.fasta.ntC",
    'G': "source.fasta.ntG",
    'T': "source.fasta.ntT",
    'U': "source.fasta.ntU",

    'X': "source.fasta.aaX",
    'N': "source.fasta.ntN",
    
    'R': "source.fasta.ntR",
    'Y': "source.fasta.ntY",
    
    'B': "source.fasta.ntB",
    'D': "source.fasta.ntD",
    'H': "source.fasta.ntH",
    'V': "source.fasta.ntV",
    
    'K': "source.fasta.ntK",
    'M': "source.fasta.ntM",
    
    'S': "source.fasta.ntS",
    'W': "source.fasta.ntW",
    
    '-': "source.fasta.symGap",
    '*': "source.fasta.symStop",

    'F': "source.fasta.aaF",
    'E': "source.fasta.aaE",
    'Z': "source.fasta.aaZ",
    
    'J': "source.fasta.aaJ",
    'I': "source.fasta.aaI",
    'L': "source.fasta.aaL",
    'P': "source.fasta.aaP",
    
    'Q': "source.fasta.aaQ",
    'O': "source.fasta.aaO",
}

export const tokenStripMap : Record<string,Record<string,string[]>>= {
    "fasta":{ 
        "Title": ['>'] ,
        "nt":    ['A','C','G','T','U','N','R','Y','B','D','H','V','K','M','S','W'],
        "sym":   ['-','*'] , // '-': "symGap", // '*': "symStop",
        "aa" :   ['F','E','Z','J','I','L','P','Q','O','X'] ,
    },
    "fastq": {
        "title": ['@'] ,
        "plus": ["Line"] ,
        "quality": ["low","mid","high"]
    } 
}

export function deterAlpha(token: string): alphabet{
    switch(token){  
        case "nt":
            return "Nucleotides" ;
        case "aa":
            return "Aminos";
        case "sym":
        case "Title":
            return "Ambiguous";
        default:
            console.log(`${token} not in any known Def.Alphabet currently`);
            return "Ambiguous";
    }
}

export function lookUpTitle(lang: string,alpha: string){
        if(lang === "fasta"){
            return '>'
        }
        if(lang === "fastq"){
            return '@'
        }
        return ""
    }


export function isNeg(value: unknown): value is negAA {
    return isMemberOf(value, aaNegative);
}

export function isPos(value: unknown): value is posAA {
    return isMemberOf(value, aaPositive);
}

export function isAro(value: unknown): value is aroAA {
    return isMemberOf(value, aaAromatic);
}

export function isRinged(value: unknown): value is ringAA {
    return isMemberOf(value, aaRinged);
}

export function isPolar(value: unknown): value is polarAA {
    return isMemberOf(value, aaPolar);
}

export function isNonPolar(value: unknown): value is nonPolarAA {
    return isMemberOf(value, aaAliphatic);
}

export function isPurine(value: unknown): boolean { //TODO: Make Purine Type?
    return isMemberOf(value, ['R','A','G']);
}

export function isPyrim(value: unknown): boolean {
    return isMemberOf(value, ['Y','T','C','U']);
}

export function isNuke(value: unknown): value is nukes {
    return isMemberOf(value, nucleotides) || isMemberOf(value, extendedNukes) || isMemberOf(value, aaSymbols);
}

export function isAmino(value: unknown): value is nukes {
    return isMemberOf(value, extendedAminos) || isMemberOf(value, regAminos);
}

export function isSymbol(value: unknown): value is nukes {
    return isMemberOf(value, symbols);
}

export function isMemberOf<Template extends string | ColorRule | PatternRule>(value: unknown, group: readonly Template[]): value is Template {
    return typeof value === "string" && group.includes(value as Template);
}

export function arrayToStr(strArr : string[] | string): string{
    if(typeof strArr === "string") {
        return strArr;
    }

    let newStr="";
    for(const each of strArr){
        newStr+=each+'\n';
    }
    return newStr;
}

export function arrayToArrStr(strArr : string[]): string{
    let newStr="";
    for(let i=0; i<strArr.length; i++){
        const each = strArr[i];
        newStr+=`"${each}"`;
        if(i < strArr.length-1){
            newStr+=','
        }
    }
    return newStr;
}

export type PaletteFilePath = string & { readonly __paletteFilePath: unique symbol };
export type FilePath = string & { readonly __paletteFilePath: unique symbol };

export const kmerText = "Find Entered Pattern: kmer, Codon, letter, etc" as const;
export const nukeText = "Nucleotide Categories" as const;
export const aminoText = "Amino Properties" as const;
export const swapText = "Swap Text Colors and Highlight Colors" as const;
export const aaAlpha = "Amino acids" as const;
export const ntAlpha = "Nucleic acids" as const;

export const HLight = { //HighLightOptions
    topLevelOptions: [
        kmerText,
        swapText,
        nukeText,
        aminoText
    ] as const,

    alphaSubOptions: [
        aaAlpha,
        ntAlpha
    ] as const,

    aminoSubOptions: [
        "N: Nonpolar/Alipathic",
        "P: Polar",
        "A: Aromatic",
        "R: Ringed",
        "+: Positive\\Basic:",
        "-: Negative\\Acidic:",
        "B: B Drift:      Asx: Asn or Asp",
        "Z: Z Drift:      Glx: Gln or Glu",
        "J: J Drift:      (Iso)leucine: L or I"
    ] as const,

    nucleotideSubOptions: [
        "R: Purine",
        "Y: Pyrimidine",
        "S: Strong Bonds",
        "W: Weak Bonds",
        "K: Ketone",
        "M: Amino",
        "B: Not A",
        "D: Not C",
        "H: Not G",
        "V: Not T/U"
    ] as const,

    userTopTextArr: [
        "Determine What to Highlight:",
        "Swap: Swap color text for highlighted blocks",
        "Kmer: Highlight specific pattern in file",
        "Amino Properities:",
        "Nucleotide Categories:"
    ] as const
};

export type HLSelect =
    typeof HLight.topLevelOptions[number] |
    typeof HLight.alphaSubOptions[number] |
    typeof HLight.aminoSubOptions[number] |
    typeof HLight.nucleotideSubOptions[number];


// export const userTextArr : [
        
//             // export const aminoTextArr = [ 
//                 //     "N: Nonpolar/Alipathic:",
//                 //     "P: Polar:",
                
//                 //     "A: Aromatic:",
//                 //     "R: Ringed:",
                
//                 //     "+: Positive\\Basic:",
//                 //     `-: Negative\\Acidic:`,
//                 //     "B: B Drift: Asx: Asn or Asp",
//                 //     "J: J Drift: (Iso)leucine: L or I",
//                 //     "Z: Z Drift: Glx: Gln or Glu"
                
//                 // ]
                
//                 // export const nukeTextArr = [
//                     //     "R: Purine: A or G",
//     //     "Y: Pyrimidine: C or T/U",

//     //     "S: Strong Bonds: C or G",
//     //     "W: Weak Bonds: A or T/U",

//     //     "K: Ketone: G or T/U",
//     //     "M: Amino: A or C",

//     //     "B: Not A:   C, G, or T/U",
//     //     "D: Not C:   A, G, or T/U",
//     //     "H: Not G:   A, C, or T/U",
//     //     "V: Not T/U: A, C, or G"
//     // ]
//     ];

