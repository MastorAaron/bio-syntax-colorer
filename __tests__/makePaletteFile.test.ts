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
import { DeconFile, ColorFile, FileMeta, FilePath } from "../src/fileMeta";
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
        expect(writer.genOutputFileStr()).toBeDefined();
        console.log("actualPalFile:", writer.genOutputFileStr());
        expect(typeof writer.genOutputFileStr()).toBe("string");
    });

    test("clear() should not throw if finalizePathSetup() has been called", () => {
        expect(() => writer.clear()).not.toThrow();
        const outFile = writer.genPath();
        expect(fs.existsSync(outFile)).toBe(true);
    });

});


describe("Build FastA Palettes", () => {
    let writer: PaletteGenerator;
    let mockContext: vscode.ExtensionContext;
    let meta: FileMeta;
    let outPath: FilePath;

    beforeEach(() => {
        vscUtils.vscCOUT = jest.fn();
        mockContext = vscUtils.mockContext();
        meta = new FileMeta("fasta-colors-jadedragon.json" as ColorFile, mockContext);
        outPath = meta.fullFilePath;
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
        writer.writeRules("fasta");
    
        const outFile = writer.genPath();
        // expect(outFile).toEqual("palette\\fasta-colors-jadedragon.json");
        // expect(outFile).toEqual(outPath);
        // const meta : FileMeta  = new FileMeta(outFile,context);
        const exists = fs.existsSync(outFile);
        expect(exists).toBe(true);
    
        const contents = fs.readFileSync(outFile, "utf8");
        const parsed = JSON.parse(contents);
    
        expect(parsed).toHaveProperty("name", "Jadedragon");
        expect(parsed).toHaveProperty("tokenColors");
        expect(parsed.tokenColors.length).toBeGreaterThan(5);
    });
    // });
});

describe("Build FastQ Palettes", () => {
    let writer: PaletteGenerator;
    let mockContext: vscode.ExtensionContext;
    let meta: FileMeta;
    let outPath: FilePath;

    beforeEach(() => {
        vscUtils.vscCOUT = jest.fn();
        mockContext = vscUtils.mockContext();
        meta = new FileMeta("fastq-colors-jadedragon.json" as ColorFile, mockContext);
        outPath = meta.fullFilePath;
        initPatcher(mockContext, meta);
   
        writer = new PaletteGenerator(vscUtils.mockContext(), {
            descript:    "Jade Dragon Palette",
            paletteFile: "fastq-colors-jadedragon.json" as ColorFile,
            deconFile:   "jadedragon-deconstruct.json" as DeconFile
            // "palettes/jadedragon-deconstruct.json" as DeconFile
            // variants: ["fna", "faa", "fastq"]
        });
    });
    test("should generate valid COLOR PALETTE JSON output file", () => {
        writer.clear(); // ensure fresh file
        writer.writeRules("fastq");
    
        const outFile = writer.genPath();
        // expect(outFile).toEqual("palette\\fasta-colors-jadedragon.json");
        // expect(outFile).toEqual(outPath);
        // const meta : FileMeta  = new FileMeta(outFile,context);
        const exists = fs.existsSync(outFile);
        expect(exists).toBe(true);
    
        const contents = fs.readFileSync(outFile, "utf8");
        const parsed = JSON.parse(contents);
    
        expect(parsed).toHaveProperty("name", "Jadedragon");
        expect(parsed).toHaveProperty("tokenColors");
        expect(parsed.tokenColors.length).toBeGreaterThan(5);
    });
    // });
});