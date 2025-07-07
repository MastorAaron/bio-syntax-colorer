import * as vscode from "vscode";
import * as def from "../src/definitions";
import hoverOver from '../src/hoverOver';
import { boolUtils } from '../src/booleans';
import { vscUtils } from '../src/vscUtils';
// const { vscUtils } = require('../src/vscUtils');
// const { BioNotation } = require('../src/extension');
import { BioNotation } from '../src/extension';
import {  } from '../src/vscUtils';


const { vscCOUT, editorConfig, showInterface, mockContext} = vscUtils;


jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        // showQuickPick: jest.fn()
        showQuickPick: jest.fn(async (options) => {
            console.log("Simulated QuickPick with options:", options);
            return "Aminos";  // Simulated user selection
        })
    },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn(),
            update: jest.fn()
        })
    },
       commands: {
        registerCommand: jest.fn()
    },
    languages: {
        registerHoverProvider: jest.fn()
    },
    ConfigurationTarget: {
        Workspace: 'Workspace'  // Dummy constant just to satisfy the assignment
    }
}));

//For Actual function testing
jest.mock('../src/vscUtils', () => {
    const realUtils = jest.requireActual('../src/vscUtils');
    return {
        vscUtils: {
            vscCOUT: jest.fn(),
            showInterface: realUtils.vscUtils.showInterface,
            editorConfig: jest.fn(),
            globalConfig: jest.fn(() => ({
                get: jest.fn().mockReturnValue(false)
            })),
            mockContext: realUtils.vscUtils.mockContext
        }
    };
});



//For testing components of function
// jest.mock('../src/vscUtils', () => ({
//     vscUtils: {
//         vscCOUT: jest.fn(),
//         showInterface: jest.fn(),
//         editorConfig: jest.fn(),
//         globalConfig: jest.fn(() => ({
//             get: jest.fn().mockReturnValue(false)
//         }))
//     }
// }));

// jest.spyOn(hoverOver, 'toggleNotationMode').mockImplementation(async (selection) => {
    // Optional: preserve internal state updates, or override
    // await vscode.workspace.getConfiguration().update("bio-colorer.notationMode", selection, vscode.ConfigurationTarget.Workspace);
    jest.spyOn(hoverOver, 'toggleNotationMode');
// });

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

function print(toPrint:string, stream:string="console"){
    if(stream === "console"){
        console.log(toPrint);
    }else if(stream === "vsc"){
        vscCOUT(toPrint);
    }
    // else if(stream === "else"){
    //     (toPrint);
    // }
}

function handleCurrAlpha(expectStr: string, time: string){
    const currAlpha: def.alphabet = hoverOver.getCurrAlpha();
    print(`${time}: ${currAlpha}`);
    expect(currAlpha).toBe(expectStr);
}


// describe('toggleAlphabet Forcing Reset', () => {
//     let bioNotation : typeof BioNotation;
    
//     beforeEach(() => {
//         const mockContext = { subscriptions: [] };
//         bioNotation = new BioNotation(mockContext);

//         hoverOver.toggleNotationMode("Ambigious");
//     });
    
//     async function mutateAlpha(selection:string){
//         vscUtils.showInterface.mockResolvedValue(selection);
//         await bioNotation.toggleAlphabet();
//         expect(await hoverOver.toggleNotationMode).toHaveBeenCalledWith(selection);
//     }
    
   
//     async function testChangeOfAlpha(selection:string){
//         handleCurrAlpha("Ambigious","Before");
//         await mutateAlpha(selection);
//         handleCurrAlpha(selection,"After");
//     }
    
//     //Forcing Reset
//     test('handles Aminos selection', async () => {
//         await testChangeOfAlpha("Aminos");        
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("Protein"));
//     });

//     test('handles Nucleotides selection', async () => {
//         await testChangeOfAlpha("Nucleotides");
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("DNA/RNA"));
//     });

//     test('handles Ambigious selection', async () => {
//         await testChangeOfAlpha("Ambigious");
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("Ambigious"));
//     });

// });


//    describe('toggleAlphabet Persistent States', () => {
//     let bioNotation : typeof BioNotation;
    
//     beforeEach(() => {
//         const mockContext = { subscriptions: [] };
//         bioNotation = new BioNotation(mockContext);
//     });

//     async function mutateAlpha(selection:string){
//         vscUtils.showInterface.mockResolvedValue(selection);
//         await bioNotation.toggleAlphabet();
//         expect(await hoverOver.toggleNotationMode).toHaveBeenCalledWith(selection);
//     }

//     async function persistentChangeOfAlpha(before:string, selection:string){
//         handleCurrAlpha(before,"Before");
//         await mutateAlpha(selection);
//         handleCurrAlpha(selection,"After");
//     }
    
//     async function mutateAlphaACTUAL(){
//         const selection = await vscUtils.showInterface();
//         await bioNotation.toggleAlphabet();
//         await hoverOver.toggleNotationMode;
//     }

//     //Persistent States
//     test('handles Aminos selection', async () => {
//         await persistentChangeOfAlpha("Ambigious", "Aminos");        
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("Protein"));
//     });

//     test('handles Nucleotides selection', async () => {
//         await persistentChangeOfAlpha("Aminos","Nucleotides");   
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("DNA/RNA"));
//     });

//     test('handles Ambigious selection', async () => {
//         await persistentChangeOfAlpha("Nucleotides","Ambigious");   
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("Ambigious"));
//     });
//     test('handles Ambigious selection', async () => {
//         await persistentChangeOfAlpha("Nucleotides","Ambigious");   
//         expect(vscUtils.vscCOUT).toHaveBeenCalledWith(expect.stringContaining("Ambigious"));
//     });
// });



describe('MockContext', () => {
    test('Context should exist...', async () => {
        const context = vscUtils.mockContext();
        expect(context).toBeDefined();
    });
});


describe('Actual toggleAlphabet', () => {
    let bioNotation:  BioNotation;

    test('handles realTime Selection', async () => {
        bioNotation = new BioNotation(vscUtils.mockContext());

        await bioNotation.toggleAlphabet();
    });
});

