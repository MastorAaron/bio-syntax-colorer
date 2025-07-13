jest.mock('vscode', () => ({
    window: { showInformationMessage: jest.fn() },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
                textMateRules: []
            }),
            update: jest.fn()
        })
    }
}));


import { vscUtils } from "../src/vscUtils";
import { Theme } from "../src/extension";
const { vscCOUT, editorConfig, showInterface } = vscUtils;


import { boolUtils } from "../src/booleans";
import * as def from "../src/definitions";
import * as rW from "../src/ruleWriter";
import { RuleWriter, FileMeta } from "../src/ruleWriter";
const {} = def



describe("File verification", () => {
    const fileManager = new rW.FileMeta("fasta-colors-warm.json");
    test("File verification", () => {
        expect(boolUtils.isFastaFile('test.fa')).toBe(true);
    }); 
    
    test("File verification", () => {
        expect(fileManager.filePath === "fasta-colors-warm.json" as rW.ColorFile).toBe(true);
    });
    
    test("Theme? ", () => {
        expect(fileManager.theme === "warm" as Theme).toBe(true);
    });
   test("Lang? ", () => {
        expect(fileManager.lang === "fasta" as rW.Lang).toBe(true);
    }); 
    
    test("Variants? ", () => {
        expect(fileManager.variants).toBeDefined();
    });
    
    test("Variants? ", () => {
        expect(fileManager.variants).toEqual([ "fasta", "fastq", "fa" ]);
    });


});