import * as vscode from "vscode";
import { vscUtils, themeUtils, DARK_VISIBLE_FG, LIGHT_VISIBLE_FG } from "../src/vscUtils";
import { RegExBuilder } from "../src/vscUtils";
import { boolUtils} from "../src/booleans";

import {PatchColors} from "../src/patch";
import * as def from "../src/definitions";
import { FileMeta } from "../src/fileMeta";
import { LangFileEditor } from "../devTools/langGen";


// jest.mock('vscode', () => ({
//     window: {
//         showInformationMessage: jest.fn(),
//     },
// }));

describe("RegExBuilder highLight RegEx Generation", () => {
    const builder = new RegExBuilder();

    test("Generates basic nuke highLight RegEx", () => {
        const output = builder.genNukeRegEx("ATGN");
        expect(output).toBe("(?i)A[TU]G[NRYSWKMBDHVACGTU-]");
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

function genHLNameScope(kmer: string): def.NameScope{
    return `source.fasta.hl${kmer}.highLightRule`;
}

describe("LangFileEditor Highlight Removal", () => {
    const contextMock = { extensionPath: "./" } as any;
    const langHandler = new LangFileEditor(contextMock);
    const builder = new RegExBuilder();

    beforeEach(() => {
        langHandler.removeHighLightPatterns();
    });
});
