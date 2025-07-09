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

import { vscUtils,RuleWriter } from "../src/vscUtils";
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
describe("Test for JSON Generation", () => {
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
     describe("Build FastQ Palettes", () => {
        beforeEach(() => {
            vscUtils.vscCOUT = jest.fn();
        });

        const writer = new RuleWriter(vscUtils.mockContext(), {
            jsonKind:    "palettes",
            fileKind:    "fastq",
            descript:    "Standard FASTQ Palette",
            temperature: "Warm",
            deconPalFile: "palettes/Warm-Deconstruct.json"
            // variants: ["fna", "faa", "fastq"]
        });

        // test("Probe Rule Writer", () => {
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

    test("Probe Rule Writer", () => {
        writer.clear();
        writer.writeFileTopper();

        const tokenMap = writer.extractTokenMap();

        const fileScopes = Object.keys(tokenMap);
        let ruleCount = 0;
        const total = Object.values(tokenMap).reduce((sum, list) => sum + list.length, 0);

        for (const fileScope of fileScopes) {
            for (const [tokenType, letter] of tokenMap[fileScope]) {
                const comma = ruleCount < total - 1 ? ',' : '';
                writer.writeRule(fileScope, tokenType, letter, comma);
                ruleCount++;
            }
        }

        writer.writeFileEnd();
        });
    });
        
    //     test("should generate valid COLOR PALETTE JSON output file", () => {
    //         writer.clear(); // ensure fresh file
    //         writer.writeRules(def.tokenStripMapQ["sym"],"sym");

    //         const outFile = writer.genPath();
    //         const exists = fs.existsSync(outFile);
    //         expect(exists).toBe(true);

    //         const contents = fs.readFileSync(outFile, "utf8");
    //         const parsed = JSON.parse(contents);

    //         expect(parsed).toHaveProperty("name", "Warm");
    //         expect(parsed).toHaveProperty("tokenColors");
    //         expect(parsed.tokenColors.length).toBeGreaterThan(5);
        // });
    // });
});