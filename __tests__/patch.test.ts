jest.mock('vscode');

import { 
    isAlreadyTagged, globalConfig, editorConfig, 
   isObj, isNull, hasNameStr, hasSettings 
}  from '../patch';

import type { ColorRule } from '../patch';

const completeRule: ColorRule = {
    "name": "bio-colorer@0.0.45: FASTA Header",
    "scope": "fasta.title",
    "settings": {
        "foreground": "#E6DB74",
        "fontStyle": "bold"
    }
}

const unTaggedRule: ColorRule = { name: "FASTA Header", scope: "fasta.title"  };
const partialRule: Partial<ColorRule> = { name: "bio-colorer@0.0.45: FASTA Header" }
const double = 1.4;
const int = 1;
const str = "test";
const array = [1.4, 2.4, 1, 2, "test"];
describe('isAlreadyTagged', () => {
    test("returns true for object with bio-colorer@ tag", () => {
        expect(isAlreadyTagged(completeRule)).toBe(true);
    });

    // test("SHOULDN'T recognize version tag", () => {
    //     expect(isAlreadyTagged('test.fa')).toBe(false);
    // });
    
    // test("SHOULD recognize version tag", () => {
    //     expect(isAlreadyTagged("bio-colorer@")).toBe(false);
    // });


    test("SHOULD recognize version tag", () => {
        expect(isAlreadyTagged(completeRule)).toBe(true);
    });

      test("SHOULDN'T recognize version tag", () => {
          expect(isAlreadyTagged(completeRule)).toBe(true);
    }); 
    
    test("SHOULD recognize version tag", () => {
        expect(isAlreadyTagged(unTaggedRule)).toBe(false);
    });
    
    test("SHOULDN'T recognize version tag", () => {
        expect(isAlreadyTagged(unTaggedRule)).toBe(false);
    });
});

describe('Tests for hasSettings Behavior', () => {
    test("Given Whole Object", () => {
        expect(hasSettings(completeRule)).toBe(true);
    });
    
});
describe('Tests for hasNameStr Behavior', () => {
    test("Given Whole Object", () => {
        expect(hasNameStr(completeRule)).toBe(true);
    });
    test("Given Partial Object", () => {
        expect(hasNameStr(partialRule as ColorRule)).toBe(true);
    });

    test("Given Partial Untagged Object", () => {
        expect(hasNameStr(unTaggedRule)).toBe(true);
    });
    test("Given string Untagged Object", () => {
        expect(hasNameStr(str as unknown as ColorRule)).toBe(false);
    }); 
});
//     test("Given string to NameBoolean", () => {
//         expect(hasNameStr("name")).toBe(false);
//     });
// });
describe('Tests for isNull Behavior', () => {
    test("Given Whole Object", () => {
        expect(isNull(completeRule)).toBe(false);
    });
    test("Given Partial Object", () => {
        expect(isNull(partialRule)).toBe(false);
    });
    test("Given Partial Untagged Object", () => {
        expect(isNull(unTaggedRule)).toBe(false);
    });
    test("Given String", () => {
        expect(isNull(str)).toBe(false);
    });
    test("Given int", () => {
        expect(isNull(int)).toBe(false);
    }); 
    test("Given double", () => {
        expect(isNull(double)).toBe(false);
    });
    test("Given array", () => {
        expect(isNull(array)).toBe(false);
    });
});
describe('Tests for isObj Behavior', () => {
    test("Given Whole Object", () => {
        expect(isObj(completeRule)).toBe(true);
    }); 
    test("Given settings Object", () => {
        expect(isObj(completeRule.settings)).toBe(true);
    });
    test("Given Partial Object", () => {
        expect(isObj(partialRule)).toBe(true);
    });
    test("Given Partial Untagged Object", () => {
        expect(isObj(unTaggedRule)).toBe(true);
    });
    test("Given String", () => {
        expect(isObj(str)).toBe(false);
    });
    test("Given int", () => {
        expect(isObj(int)).toBe(false);
    }); 
    test("Given double", () => {
        expect(isObj(double)).toBe(false);
    });
    test("Given array", () => {
        expect(isObj(array)).toBe(false);
    });
    test("Given null", () => {
        expect(isObj(null)).toBe(false);
    });
});
describe('globalConfig', () => {
    test('returns the global configuration object', () => {
        const config = globalConfig();
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
    });
});

describe('editorConfig', () => {
    test('returns the editor configuration object', () => {
        const config = editorConfig();
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
    });
});