import * as vscode from "vscode";
import { PaletteDeconstructor } from "../src/paletteDecon";
import { vscUtils } from "../src/vscUtils";

jest.unmock("fs");


import * as fs from "fs";
import * as path from "path";

import type { ColorFile } from "../src/ruleWriter";

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



    const coolFile = path.resolve(__dirname, "../palettes/fasta-colors-cold.json");
    const expectedDeconFile = path.resolve(__dirname, "../palettes/cold-deconstruct.json");

    // afterAll(() => {
    //     if (fs.existsSync(expectedDeconFile)) {
    //         fs.unlinkSync(expectedDeconFile); // Clean up after test
    //     }
    // });
    
    it("expect InPut File to Exist", () => {
        expect(fs.existsSync(coolFile)).toBe(true);
    });

    
    it("writes cold-Deconstruct.json from fasta-colors-cold.json", () => {
        const decon = new PaletteDeconstructor(testContext, {
            jsonKind:  "decon",
            fileKind:  "fastq",
            palFlavor: "cold",
            paletteFile : coolFile as ColorFile
        });
    
        console.log("Expected file path:", expectedDeconFile);
        console.log("Actual decon path from writer.genPath():", decon.genPath());
        
        decon.clear();
        decon.writeDeconFile();
        decon.decomposeScope("fasta.title");

        console.log("decon.targetPath:", decon.genPath());
        console.log("Expected path:", expectedDeconFile);
        console.log("File actually exists:", fs.existsSync(decon.genPath()));

        expect(fs.existsSync(expectedDeconFile)).toBe(true);

        const content = JSON.parse(fs.readFileSync(expectedDeconFile, "utf8"));

        expect(content.description).toBe("Cold Decon Palette");
        expect(content).toHaveProperty("fasta");
        expect(content.fasta).toHaveProperty("nt");
        expect(content.fasta.nt).toHaveProperty("A");
    });
});
