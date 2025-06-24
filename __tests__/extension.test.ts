jest.mock('vscode', () => ({}));

const { isFastaFile } = require('../extension');
const { isAlreadyTagged } = require('../patch');

describe('isFastaFile', () => {
    test('recognizes .fa files', () => {
        expect(isFastaFile('test.fa')).toBe(true);
    });
    test('recognizes .fna files', () => {
        expect(isFastaFile('test.fna')).toBe(false);
    });
    
    test('recognizes .faa files', () => {
        expect(isFastaFile('test.faa')).toBe(false);
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

