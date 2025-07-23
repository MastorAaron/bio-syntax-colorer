export const stdCodonMap : Record<string,string[]> = {
    'A': ["GCN"],
    'C': ["TGY"],
    'D': ["GAY"],
    'E': ["GAR"],
    'F': ["TTY"],
    'G': ["GGN"],
    'H': ["CAY"],
    'I': ["ATH"],
    'K': ["AAR"],
    'L': ["CTN","TTR"],
    'N': ["AAY"],
    'P': ["CCN"],
    'Q': ["CAR"],
    'R': ["CGN","AGR"],
    'S': ["TCN","AGY"],
    'T': ["ACN"],
    'V': ["GTN"],
    'W': ["TGG"],
    'Y': ["TAY"],

    'M': ["ATG"],
    '*': ["TYA","TAG"],
};

export const universalCodonMap : Record<string,string[]> = {
    'A': ["GCN"],
    'C': ["TGY"],
    'D': ["GAY"],
    'E': ["GAR"],
    'F': ["TTY"],
    'G': ["GGN"],
    'H': ["CAY"],
    'I': ["ATY"],
    'K': ["AAG"],
    'L': ["TTG"],
    'N': ["AAY"],
    'P': ["CCN"],
    'Q': ["CAR"],
    'R': ["CGN"], 
    'S': ["TCB","AGY"],
    'T': ["ACN"],
    'V': ["GTN"],
    'W': ["TGG"],
    'Y': ["TAY"],

    'M': ["ATG"],
};

export const condensedAmbig = [
    "AAA", "AGR", "ATA",
    "CTN",
    "TAR", "TBA"
]

const ambigCodons = [
    "AAA",
    "AGA","AGG",
    "ATA",
    "CTA","CTC","CTG","CTT",
    "TAA","TAG",
    "TCA","TGA","TTA"
]

export type AmbigCodon = (typeof ambigCodons )[number];

export const extCodonMap : Record<string,string[]> = {
    'B': ["YAY"], //"AAY","GAY", 
    'J': ["MTH", "CTG"],
    'Z': ["SAR"], //"CAR","GAR", 
}
export const rareCodonMap : Record<string,string[]> = {
    'O': ["TAG"],
    'U': ["TGA"],
    'W': ["TGG"],
    'M': ["ATA" ], /*RARE*/
};

export const ambigMap : Record<AmbigCodon, Record<string,number[]>> = {
    "AAA": {'K': [1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 15, 16, 22, 
                    23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            'N': [9, 14, 21]}, 
        //freqs
        // 24 and 3
    
    "AGA": {'R': [1, 3, 4, 6, 10, 11, 12, 15, 16, 22, 
                    23, 25, 26, 27, 28, 29, 30, 31, 32], 
            '*': [2], // "Vertebrate Mitochondria"
            'S': [5, 9, 14, 21, 24, 33], 
            'G': [13]}, 
        //freqs
        // 19 1 6 1
    
    "AGG": {'R': [1, 3, 4, 6, 10, 11, 12, 15, 16, 22,
                    23, 25, 26, 27, 28, 29, 30, 31, 32], 
            '*': [2],   // "Vertebrate Mitochondria"
            'S': [5, 9, 14, 21], 
            'G': [13],  //"Ascidian Mitochondria"
            'K': [24, 33]}, 
        //freqs
        // 19 1 4 1 2
    
    "ATA": {'I': [1, 4, 6, 9, 10, 11, 12, 14, 15, 16, 22, 23,
                    24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            'M': [2, 3, 5, 13, 21],
            
        }, 
        //freqs
        // 22 and 5
    
    "CTA": {'L': [1, 2, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 21,
                    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            'T': [3]}, //"Yeast Mitochondrial"
        //freqs
        // 26 and 1
    "CTC": {'L': [1, 2, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 21,
                    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            'T': [3]}, //"Yeast Mitochondrial"
        //freqs
        // 26 and 1
    
    "CTG": {'L': [1, 2, 4, 5, 6, 9, 10, 11, 13, 14, 15, 16, 21,
                    22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33], 
            'T': [3], //"Yeast Mitochondrial"
            'S': [12], 
            'A': [26]}, 
        //freqs
        // 23 1 1 1
    // "CTH": {'L': [1, 2, 4, 5, 6, 9, 10, 11, 13, 14, 15, 16, 21,
    //                 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33], 
    //         'T': [3], //"Yeast Mitochondrial"
    //         'S': [12], 
    //         'A': [26]}, 
    //     //freqs
    //     // 23 1 1 1
    
    "CTT": {'L': [1, 2, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 21,
                    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            'T': [3]}, //"Yeast Mitochondrial"
        //freqs
        // 26 and 1

    "TAA": {'*': [1, 2, 3, 4, 5, 9, 10, 11, 12, 13,
                    15, 16, 21, 22, 23, 24, 25, 26, 32], 
            'Q': [6, 27, 28], 
            'Y': [14, 29, 33], 
            'E': [30, 31]}, 
        //freqs
        // 19 3 3 2
    
    "TAG": {'*': [1, 2, 3, 4, 5, 9, 10, 11, 12,
                    13, 14, 21, 23, 24, 25, 26, 33], 
            'Q': [6, 15, 27, 28], 
            'L': [16, 22], 
            'Y': [29], 
            'E': [30, 31], 
            'W': [32]}, 
        //freqs
        // 17 4 2 1 2 1
    
    "TCA": {'S': [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15,
                    16, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            '*': [22]}, //"Algae (Scenedesmus) Mitochondrial"
        //freqs
        // 26 and 1
    
    "TGA": {'*': [1, 6, 11, 12, 15, 16, 22, 23, 26, 29, 30, 32], 
            'W': [2, 3,  4,  5,  9, 13, 14, 21, 24, 27, 28, 31, 33], 
            'C': [10],
            'G': [25]
        },   
        //freqs
        // 12 13 1 1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
    "TTA": {'L': [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16,
                    21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], 
            '*': [23]}
        //freqs
        // 26 and 1
    }

export const tableIndex = [1,2,3,4,5,6,9,10,11,12,13,14,15,16,
        21,22,23,24,25,26,27,28,29,30,31,32,33] as const ;


// "table#","name","domain" 
export const domainMap : Record<number,[string,string]>  = { 
    1:  ["Standard",                                      "Universal (Bacteria, Archaea, Eukaryotic nuclear)"],
    2:  ["Vertebrate Mitochondrial",                      "Vertebrate Mitochondria" ],
    3:  ["Yeast Mitochondrial",                           "Fungi (Yeast Mitochondria)" ],
    4:  ["Mold, Protozoan, & Coelenterate Mitochondrial", "Fungi, Protozoa, Coelenterates, and Mycoplasma" ],
    5:  ["Invertebrate Mitochondrial",                    "Invertebrate Mitochondria" ],
    6:  ["Ciliate, Dasycladacean, Hexamita Nuclear",      "Protozoa (Ciliate Nuclear)" ],
    9:  ["Echinoderm and Flatworm Mitochondrial",         "Echinoderms, Flatworms Mitochondria" ],
 
    10:  ["Euplotid Nuclear",                            "Ciliates (Euplotes)" ],
    11:  ["Bacterial and Plant Plastid",                 "Bacteria, Plant Plastids" ],
    12:  ["Alternative Yeast Nuclear",                   "Fungi (Alternative Yeast)" ],
    13:  ["Ascidian Mitochondrial",                      "Ascidian Mitochondria" ],
    14:  ["Flatworm Mitochondrial",                      "Flatworm Mitochondria" ],
    15:  ["Blepharisma Nuclear",                         "Ciliates (Blepharisma)" ],
    16:  ["Chlorophycean Mitochondrial",                 "Green Algae (Chlorophyceae)" ],
 
    21:  ["Trematode Mitochondrial",                     "Trematode Mitochondria" ],
    22:  ["Scenedesmus obliquus Mitochondrial",          "Algae (Scenedesmus)" ],
    23:  ["Thraustochytrium Mitochondrial",              "Protists (Thraustochytrids)" ],
    24:  ["Pachysolen tannophilus Nuclear",              "Fungi (Yeast, Pachysolen)" ],
    25:  ["Karyorelict Nuclear",                         "Protozoa (Karyorelict Ciliates)" ],
    26:  ["Condylostoma Nuclear",                        "Protozoa (Condylostoma)" ],
    27:  ["Mesodinium Nuclear",                          "Protozoa (Mesodinium)" ],
 
    28:  ["Peritrich Nuclear",                           "Protozoa (Peritrich Ciliates)" ],
    29:  ["Blastocrithidia Nuclear",                     "Protists (Blastocrithidia)" ],
    30:  ["Cephalodiscidae Mitochondrial",               "Hemichordate Mitochondria (Cephalodiscus)" ],
    31:  ["Tuduric Mitochondrial",                       "Animalia (Tuduric lineage)" ],
    32:  ["Heterolobosea Nuclear",                       "Protists (Heterolobosea)" ],
    33:  ["Gracilibacteria Nuclear",                     "Candidate Phylum (Gracilibacteria)" ],
}