import * as vscode from "vscode";
import * as def from "./definitions";
import { boolUtils } from "./booleans";
import { vscUtils } from "./vscUtils";
import { Position } from "vscode";

const path = require('path');

export class HoverObj{ 
    private static instance: HoverObj;
    
    private DEFAULT_ALPHABET: def.Alphabet = "Ambiguous"

    private vscCOUT = vscUtils.vscCOUT;
    private currAlpha: def.Alphabet = this.DEFAULT_ALPHABET; // Default mode
    private activeToken: def.ColorRule | undefined;
    
    constructor() {
        this.vscCOUT("HoverObj initialized");
        this.initAlpha();
    }

    public static refHoverObj(): HoverObj {
        if (!HoverObj.instance) {
            HoverObj.instance = new HoverObj();
        }
        return HoverObj.instance;
    }
     
    private initAlpha(): void {
        const storedAlpha = vscode.workspace.getConfiguration().get<def.Alphabet>("bioNotation.alphabet");
        if (storedAlpha) {
            this.currAlpha = storedAlpha;
        }
}

    public getCurrAlpha(): def.Alphabet {
        const storedAlpha = vscode.workspace.getConfiguration().get<def.Alphabet>("bioNotation.alphabet");
        return storedAlpha || this.currAlpha;
    }
    private onHover(contents: string, pos: Position): vscode.Hover | undefined {
        const x = pos.line;    
        const y = pos.character;
        
        if(!contents) return;

        return new vscode.Hover({
            language: "bio-syntax-colorer",
            value: Array.isArray(contents) ? contents.join('\n'): contents
            },
            pos ? new vscode.Range(pos, new vscode.Position(x, y + 1)) : undefined
        );
    }
    
    public registerProvider(): void {
        vscode.languages.registerHoverProvider('fasta', {
            provideHover: (doc : vscode.TextDocument, pos: Position): vscode.Hover | undefined => { // provideHover(document, position/*, token*/) {//Token should only be used for async hovers which allow cancellation of hover logic
                try{
                    // const word = doc.getText(doc.getWordRangeAtPosition(pos));
                    const line = doc.lineAt(pos.line).text;
                    const letter = line[pos.character].toUpperCase(); // const letter = word[pos.character];
                    if (!letter) return;
                    
                    const description = def.arrayToStr(this.getDescription(letter, doc.fileName));
                    return this.onHover(description, pos);
                }catch(err){
                    this.vscCOUT("Error in hoverOver.ts: " + err);
                    if (process.env.NODE_ENV === 'development') {
                        console.error("Error: Not in AminoMap", err);
                    }
                    return;
                }
            }
        });
    }

    public async switchAlphabets(selection: def.Alphabet) {
        if (selection === "Ambiguous" || selection === "Nucleotides" || selection === "Aminos") {
            this.currAlpha = selection;
            await vscode.workspace.getConfiguration().update(
                "bioNotation.alphabet",
                selection,
                vscode.ConfigurationTarget.Workspace
                );
            this.vscCOUT(`BioNotation alphabet mode set to: ${selection}`);
        }else{
            this.vscCOUT("Error: no valid Alphabet selection\n",
                `Fallback is Default: ${this.DEFAULT_ALPHABET}`
            )
            this.currAlpha = this.DEFAULT_ALPHABET;
            return;
        }
    }

    public getDescription(letter: string, fileName: string): Array<string | def.nukes | def.aminos>{
        if (this.currAlpha === "Nucleotides" || boolUtils.isFna(fileName)) {
            return def.nukeInfoMap[letter as def.nukes] || letter;
        } 
        if (this.currAlpha === "Aminos" ||  boolUtils.isFaa(fileName)) {
            return def.aminoInfoMap[letter as def.aa] || letter;
        } // Mixed mode, show raw or dual-name

        const conflict = def.conflictInfoMap[letter as def.nukes];
            if (conflict) return [conflict];

        const nuke = def.nukeInfoMap[letter as def.nukes];
            if (nuke) return nuke;

        const amino = def.aminoInfoMap[letter as def.aminos];
            if (amino) return amino;
        return [letter];
    }
}

export default HoverObj.refHoverObj();