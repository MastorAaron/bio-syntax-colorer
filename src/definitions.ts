export type colorHex = `#${string}`;

export type fastAScope = `source.fasta.${string}${'' | `.${TagCategory}`}`;
export type fastQScope = `source.fastq.${'' | `.${string}`}${'' | `.${string}`}`;

export type tokenScope = fastAScope | fastQScope;
export type headerScope = `fast${'a' | 'q'}.title`;
export type nameScope = tokenScope | headerScope; 


export interface ColorRule {
    name: string;      //optional Name
    scope: nameScope;     //optional Scope
    comment?: string;     //optional Comment
    settings: {
        foreground: colorHex;
        background?: colorHex; //optional Background color
        fontStyle?: string; //optional Font style
    };
}
export interface PatternRule {
    name: nameScope;      
    match: string; 
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

export const nucleotides = ['A','C','G','T','U'] as const;
export const nukeSymbols = ['-'] as const;
export const aaSymbols = ['*','-'] as const;//TODO: Stop Codon is Amino not Nuke
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

export type recodedAA = (typeof aaRecoded)[number];
export type driftsAA = (typeof aaDrifts)[number];
export type wildAA = (typeof aaWild)[number];


export type aa = negAA | posAA | aroAA | ringAA | polarAA | nonPolarAA;
export type aaAmbig = driftsAA | wildAA;
export type aaExtd = aaAmbig | recodedAA;

export type ntSyms = (typeof nukeSymbols)[number];
export type aaSyms = (typeof aaSymbols)[number];

export type aminos = aa | aaExtd | aaSyms;


export type nt     = (typeof nucleotides)[number];

export type ntNots = (typeof nukeNots)[number];
export type ntStrgth = (typeof nukeBondStrgth)[number];
export type ntFunct = (typeof functGroupNukes)[number];
export type ntRingQt = (typeof ringStructNukes)[number];

export type ntWild = (typeof nukeWild)[number];

export type ntExtd = ntNots | ntStrgth | ntFunct | ntRingQt | ntWild ; 

export type nukes  = nt | ntExtd  | ntSyms;

// export type AminoDescript = [string]
export const nukeInfoMap : Record<nukes,Array<string>>= {
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

// + is Basic Amino Acids
// - is Acidic Amino Acids

export const aminoInfoMap : Record<aminos,Array<string>>= {
    'K':["Lys","Lysine","Positively Charged","pKa = 10.7"],
    'R':["Arg","Arginine","Positively Charged","pKa = 12.1"],
    
    'H':["His","Histidine","Positively Charged","pKa = 6.0"],
    
    'P':["Pro","Proline","Nonpolar","Aliphatic"],
    'W':[ "Trp", "Tryptophan", "Aromatic", "Hydrophobic" ],
    'Y':["Tyr","Tyrosine","Aromatic","Hydrophobic","pKa = 10.0"],
    'F':["Phe","Phenylalanine","Aromatic","Hydrophobic"],
    
    
    'E':["Glu","Glutamic Acid","Negatively Charged","pKa = 4.2"],
    'D':["Asp","Aspartic acid","Negatively Charged","pKa = 3.7"],
    
    'B':["Asx: Asn or Asp"],
    
    'S':["Ser","Serine","Polar Uncharged"],
    'T':["Thr","Threonine","Polar Uncharged"],
    'N':["Asn","Asparagine","Polar Uncharged"],
    'C':["Cys","Cysteine","Polar","pKa = 8.2"],

    'Q':["Gln","Glutamine","Polar Uncharged"],
    'U':["Sec","Selenocysteine","Special Case"],
    'O':["Pyr","Pyrrolysine","Special Case"],
    
    'J':["(Iso)leucine: L or I"],
    
    'L':["Leu","Leucine","Aliphatic","Nonpolar","Hydrophobic"],
    'I':["Ile","Isoleucine","Aliphatic","Nonpolar","Hydrophobic"],
    'M':["Met","Methionine","Aliphatic","Nonpolar","Hydrophobic"],
    
    'V':["Val","Valine","Aliphatic","Nonpolar","Hydrophobic"],
    'A':["Ala","Alanine","Aliphatic","Nonpolar","Hydrophobic"],
    'G':["Gly","Glycine","Aliphatic","Nonpolar"],
    
    'Z':["Glx: Gln or Glu"], 
    'X':["Any Amino Acid"],

    '*':["Stop Codon","*"],
    '-':["Gap","-"]
}

export const conflictInfoMap : Record<nukes,string>= {
    'A':"Adenine OR Alanine", 
    'C':"Cytosine OR Cysteine", 
    'G':"Guanine OR Glycine", 
    'T':"Thymine OR Threonine", 
    'U':"Uracil OR Selenocysteine\n(Rare Amino Acid)", 
    
    'N':"Any Nuke or Asparagine", 

    'R':"Arginine OR Purine", 
    'Y':"Tyrosine OR Pyrimidine", 

    'S':"Serine OR Strong",
    'W':"Tryptophan OR Weak",
    
    'K':"Lysine OR Ketone",
    'M':"Methionine OR Amino",
    
    'B':"Asx: Asn or Asp OR not A",
    'D':"Aspartate OR not C", 
    'H':"Histidine OR not G",
    'V':"Valine OR not T/U",
    
    '-': "Gap or Minus Sign"
}

export type alphabet = "Nucleotides" | "Aminos" | "Ambiguous" ;
export type TagCategory = "version" | "userRule" | "highLightRule" | undefined;

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
    'X': "[XKRHOPWYFEDSTNCQUOLIMVAGBZJX-*]",
}

export const nukeRegExMap : Record<ntExtd,string>= {
    'N': "[NRYSWKMBDHVACGTU-]",

    'R': "[RAG]",
    'Y': "[YTCU]",

    'S': "[SGC]",
    'W': "[WTAU]",

    'K': "[KTUG]",
    'M': "[NAC]",

    'B': "[BCGTU]",
    'D': "[DAGTU]",
    'H': "[HACTU]",
    'V': "[VACG]",
}

export const fileTypes = ["aTitle","qTitle"] as const
export type fileTitles = (typeof fileTypes)[number];
export type tokenType = aminos | fileTitles; 

export const tokenMap : Record<tokenType,nameScope>= {
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

export function isMemberOf<Template extends string | ColorRule | PatternRule>(value: unknown, group: readonly Template[]): value is Template {
    return typeof value === "string" && group.includes(value as Template);
}

export function arrayToStr(strArr : Array<string> | string): string{
    if(typeof strArr === "string") {
        return strArr;
    }

    let newStr="";
    for(const each of strArr){
        newStr+=each+'\n';
    }
    return newStr;
}

export type PaletteFilePath = string & { readonly __paletteFilePath: unique symbol };