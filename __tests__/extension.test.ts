jest.mock('vscode', () => ({}));

const { isFastaFile } = require('../extension');
const { isAlreadyTagged } = require('../patch');

describe('isFastaFile', () => {
    test('recognizes .fa files', () => {
        expect(isFastaFile('test.fa')).toBe(true);
    });
    test('recognizes .fasta files', () => {
        expect(isFastaFile('test.fasta')).toBe(true);
    });
    test('recognizes .fastq files', () => {
        expect(isFastaFile('test.fastq')).toBe(true);
    });
    test('rejects non-fasta files', () => {
        expect(isFastaFile('test.txt')).toBe(false);
    });
});

