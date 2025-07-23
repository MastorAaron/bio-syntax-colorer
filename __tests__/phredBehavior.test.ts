import * as vscode from 'vscode';
import { __test__ } from '../src/phredHandler';
import * as fs from 'fs'
import { HoverObj } from '../src/hoverOver';



describe("probsPhredline Heuristic Score", () => {
    let fred: InstanceType<typeof __test__.PhredHover>;
    let hover: HoverObj;

    beforeAll(async () => {
        hover = await HoverObj.refHoverObj();
        fred = await __test__.PhredHover.initPhredHover();
    });

    test("detects probable Phred line", () => {
        const sampleFastQ = [
            "@Seq_ID",
            "GATTAGYNCATTATGYAT",
            "+@Seq_ID",
            "IIIIIIIIIIIIIIIIII" //ASCII 73, very likely
        ];

        const mockDoc = {
            fileName: "ex.fastq",
            lineAt: (i: number) => ({ text: sampleFastQ[i] })
        } as unknown as vscode.TextDocument;

        // const result = fred["probsPhredLine"](mockDoc, 3);
        const result = (fred as any).probsPhredLine(mockDoc, 3); // access private for test
        expect(result).toBe(true);
    });
});
