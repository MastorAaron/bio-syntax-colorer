import * as vscode from "vscode";
import { PaletteDeconstructor } from "../src/paletteDecon";
import { vscUtils } from "../src/vscUtils";
import * as rW from "../src/ruleWriter";

jest.unmock("fs");


import * as fs from "fs";
import * as path from "path";

import type { ColorFile } from "../src/ruleWriter";
import { initPatcher } from "../src/patch";

jest.mock("vscode", () => ({
    window: { showInformationMessage: jest.fn() },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
            textMateRules: []
            }),
            update: jest.fn(),
        }),
    },
}));

    describe("PaletteDeconstructor Integration", () => {
    // const testContext = //{} as vscode.ExtensionContext;
    // vscUtils.mockContext();

    const testContext = {
        ...vscUtils.mockContext(),
        extensionPath: path.resolve(__dirname, "../"),
    } as vscode.ExtensionContext;

      beforeAll(() => {
      // 1) Let FileMeta parse the palette filename
      const meta = new rW.FileMeta(warmFile as ColorFile);
      // 2) Seed the PatchColors singleton exactly once
      initPatcher(testContext, meta);
    });

    const warmFile = path.resolve(__dirname, "../palettes/fasta-colors-warm.json");
    const expectedDeconFile = path.resolve(__dirname, "../palettes/warm-deconstruct.json");

    // afterAll(() => {
    //     if (fs.existsSync(expectedDeconFile)) {
    //         fs.unlinkSync(expectedDeconFile); // Clean up after test
    //     }
    // });
    
    it("expect InPut File to Exist", () => {
        expect(fs.existsSync(warmFile)).toBe(true);
    });

    
    it("writes warm-dconstruct.json from fasta-colors-cold.json", () => {
        
        const decon = new PaletteDeconstructor(testContext,warmFile as ColorFile);
        
        console.log("Expected file path:", expectedDeconFile);
        console.log("Actual decon path from writer.genPath():", decon.genPath());
        
        
        // clear any old output
        //UNTESTED: if (fs.existsSync(expectedDecon)) fs.unlinkSync(expectedDecon);

        decon.clear();
        decon.writeDeconFile();
        decon.decomposeScope("fasta.title");

        console.log("decon.targetPath:", decon.genPath());
        console.log("Expected path:", expectedDeconFile);
        console.log("File actually exists:", fs.existsSync(decon.genPath()));

        expect(fs.existsSync(expectedDeconFile)).toBe(true);

        const content = JSON.parse(fs.readFileSync(expectedDeconFile, "utf8"));

        expect(content).toHaveProperty("fasta");
        expect(content.description).toBe("Warm Decon Palette");
        expect(content.fasta).toHaveProperty("nt");
        expect(content.fasta.nt).toHaveProperty("A");
    });
});
