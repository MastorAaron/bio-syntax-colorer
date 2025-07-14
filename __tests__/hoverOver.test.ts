"use strict";

import { vscUtils } from "../src/vscUtils";
const { vscCOUT, editorConfig, showInterface } = vscUtils;


import { boolUtils } from "../src/booleans";
import * as def from "../src/definitions";
const {} = def


Object.defineProperty(exports, "__esModule", { value: true });

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

// jest.mock('vscode', () => ({
    // window: { showInformationMessage: jest.fn() },
    // workspace: { getConfiguration: jest.fn().mockReturnValue({ update: jest.fn() }) },
    // languages: { registerHoverProvider: jest.fn() },
    // Position: jest.fn(),
    // Range: jest.fn()
// }));
// const { HoverObj } = require("../src/hoverOver.ts");
// const hoverInstance = require("../src/hoverOver.ts").default;
// import { HoverObj } from '../src/hoverOver';
// import hoverInstance from '../src/hoverOver';

const { HoverObj } = require('../src/hoverOver');
const hoverInstance = require('../src/hoverOver').default;


describe('check for object', () => {
     test("Should be your singleton instance", () => {
        console.log(hoverInstance);            // Should be your singleton instance
        console.log(hoverInstance.constructor); // Should be your HoverObj class
    });
});

function boolText(bool: boolean){
    return bool? "Yes" : "No";
}

function printBool(bool: boolean){
    print(boolText(bool));
}

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

describe('is Negative Amino Acid', () => {
    test("returns true for Negative Amino", () => {
        const bool = def.isNeg('E');
        print("isNeg:");
        printBool(bool);
        expect(bool).toBe(true);
    });
});