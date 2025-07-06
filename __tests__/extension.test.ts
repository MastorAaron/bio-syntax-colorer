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

import { boolUtils } from '../src/booleans';

describe('isFastaFile', () => {
    test('recognizes .fa files', () => {
        expect(boolUtils.isFastaFile('test.fa')).toBe(true);
    });
    test('recognizes .fna files', () => {
        expect(boolUtils.isFastaFile('test.fna')).toBe(true);
    });
    
    test('recognizes .faa files', () => {
        expect(boolUtils.isFastaFile('test.faa')).toBe(true);
    });
    test('recognizes .fasta files', () => {
        expect(boolUtils.isFastaFile('test.fasta')).toBe(true);
    });
    test('recognizes .fastq files', () => {
        expect(boolUtils.isFastaFile('test.fastq')).toBe(true);
    });
    test('rejects non-fasta files', () => {
        expect(boolUtils.isFastaFile('test.txt')).toBe(false);
    });
});

