export interface ColorRule {
    name: string;      //optional Name
    scope: string;     //optional Scope
    comment?: string;     //optional Comment
    settings?: {
        foreground: string;
        background?: string; //optional Background color
        fontStyle?: string; //optional Font style
    };
}

export const aaAliphatic = ['L','I','M','V','A','P','I','G'];
export const aaPolar     = ['S','T','N','C','Q','U']; //U?
export const aaAromatic  = ['W','Y','F'];
export const aaRinged    = ['W','Y','F','H','P'];
export const aaPositive  = ['K','R','H','O']; //O is from Archae
export const aaNegative  = ['E', 'D']; 

export const aaProperty  = ['N','P','A','R','+','-'];//'R' Ringed

export const aaCatches   = ['O','U']; //UGA  for U
export const aaExtended  = ['B', 'Z', 'X', 'J'];

export const nucleotides    = ['A','C','G','T','U'];
export const symNukes       = ['-', '*'];//TODO: Stop Codon is Amino not Nuke
export const extendedNukes  = ['N',
                        'R', 'Y', 
                        'S', 'W', 
                        'K', 'M',
                        'B', 'D', 'H', 'V'
                    ];

export type negAA      = (typeof aaNegative)[number];
export type posAA      = (typeof aaPositive)[number];
export type aroAA      = (typeof aaAromatic)[number];
export type ringAA     = (typeof aaRinged)[number];
export type polarAA    = (typeof aaPolar)[number];
export type nonPolarAA = (typeof aaAliphatic)[number];

export type typesAA = (typeof aaProperty)[number];//'R' Ringed


export type aa = negAA | posAA | aroAA | ringAA | polarAA | nonPolarAA;
export type aaExtd = (typeof aaExtended)[number];
export type aminos = aa | aaExtd;

// export type AminoDescript = [string]


export type nt     = (typeof nucleotides)[number];
export type ntExtd = (typeof extendedNukes)[number];
export type ntSyms = (typeof symNukes)[number];
export type nukes = nt | ntExtd | ntSyms;

export const nukeInfoMap : Record<nukes,Array<string>>= {
    'A':["Adenine","Purine","A"],
    'C':["Cytosine","Pyrimidine","C"],
    'G':["Guanine","Purine","G"],
    'T':["Thymine","Pyrimidine","T"],
    'U':["Uracil","Pyrimidine","U"],

    'N':["Any Nucleotide","N"],
    
    'R':["Purine"," A or G","R"],
    'Y':["Pyrimidine","C or T/U","Y"],
    
    'S':["Strong"," C or G","S"],
    'W':["Weak"," A or T/U","W"],
    
    'K':["Ketone","G or T/U","K"],
    'M':["Amino","A or C","M"],
    
    'B':["C, G, or T/U (not A)","B"],
    'D':["A, G, or T/U (not C)","D"],
    'H':["A, C, or T/U (not G)","H"],
    'V':["A, C, or G (not T/U)","V"],
    
    '-':["Gap","-"],
    '*':["Stop Codon","*"]
}

// + is Basic Amino Acids
// - is Acidic Amino Acids


export const aminoInfoMap : Record<aminos,Array<string>>= {
    'H':["His","Histidine","Positively Charged","pKa = 6.0"],
    'P':["Pro","Proline","Nonpolar","Aliphatic"],
    'W':[ "Trp", "Tryptophan", "Aromatic", "Hydrophobic" ],
    'Y':["Tyr","Tyrosine","Aromatic","Hydrophobic","pKa = 10.0"],
    'F':["Phe","Phenylalanine","Aromatic","Hydrophobic"],
    
    'K':["Lys","Lysine","Positively Charged","pKa = 10.7"],
    'R':["Arg","Arginine","Positively Charged","pKa = 12.1"],
    
    
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
}



export type conflicts = nukes;

export const conflictInfoMap : Partial<Record<conflicts,string>>= {
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

export type alphabet = "Nucleotides" | "Aminos" | "Mixed" ;

export const tokenMap : Record<aminos,string>= {
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

export function isPurine(value: unknown): boolean {
    return isMemberOf(value, ['R','A','G']);
}

export function isPyrim(value: unknown): boolean {
    return isMemberOf(value, ['Y','T','C','U']);
}

export function isNuke(value: unknown): value is nukes {
    return isMemberOf(value, nucleotides) || isMemberOf(value, extendedNukes) || isMemberOf(value, symNukes);
}

export function isMemberOf<Template extends string>(value: unknown, group: readonly Template[]): value is Template {
    return typeof value === "string" && group.includes(value as Template);
}

export type PaletteFilePath = string & { readonly __paletteFilePath: unique symbol };