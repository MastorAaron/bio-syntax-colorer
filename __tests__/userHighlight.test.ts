import * as vscode from "vscode";
import * as fs from "fs";
import { vscUtils, themeUtils } from "../src/vscUtils";
import { RegExBuilder } from "../src/regExBuilder";
import { LangFileEditor } from "../src/langGen";
import { boolUtils } from "../src/booleans";

import { PatchColors } from "../src/patch";
import * as def from "../src/definitions";
import * as rW from "../src/ruleWriter";

jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        activeColorTheme: {
            kind: 1, // Simulate Dark mode; match vscode.ColorThemeKind.Dark in your extension
        },
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn(),
        })),
    },
    ColorThemeKind: {
        Light: 2,
        Dark: 1,
        HighContrast: 3,
        HighContrastLight: 4,
    },
}));

describe("RegExBuilder highLight RegEx Generation", () => {
    const regi = new RegExBuilder();

    test("Generates basic nuke highLight RegEx", () => {
        const output = regi.genNukeRegEx("ATGN",true,false);
        expect(output).toBe("(?i)A[TU]G[NRYSWKMBDHVACGTU-*]");
    });
    test("Generates basic nuke highLight RegEx", () => {
        const output = regi.genNukeRegEx("CRY",true,false);
        expect(output).toBe("(?i)C[RAG][YTCU]");
    });

    test("Generates basic nuke highLight RegEx", () => {
        const output = regi.genNukeRegEx("GYAT",true,false);
        expect(output).toBe("(?i)G[YTCU]A[TU]");
    });
    test("Generates basic nuke highLight RegEx", () => {
        const output = regi.genNukeRegEx("NUMNUM",true,false);
        expect(output).toBe("(?i)[NRYSWKMBDHVACGTU-*][UT][NAC][NRYSWKMBDHVACGTU-*][UT][NAC]");
    });

    test("Handles unknown letters safely", () => {
        const output = regi.genNukeRegEx("A$C");
        expect(output).toContain("\\$");  // Ensures special char escaped
    });

    test("Amino property highLight RegEx expands correctly", () => {
        const output = regi.genAminoPropertyRegEx("N+",true,false);
        expect(output).toBe("(?i)[LIMVAPIG][KRHO]");
    });
});


const MAX_LEN_DISPLAY : number = 25;

function genHLNameScope(kmer: string): def.NameScope{
    if(kmer.length < MAX_LEN_DISPLAY){
        return `source.fasta.hl${kmer}.highLightRule`;//TODO: Change this so it's not possibly putting insanely long patterns into kmer 
    }else{
        return `source.fasta.hlkmer.highLightRule`;//TODO: Change this so it's not possibly putting insanely long patterns into kmer 
    }
}

describe("LangFileEditor Highlight Removal", () => {
    const contextMock = { extensionPath: "./" } as any;
    const langHandler = new LangFileEditor(contextMock);
    const builder = new RegExBuilder();

    beforeEach(() => {
        langHandler.removeHighLightPatterns();
    });
    test("Injects highlight rule with valid tokenMap scope", () => {
        function getKeywordPatterns(lang: any): any[]{
            return lang?.repository?.keywords?.patterns || [];
        }

        const regex = builder.genNukeRegEx("ATGN");
        const nameScope = genHLNameScope("ATGN");
        
        // Simulate Regex highlight rule
        const pattern: def.PatternRule = {
            name: nameScope,
            match: regex
        };
        
        langHandler.appendPattern(pattern as def.PatternRule);

        const langJSON = langHandler.loadLangFile();
        // const injected = grammar.patterns.find((p: any) => p.name.includes("highLightRule"));
        const patterns = getKeywordPatterns(langJSON);
        
        const injected = patterns.find(
            (p: any) => typeof p.name === "string" && p.name.includes("highLightRule")
        );

        expect(injected).toBeDefined();
        expect(injected.name).toContain("source.fasta.hlATGN");
        expect(injected.match).toBe(regex);
    });
});


// describe("PatchColors Tagging", () => {
//     let patcher = new PatchColors(vscUtils.mockContext());
//     beforeEach(() => {
//         patcher = new PatchColors(vscUtils.mockContext());
//     });

//     const scopeName = genHLNameScope("ATGN");
    
//     // Simulate Color rule
//     const colorRule: def.ColorRule = {
//         name: "kmer Highlighter",
//         scope: scopeName,
//         settings: {
//             "foreground": themeUtils.defaultTextColor(),
//             "background": NeonYellow
//         }
//     };
//     test("SHOULDN'T recognize version tag", () => {
//         expect(boolUtils.isAlreadyTagged(colorRule as def.ColorRule)).toBe(false);
//     });
    
//     const [taggedRule] =  patcher.tagColorsGenRules([colorRule as def.ColorRule])
//     test("SHOULD recognize version tag", () => {
//         expect(boolUtils.isAlreadyTagged(taggedRule as def.ColorRule)).toBe(true);
//     });
//     test("Append new Color Rule", () => {
//         const palette = patcher.loadColors("fasta-colors-warm.json");
//         const updatedPalette = patcher.tagColorsGenRules(palette.concat(taggedRule));
        
//         // Validate the taggedRule is present
//         const found = updatedPalette.find(rule => rule.scope === taggedRule.scope);
//         expect(found).toBeDefined();
//         expect(found?.scope).toContain("highLightRule");
        
//         fs.writeFileSync("fasta-colors.json", JSON.stringify({ tokenColors: updatedPalette }, null, 2));
//         expect(found).toBeDefined();
//         expect(found?.scope).toContain("highLightRule");
        
//     }); 
    
//    test("Write updated palette to file and check content", () => {
//         fs.writeFileSync("fasta-colors.json", JSON.stringify({ tokenColors: updatedPalette }, null, 2));

//         const fileContents = JSON.parse(fs.readFileSync("fasta-colors.json", "utf8"));
//         const found = fileContents.tokenColors.find(rule => rule.scope === taggedRule.scope);
//         expect(found).toBeDefined();
//     });
            
// });
            
const NeonYellow    : def.ColorHex = "#FFFF33";
const NeonGreen     : def.ColorHex = "#39FF14";
const NeonBlue      : def.ColorHex = "#1F51FF";
const NeonMagneta   : def.ColorHex = "#FF00FF";

describe("PatchColors Tagging", () => {
    let meta;
    let patcher;
    let taggedRule: def.ColorRule;
    let updatedPalette: def.ColorRule[];
    
    beforeEach(() => {
        meta = new rW.FileMeta("fasta-colors-warm.json");
        patcher = new PatchColors(vscUtils.mockContext(),meta);
        const scopeName = genHLNameScope("ATGN");

        const colorRule: def.ColorRule = {
            name: "kmer Highlighter",
            scope: scopeName,
            settings: {
                "foreground": themeUtils.defaultTextColor(),
                "background": NeonYellow
            }
        };

        [taggedRule] = patcher.tagColorsGenRules([colorRule]);
        const palette = patcher.loadColors("fasta-colors-warm.json");
        updatedPalette = patcher.tagColorsGenRules(palette.concat(taggedRule));
    });

    test("SHOULDN'T recognize version tag", () => {
        expect(boolUtils.isAlreadyTagged(taggedRule)).toBe(true);
    });

    test("Append new Color Rule updates palette array", () => {
        const found = updatedPalette.find((rule : def.ColorRule) => rule.scope === taggedRule.scope);
        expect(found).toBeDefined();
    });

    test("Write updated palette to file and check content", () => {
        fs.writeFileSync("./palettes/fasta-colors-warm.json", JSON.stringify({ tokenColors: updatedPalette }, null, 2));

        const fileContents = JSON.parse(fs.readFileSync("./palettes/fasta-colors-warm.json", "utf8"));
        const found = fileContents.tokenColors.find((rule : def.ColorRule) => rule.scope === taggedRule.scope);
        expect(found).toBeDefined();
    });
});

//   
