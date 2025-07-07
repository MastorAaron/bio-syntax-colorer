import * as vscode from "vscode";
import { vscUtils, themeUtils, DARK_FG, LIGHT_FG } from "../src/vscUtils";
import { LangHandler, RegExBuilder } from "../src/vscUtils";
import { boolUtils} from "../src/booleans";

import {PatchColors} from "../src/patch";
import * as def from "../src/definitions";

// jest.mock('vscode', () => ({
//     window: {
//         showInformationMessage: jest.fn(),
//     },
// }));

describe("RegExBuilder highLight RegEx Generation", () => {
    const builder = new RegExBuilder();

    test("Generates basic nuke highLight RegEx", () => {
        const output = builder.genNukeRegEx("ATGN");
        expect(output).toBe("(?i)ATG[NRYSWKMBDHVACGTU-*]");
    });

    test("Handles unknown letters safely", () => {
        const output = builder.genNukeRegEx("A$C");
        expect(output).toContain("\\$");  // Ensures special char escaped
    });

    test("Amino property highLight RegEx expands correctly", () => {
        const output = builder.genAminoPropertyRegEx("N+");
        expect(output).toBe("(?i)[LIMVAPIG][KRHO]");
    });
});

const NeonYellow  = "#FFFF33"
const NeonGreen   = "#39FF14"
const NeonBlue    = "#1F51FF"
const NeonMagneta = "#FF00FF"

function genHLNameScope(kmer: string): def.nameScope{
    return `source.fasta.hl${kmer}.highLightRule`;
}

describe("LangHandler Highlight Removal", () => {
    const contextMock = { extensionPath: "./" } as any;
    const langHandler = new LangHandler(contextMock);
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
        const pattern = {
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


describe("PatchColors Tagging", () => {
    const patcher = new PatchColors(vscUtils.mockContext());
    const scopeName = genHLNameScope("ATGN");
    
    // Simulate Color rule
    const colorRule: def.ColorRule = {
        name: "kmer Highlighter",
        scope: scopeName,
        settings: {
            "foreground": themeUtils.defaultTextColor(),
            "background": NeonYellow
        }
    };
    test("SHOULDN'T recognize version tag", () => {
        expect(boolUtils.isAlreadyTagged(colorRule as def.ColorRule)).toBe(false);
    });
    
    const [taggedRule] =  patcher.tagColorsGenRules([colorRule as def.ColorRule])
    test("SHOULD recognize version tag", () => {
        expect(boolUtils.isAlreadyTagged(taggedRule as def.ColorRule)).toBe(true);
    });
    test("Append new Color Rule", () => {
        const palette = patcher.loadColors("fasta-colors-warm.json");
        const updatedPalette = patcher.tagColorsGenRules(palette.concat(taggedRule));

        // Validate the taggedRule is present
        const found = updatedPalette.find(rule => rule.scope === taggedRule.scope);
        expect(found).toBeDefined();
        expect(found?.scope).toContain("highLightRule");
    }); 
            
});
            
describe("", () => {

});            