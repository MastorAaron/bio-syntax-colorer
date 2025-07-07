import { vscUtils } from "../src/vscUtils";
import * as def from "../src/definitions";

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

const faHeaderCR: any = {
    "name": "FASTA Header",
    "scope": "fasta.title",
    "settings": {
        "foreground": "#737FE6",
        "fontStyle": "bold"
    }
}

const faHeaderPR: any =  {
    "name": "fasta.title",
    "match": "^>.*"
}
describe("PatchColors Tagging", () => {
    describe('test forObjs', () => {
        test("Should be ColorRule", () => {
            expect(faHeaderCR.toBe(typeof def.ColorRule));
        });
    });
});