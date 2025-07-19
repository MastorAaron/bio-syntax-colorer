export type ColorHex = `#${string}`;

export type TagCategory = "version" | "userRule" | "highLightRule" | undefined;

export type FastAScope = `source.fasta.${string}${'' | `.${TagCategory}`}`;
export type FastQScope = `source.fastq.${'' | `.${string}`}${'' | `.${string}`}`;
export type GenericScope =`source.${string}.${string}`

export type TokenScope = FastAScope | FastQScope;
export type HeaderScope = `fast${'a' | 'q'}.title`;
export type NameScope = TokenScope | HeaderScope| GenericScope; 

export interface ColorRule {
    name: string;      //optional Name
    scope: NameScope;     //optional Scope
    comment?: string;     //optional Comment
    settings: {
        foreground: ColorHex;
        background?: ColorHex; //optional Background color
        fontStyle?: string; //optional Font style
    };
}
export interface PatternRule {
    name: NameScope;      
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

export const nukeTrio    = ['A','C','G'] as const;
export const nukeDuo     = ['T','U'] as const;
export const nucleotides = [...nukeTrio, ...nukeDuo]
export const nukeSymbols = ['-'] as const;
export const symbols     = ['@','>','*','+','-'] as const;
export const symString   = ["Title","Stop","Gap"] as const;
export const aaSymbols   = ['*','-'] as const;
//TODO: Update for parts of FastQ files
//TODO: Quality Scores, ignore lines, etc 

export const nukeNots        = ['B', 'D', 'H', 'V'] as const;
export const pyrimidines     = ['Y', 'T', 'C','U']
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

export type typesAA    = (typeof aaProperty)[number];//'R' Ringed

export type nonPolarAA = (typeof aaAliphatic)[number];
export type polarAA    = (typeof aaPolar)[number];
export type aroAA      = (typeof aaAromatic)[number];
export type ringAA     = (typeof aaRinged)[number];
export type posAA      = (typeof aaPositive)[number]; 
export type negAA      = (typeof aaNegative)[number];

export type recodedAA = (typeof aaRecoded)[number];
export type driftsAA  = (typeof aaDrifts)[number];
export type wildAA    = (typeof aaWild)[number];


export type aa      = negAA | posAA | aroAA | ringAA | polarAA | nonPolarAA;
export type aaAmbig = driftsAA | wildAA;
export type aaExtd  = aaAmbig | recodedAA;

export type syms    = (typeof symbols)[number];
export type symStrs = (typeof symString)[number];
export type ntSyms = (typeof nukeSymbols)[number];
export type aaSyms = (typeof aaSymbols)[number];

export type aminos = aa | aaExtd | aaSyms;

export type ntTrio = (typeof nukeTrio )[number];
export type ntDuo  = (typeof nukeDuo)[number];
export type nt       = (typeof nucleotides)[number];

export type ntNots   = (typeof nukeNots)[number];
export type ntStrgth = (typeof nukeBondStrgth)[number];
export type ntFunct  = (typeof functGroupNukes)[number];
export type ntRingQt = (typeof ringStructNukes)[number];

export type ntWild = (typeof nukeWild)[number];

export type ntExtd = ntDuo | ntNots | ntStrgth | ntFunct | ntRingQt | ntWild; 

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

// export type Alphabet =  ;


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
    'X': "[XKRHOPWYFEDSTNCQUOLIMVAGBZJX\\-*]",
}

export const nukeRegExMap : Record<ntExtd,string>= {
    'N': "[NRYSWKMBDHVACGTU-]",

    'R': "[RAG]",
    'Y': "[YTCU]",
    'U': "[UT]",
    'T': "[TU]",

    'S': "[SGC]",
    'W': "[WTAU]",

    'K': "[KTUG]",
    'M': "[MAC]",

    'B': "[BCGTUY]",
    'D': "[DAGTURW]",
    'H': "[HACTUYWM]",
    'V': "[VACGRSM]",
}

export const fileTypes = ["aTitle","qTitle"] as const
export type fileTitles = (typeof fileTypes)[number];
export type tokenType = aminos | fileTitles; 

export const symbolLookUpMap : Record<syms,string>= {
    '*':"Stop",
    '-':"Gap",
    '@':"",
    '+':"",
    '>':""
}

export function isSymbol(value: unknown): value is nukes {
    return isMemberOf(value, symbols) || isMemberOf(value,symString);
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

export const tokenStripMap : Record<string,Record<string,string[]>>= {
    "fasta":{ 
        "title": ['>'] ,
        "nt"   : ['A','C','G','T','U','N','R','Y','B','D','H','V','K','M','S','W'],
        "sym"  : ['Gap','Stop'] , // '-': "symGap", // '*': "symStop",
        "aa"   : ['F','E','Z','J','I','L','P','Q','O','X'] ,
    },
    "fastq": {
        "title"  : ['@'] ,
        "plus"   : ["Line"] ,
        "quality": ["low","mid","high"]
    } 
}

// export const phredRangesMap : Record<string,Record<string,string[]>>= {
//     "Sanger":{
//         "Phred+33":["[!-I]"]//0-40
//     },
//     "Illumina": {    
//          "1.8": {"Phred+33":["[@-h]"]},//0-40
//      "1.3-1.5": {"Phred+64":["[!-J]"]}//0-41    //Same as 1.3 but with dummy quality scores for unaligned bases using B. This throws off basic regex rules because B has to be handled as “special.”
//     },
//     "Solexa":{},
// }
