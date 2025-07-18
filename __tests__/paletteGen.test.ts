const { HoverObj } = require("../src/hoverOver"); // ✅ delayed loading

jest.mock('vscode', () => ({
    window: { showInformationMessage: jest.fn() },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
                textMateRules: []
            }),
            update: jest.fn(),
        })
    }
}));

import * as vscode from "vscode";
import { DeconFile, ColorFile, FileMeta } from "../src/fileMeta";
// import { LangGenerator } from "../src/langGen";
import { PaletteGenerator } from "../src/paletteGen";
import { initPatcher } from "../src/patch";
import { vscUtils } from "../src/vscUtils";
import * as fs from "fs";
import * as def from "../src/definitions";


beforeAll(() => {
  // suppress print during tests
  vscUtils.vscCOUT = jest.fn();
});

const faHeaderCR: any = {
    "name": "FASTA Header",
    "scope": "fasta.title",
    "settings": {
        "foreground": "#737FE6",
        "fontStyle": "bold"
    }
}

// const faHeaderPR: any =  {
//     "name": "fasta.title",
//     "match": "^>.*"
// }
// describe("PatchColors Tagging", () => {
//     describe('test forObjs', () => {
//         test("Should be ColorRule", () => {
//             expect(faHeaderCR.toBe(typeof def.ColorRule));
//         });
//     });
// });
// 
// describe("Test for JSON Generation", () => {
//     describe("Build FastQ Language Json", () => {
        
//         const writer = new RuleWriter(vscUtils.mockContext(), {
//             fileKind: "fastq",
//             descript: "Standard FASTQ Language",
//             jsonKind: "syntaxes",
//             variants: ["fna", "faa", "fastq"]
//         });

//         test("Json Should exist", () => {
//             writer.clear();
//             writer.writePatterns(def.tokenStripMap);
//             expect(writer.genPath()).toBeDefined();
//         });
//     }); 

// interface ColorRuleParams{
    //     jsonKind: "palettes";
    //     fileKind: string;
    //     descript: string;
    //     theme: string;
//     actualPalFile : rW.JsonFile;
//     deconPalFile?: rW.DeconFile;
// }

// describe("Build FastQ Palettes", () => {


describe("PaletteGenerator finalizePathSetup() behavior", () => {
    let writer: PaletteGenerator;
    let mockContext;

    beforeEach(() => {
        mockContext = vscUtils.mockContext();
        const meta = new FileMeta("fasta-colors-jadedragon.json", mockContext);
        initPatcher(mockContext, meta);

        writer = new PaletteGenerator(mockContext, {
            descript: "Jade Dragon Palette",
            paletteFile: "fasta-colors-jadedragon.json",
            deconFile: "jadedragon-deconstruct.json"
        });
    });

    test("actualPalFile is defined after finalizePathSetup()", () => {
        writer.finalizePathSetup();
        expect(writer.actualPalFile).toBeDefined();
        console.log("actualPalFile:", writer.actualPalFile);
        expect(typeof writer.actualPalFile).toBe("string");
    });

    test("clear() should not throw if finalizePathSetup() has been called", () => {
        writer.finalizePathSetup();
        expect(() => writer.clear()).not.toThrow();
        const outFile = writer.genPath();
        expect(fs.existsSync(outFile)).toBe(true);
    });

    test("clear() should lazy-initialize finalizePathSetup() if needed", () => {
        writer.actualPalFile = undefined; // simulate unset
        expect(() => writer.clear()).not.toThrow();
        expect(writer.actualPalFile).toBeDefined();
    });
});


describe("Build FastA Palettes", () => {
    let writer: PaletteGenerator;
    let mockContext: vscode.ExtensionContext;
    let meta: FileMeta;

    beforeEach(() => {
        vscUtils.vscCOUT = jest.fn();
        const mockContext = vscUtils.mockContext();
        const meta = new FileMeta("fasta-colors-jadedragon.json" as ColorFile, mockContext);
        initPatcher(mockContext, meta);
   
        writer = new PaletteGenerator(vscUtils.mockContext(), {
            descript:    "Jade Dragon Palette",
            paletteFile: "fasta-colors-jadedragon.json" as ColorFile,
            deconFile:   "jadedragon-deconstruct.json" as DeconFile
            // "palettes/jadedragon-deconstruct.json" as DeconFile
            // variants: ["fna", "faa", "fastq"]
        });
    });
    test("should generate valid COLOR PALETTE JSON output file", () => {
        writer.clear(); // ensure fresh file
        writer.writeRules("fasta"); // writer.writeRules(def.tokenStripMap["sym"],"sym");
    
        const outFile = writer.genPath();
        const exists = fs.existsSync(outFile);
        expect(exists).toBe(true);
    
        const contents = fs.readFileSync(outFile, "utf8");
        const parsed = JSON.parse(contents);
    
        expect(parsed).toHaveProperty("name", "Dragon");
        expect(parsed).toHaveProperty("tokenColors");
        expect(parsed.tokenColors.length).toBeGreaterThan(5);
    });
    // });
});
        // test("Probe Palette Writer", () => {
        //     writer.clear(); // ensure fresh file
        //     // ['A','C','G','T','U','N'];
        //     const tokenTypes = 
        //     ["title", "ignoreLine","quality"];
        //     const letters = 
        //     ["@","+","low","mid","high"];
        //     // ['A','C','G','T','U','N','R','Y','B','D','H','V','K','M','S','W'];
        //     // ['F','E','Z','J','I','L','P','Q','O','X'];
        //     // ["Gap", "Stop"];
        //     // [ "title", "nt", "aa", "sym" ];
        //     // const tokType="nt";
        //     const tokType="foreground";
        //     writer.writeFileTopper();
        //     for(const tokType of tokenTypes){
        //         for(const letter of letters){
        //             writer.writeRule( "fastq", tokType, letter, ',' );
        //         }
        //     }
        //     writer.writeFileEnd();
            
        // }); 
        
        //    test("Probe Rule Writer", () => {
            //         writer.clear();
    //         writer.writeFileTopper();

    //         const pairs = writer.extractTokenPairsFromPalette();
    //         const last = pairs.length - 1;

    //         pairs.forEach(([tokenType, letter], i) => {
    //             const comma = i < last ? ',' : '';
    //             writer.writeRule("fastq", tokenType, letter, comma);
    //         });

    //         writer.writeFileEnd();
    //         });
    // });

    // test("Probe Rule Writer", () => {
    //     writer.clear();
    //     writer.writeFileTopper();

    //     const tokenMap = writer.extractTokenMap();

    //     const fileScopes = Object.keys(tokenMap);
    //     let ruleCount = 0;
    //     const total = Object.values(tokenMap).reduce((sum, list) => sum + list.length, 0);

    //     for (const fileScope of fileScopes) {
    //         for (const [tokenType, letter] of tokenMap[fileScope]) {
    //             const comma = ruleCount < total - 1 ? ',' : '';
    //             writer.writeRule(fileScope, tokenType, letter, comma);
    //             ruleCount++;
    //         }
    //     }

    //     writer.writeFileEnd();
    //     });
    // });
        
