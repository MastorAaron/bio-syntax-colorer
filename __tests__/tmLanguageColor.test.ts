
import { PatchColors, initPatcher, getPatcherInstance } from "../src/patch";
import { LangFileEditor } from '../src/langGen';
import { FileMeta,ColorFile } from "../src/ruleWriter";
import { vscUtils } from "../src/vscUtils";
import * as path from 'path';
import * as def from "../src/definitions";
import * as fs from 'fs';
// import type {  } from "../src/definitions";

// __tests__/tmLanguageColor.test.ts
jest.mock("vscode", () => ({
  window: { showInformationMessage: jest.fn() },
  workspace: {
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue({ textMateRules: [] }),
      update: jest.fn(),
    })
  }
}));



describe("Fasta grammar patterns", () => { 
  it("Actually loads >0 patterns", () => {
    const context = vscUtils.mockContext();
    const grammar = new LangFileEditor(context).loadLangFile();
    const pats = grammar.repository?.keywords?.patterns?? [];
    expect(pats.length).toBeGreaterThan(0);
  })
});
describe("tmLanguage ↔ colorRules integration", () => {
  let patcher: PatchColors;

  beforeAll(() => {
    // 1. Point FileMeta at your warm FASTA palette
    const paletteFile = "fasta-colors-warm.json" as ColorFile;
    const meta = new FileMeta(paletteFile);
    // 2. Seed the singleton once
    initPatcher(vscUtils.mockContext(), meta);
    // 3. Grab the ready-to-use instance
    patcher = getPatcherInstance(vscUtils.mockContext(), meta);
  });

  it("has a ColorRule for every tokenMap entry", () => {
    const missingTokens: string[] = [];

    for (const token of Object.keys(def.tokenMap)) {
      // pullRule loads the palette and finds by scope :contentReference[oaicite:0]{index=0}
      const rule = patcher.pullRule(token, "fasta-colors-warm.json" as ColorFile);
      if (!rule) missingTokens.push(token);
    }

    // Expect no gaps between your grammar scopes and your palette
    expect(missingTokens).toHaveLength(0);
  });
});


describe('tmLanguage ↔ palette tokenColors sync', () => {
  // load the grammar and palette
  const contextMock = { extensionPath: path.resolve(__dirname, '../') } as any;
  const grammar = new LangFileEditor(contextMock).loadLangFile();
  const palette = JSON.parse(
    fs.readFileSync(
      path.join(contextMock.extensionPath, 'palettes', 'fasta-colors-warm.json'),
      'utf8'
    )
  );

  // extract lists of “scopes”

// narrow the types at run-time:
if (
  !grammar.repository ||
  !grammar.repository.keywords ||
  !grammar.repository.keywords.patterns
) {
  throw new Error("Invalid fasta.tmLanguage.json: missing repository.keywords.patterns");
}

const grammarScopes = grammar.repository.keywords.patterns.map((p: any) => p.name);

  it('actually includes the dynamic highlight rule', () => {
    expect(paletteScopes).toContain('source.fasta.hlATGN.highLightRule');
  });

  it('no missing grammar→palette mappings', () => {
    const missing = grammarScopes.filter(s => !paletteScopes.includes(s));
    expect(missing).toEqual([]);
  });

  it('no extra palette→grammar mappings', () => {
    const extra = paletteScopes.filter(s => !grammarScopes.includes(s));
    expect(extra).toEqual([]);
  });

  it('exact one-to-one match of grammar scopes and palette scopes', () => {
    expect(new Set(paletteScopes)).toEqual(new Set(grammarScopes));
  });
});
