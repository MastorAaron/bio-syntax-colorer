jest.mock('vscode', () => ({
    window: { showInformationMessage: jest.fn() },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
                textMateRules: []
            }),
           update: jest.fn()
        })
    },
    languages: { registerHoverProvider: jest.fn() },
    Position: jest.fn(),
    Range: jest.fn()
}));

import { vscUtils } from '../src/vscUtils';
import type { ColorRule } from '../src/definitions';
import { boolUtils } from '../src/booleans';
import { Color } from 'vscode';
    const completeRule: ColorRule = {
        "name": "bio-colorer@0.0.45: FASTA Header",
        "scope": "fasta.title",
        "settings": {
            "foreground": "#E6DB74",
            "fontStyle": "bold"
        }
    }

    const unTaggedRule: Partial<ColorRule> = { name: "FASTA Header", scope: "fasta.title"  };
    const partialRule: Partial<ColorRule> = { 
        name: "bio-colorer@0.0.45: FASTA Header", 
        scope: "fasta.title"  
    }
    const double = 1.4;
    const int = 1;
    const str = "test";
    const array = [1.4, 2.4, 1, 2, "test"];
describe('isAlreadyTagged', () => {
    // test("returns true for object with bio-colorer@ tag", () => {
    //     expect(boolUtils.isAlreadyTagged(completeRule)).toBe(true);
    // });

    // test("SHOULD recognize version tag", () => {
    //     expect(boolUtils.isAlreadyTagged(completeRule)).toBe(true);
    // });

      test("SHOULDN'T recognize version tag", () => {
          expect(boolUtils.isAlreadyTagged(completeRule)).toBe(true);
    }); 
    
    test("SHOULD recognize version tag", () => {
        expect(boolUtils.isAlreadyTagged(unTaggedRule as ColorRule)).toBe(false);
    });
    
    test("SHOULDN'T recognize version tag", () => {
        expect(boolUtils.isAlreadyTagged(unTaggedRule as ColorRule)).toBe(false);
    });
});

// describe('Tests for hasSettings Behavior', () => {
//     test("Given Whole Object", () => {
//         expect(boolUtils.hasSettings(completeRule)).toBe(true);
//     });
    
// });
// describe('Tests for hasNameStr Behavior', () => {
//     test("Given Whole Object", () => {
//         expect(boolUtils.hasNameStr(completeRule)).toBe(true);
//     });
//     test("Given Partial Object", () => {
//         expect(boolUtils.hasNameStr(partialRule as ColorRule)).toBe(true);
//     });

//     test("Given Partial Untagged Object", () => {
//         expect(boolUtils.hasNameStr(unTaggedRule)).toBe(true);
//     });
//     test("Given string Untagged Object", () => {
//         expect(boolUtils.hasNameStr(str as unknown as ColorRule)).toBe(false);
//     }); 
// });

describe('Tests for isNull Behavior', () => {
    test("Given Whole Object", () => {
        expect(boolUtils.isNull(completeRule)).toBe(false);
    });
    test("Given Partial Object", () => {
        expect(boolUtils.isNull(partialRule)).toBe(false);
    });
    test("Given Partial Untagged Object", () => {
        expect(boolUtils.isNull(unTaggedRule)).toBe(false);
    });
    test("Given String", () => {
        expect(boolUtils.isNull(str)).toBe(false);
    });
    test("Given int", () => {
        expect(boolUtils.isNull(int)).toBe(false);
    }); 
    test("Given double", () => {
        expect(boolUtils.isNull(double)).toBe(false);
    });
    test("Given array", () => {
        expect(boolUtils.isNull(array)).toBe(false);
    });
});
describe('Tests for isObj Behavior', () => {
    test("Given Whole Object", () => {
        expect(boolUtils.isObj(completeRule)).toBe(true);
    }); 
    test("Given settings Object", () => {
        expect(boolUtils.isObj(completeRule.settings)).toBe(true);
    });
    test("Given Partial Object", () => {
        expect(boolUtils.isObj(partialRule)).toBe(true);
    });
    test("Given Partial Untagged Object", () => {
        expect(boolUtils.isObj(unTaggedRule)).toBe(true);
    });
    test("Given String", () => {
        expect(boolUtils.isObj(str)).toBe(false);
    });
    test("Given int", () => {
        expect(boolUtils.isObj(int)).toBe(false);
    }); 
    test("Given double", () => {
        expect(boolUtils.isObj(double)).toBe(false);
    });
    test("Given array", () => {
        expect(boolUtils.isObj(array)).toBe(false);
    });
    test("Given null", () => {
        expect(boolUtils.isObj(null)).toBe(false);
    });
});
describe('globalConfig', () => {
    test('returns the global configuration object', () => {
        const config = vscUtils.globalConfig();
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
    });
});

describe('editorConfig', () => {
    test('returns the editor configuration object', () => {
        const config = vscUtils.editorConfig();
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
    });
});

describe('currCustomization', () => {
    test('returns the current customization object', () => {
        const config = vscUtils.editorConfig();
        const customization = vscUtils.currCustomization(config);

        expect(customization).toBeDefined();
        expect(typeof customization).toBe('object');
        expect(customization.textMateRules).toBeDefined();
        expect(Array.isArray(customization.textMateRules)).toBe(true);
    });
});