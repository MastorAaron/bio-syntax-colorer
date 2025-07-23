import { HighLightOverlay, NUKE_TOKEN_REGEX, AMINO_TOKEN_REGEX } from "../src/highLightOverlay";

describe("HighLightOverlay.extractToken", () => {
    const overlay = new HighLightOverlay();

    test("Extracts letter from nt scope", () => {
        expect(overlay.extractToken("source.fasta.ntA")).toBe("A");
        expect(overlay.extractToken("source.fasta.ntG")).toBe("G");
    });

    test("Extracts letter from aa scope", () => {
        expect(overlay.extractToken("source.fasta.aaF")).toBe("F");
        expect(overlay.extractToken("source.fasta.aaW")).toBe("W");
    });

    test("Returns undefined for non-token scope", () => {
        expect(overlay.extractToken("source.fasta.title")).toBeUndefined();
        expect(overlay.extractToken("source.fastq.quality.low")).toBeUndefined();
    });
});
