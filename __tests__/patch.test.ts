import { jest } from "@jest/globals";

import { PatchColors } from "../src/patch";
import { ColorFile, FileMeta } from "../src/ruleWriter";
import { ColorRule } from "../src/definitions";
import { vscUtils } from "../src/vscUtils";


jest.mock("vscode", () => ({
    window: {
    showInformationMessage: jest.fn(),
    showQuickPick: jest.fn(),
    showInputBox: jest.fn(),
  },
  workspace: {/*…*/},
  // if you use mockContext to set extensionPath to point at your test fixtures, import that too
}));

describe("PatchColors.loadColors", () => {
    let patcher : PatchColors;
    let palette : ColorRule[];

  beforeEach(() => {
    const meta = new FileMeta("fasta-colors-warm.json" as ColorFile);
    patcher = new PatchColors(vscUtils.mockContext(/*pointing at your test-fixtures-root*/),meta);
    palette = patcher.loadColors("fasta-colors-warm.json" as ColorFile);
  });

    it("returns a non-empty array of rules", () => {
        expect(Array.isArray(palette)).toBe(true);
        expect(palette.length).toBeGreaterThan(0);
    });
    // check a known token in your warm file
    it("includes the nucleotide rule for ntA", () => {
        expect(
            palette.some(r => r.scope === "source.fasta.ntA")
        ).toBe(true);
    });
    
    it("Check for Token X", () => {
       
        expect(palette.find(r => r.scope === "source.fasta.aaX")).toBeDefined();
    });
});

