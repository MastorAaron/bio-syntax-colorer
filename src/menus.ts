export const kmerText  = "Find Entered Pattern: kmer, Codon, letter, etc" as const;
export const swapText  = "Swap Text Colors and Highlight Colors" as const;
export const clearText = "Clear Highlight Colors" as const;

export const nukeText  = "Nucleotide Categories" as const;
export const aminoText = "Amino Properties" as const;
export const aaAlpha   = "Amino acids" as const;
export const ntAlpha   = "Nucleic acids" as const;


export const HLight = { //HighLightOptions
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
        "J: J Drift:            (Iso)leucine: Leu or Ile: L or I"
    ] as const,

    nucleotideSubOptions: [
        "R: Purines:        A or G",
        "Y: Pyrimidine      C or T/U",
        "S: Strong Bonds    C or G",
        "W: Weak Bonds      A or T/U",
        "K: Ketone Group    G or T/U",
        "M: Amino Group     A or C",
        
        "N: All Nucleotides A, C, G, or T/U",

        "B: Not A           C, G, or T/U",
        "D: Not C           A, G, or T/U",
        "H: Not G           A, C, or T/U",
        "V: Not T/U         A, C, or G"
    ] as const,
    
};

export const hoverAlpha = ["Nucleotides", "Aminos", "Ambiguous"];
export type HoverAlphabet = (typeof hoverAlpha)[number];



export function convertBetweenAlphs(hlAlpha: string): HoverAlphabet{
    if (hlAlpha === aaAlpha){
        return "Aminos";
    }else if (hlAlpha === ntAlpha){
        return "Nucleotides";
    }else{
        return "Ambiguous"
    }
}

export type HLSelect =

    typeof HLight.topLevelOptions[number] |
    typeof HLight.alphaSubOptions[number] |
    typeof HLight.aminoSubOptions[number] |
    typeof HLight.nucleotideSubOptions[number];
