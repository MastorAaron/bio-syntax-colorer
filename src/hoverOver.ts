import * as vscode from "vscode";
import * as def from "./definitions";
import { boolUtils } from "./booleans";
import { vscUtils } from "./vscUtils";
import { RegExBuilder } from "./regExBuilder";
import { Position } from "vscode";
import * as menu from "./menus";


import { universalCodonMap, condensedAmbig, ambigMap, AmbigCodon, tableIndex, rareCodonMap  } from "./codons";
const path = require('path');

export class HoverObj{ 
    private static instance: HoverObj;
    private regi = new RegExBuilder(true);
    
    private DEFAULT_ALPHABET: menu.HoverAlphabet = "Ambiguous"

    private print = vscUtils.print;
    private currAlpha: menu.HoverAlphabet = this.DEFAULT_ALPHABET; // Default mode
    private activeToken: def.ColorRule | undefined;
    
    constructor() {
        this.print("HoverObj initialized");
        this.initAlpha();
    }
    
    private getTextEditor(): vscode.TextEditor{
        return vscode.window.activeTextEditor!;
    } 

    public static refHoverObj(): HoverObj {
        if (!HoverObj.instance) {
            HoverObj.instance = new HoverObj();
        }
        return HoverObj.instance;
    }
     
    private initAlpha(): void {
        const storedAlpha = vscode.workspace.getConfiguration().get<menu.HoverAlphabet>("bioNotation.alphabet");
        if (storedAlpha) {
            this.currAlpha = storedAlpha;
        }
    }

    public getCurrAlpha(): menu.HoverAlphabet {
        const storedAlpha = vscode.workspace.getConfiguration().get<menu.HoverAlphabet>("bioNotation.alphabet");
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

    public provideLetterInfo(doc : vscode.TextDocument, pos: Position){
            // const word = doc.getText(doc.getWordRangeAtPosition(pos));
            const line = doc.lineAt(pos.line).text;
            
            const letter = line[pos.character].toUpperCase(); // const letter = word[pos.character];
                if (!letter) return;
            
            const description = def.arrayToStr(this.getDescription(letter, doc.fileName));
            return this.onHover(description, pos);
    }



    public isAmbig(codon: string){
        for(const each of condensedAmbig){
            if(this.codonMatch(this.normalizeCodon(each), codon)){
                return true;
            }
        }
        return false;
    }
    
    public provideCodonInfo(doc : vscode.TextDocument, pos: Position){
        const editor = this.getTextEditor();
        if(editor && editor.selection && !editor.selection.isEmpty){
            const selectedText = doc.getText(editor.selection);
            if(selectedText.length === 3 && /^[ACGTURYKMSWBDHVN]+$/i.test(selectedText)){
                // const codon = selectedText.toUpperCase().replace(/T/g, "U");
                const codon = selectedText.toUpperCase();
                if (codon === "NNN") {
                    return this.onHover("⚠ Input is fully ambiguous (NNN) — cannot resolve amino acid", pos);
                }
                const amino = this.resolveUniversalCodon(codon, doc.fileName);
                if(amino){
                    return this.onHover(`🛡️ Universal Codon\nAmino Acid: ${amino}`,pos);
                }
                const possibles = this.resolveAmbiguousCodon(codon);
                if (possibles.length > 0) {
                    const joined = possibles.join('\n');
                    return this.onHover(`⚠ Ambiguous Codon\nPossible Amino Acids:\n${joined}`, pos);
                }

                const rare = this.resolveRareCodon(codon);
                if (rare.length > 0) {
                    const joined = rare.join(', ');
                    return this.onHover(`⚗ Rare Codon\nTypically maps to: ${joined}`, pos);
                }
            }
        } 

    }

    public registerProvider(): void {
        vscode.languages.registerHoverProvider('fasta', {
            provideHover: (doc : vscode.TextDocument, pos: Position): vscode.Hover | undefined => { // provideHover(document, position/*, token*/) {//Token should only be used for async hovers which allow cancellation of hover logic
                try{
                    if (this.currAlpha === "Nucleotides" /*|| boolUtils.isFna(fileName)*/) {
                        const codonHover = this.provideCodonInfo(doc, pos);
                        if (codonHover) return codonHover;
                    }
                    return this.provideLetterInfo(doc,pos);
                }catch(err){
                    this.print("Error in hoverOver.ts: " + err);
                    
                    if (process.env.NODE_ENV === 'development') {
                        console.error("Error: Not in AminoMap", err);
                    }
                    return;
                }
            }
        });
    }

    public async setAlphabet(selection: menu.HoverAlphabet){
        this.currAlpha = selection;
        await vscode.workspace.getConfiguration().update(
            "bioNotation.alphabet",
            selection,
            vscode.ConfigurationTarget.Workspace
            );
        this.print(`BioNotation alphabet mode set to: ${selection}`);
    }

    public async switchAlphabets(selection: menu.HoverAlphabet) {
        if (selection === "Ambiguous" || selection === "Nucleotides" || selection === "Aminos") {
           await this.setAlphabet(selection);
        }else{
            this.print("Error: no valid Alphabet selection\n",
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

    private normalizeCodon(codon: string): string {
        return this.regi.genNukeRegEx(codon, false, false);
    }
    /**
     * Resolves a 3-letter codon to a universal amino acid symbol using universalCodonMap.
     * Returns null if codon is ambiguous or not found.
     */
    public resolveUniversalCodon(codon: string, fileName: string): string | null {
            for (const [amino, codons] of Object.entries(universalCodonMap)) {
                for (const rule of codons) {
                    if (this.codonMatch(rule, codon)) {
                        return amino;
                    }
                }
            }
        return null;
    }
    
    public codonMatch(pattern : string, codon : string){
        const normalPat = this.normalizeCodon(pattern);
        const literal = codon.toUpperCase();
        const regex = new RegExp(`^${normalPat}$`, 'i');
        vscUtils.print(`Testing ${literal} against pattern = ${normalPat}`);
        return regex.test(literal);
    }

    private isWildcardCodon(codon: string): boolean {
        const cleaned = codon.toUpperCase();
        return /[NBDHV]/.test(cleaned) && cleaned !== "NNN";
    }

    private fillAmbigEntries(ambigEntry: Record<string, number[]>, results : string[]){
        const tableCount = tableIndex.length;
            for (const [amino, indexes] of Object.entries(ambigEntry)) {
                const percent = Math.round((indexes.length / tableCount) * 100);
                results.push(`${amino} (${indexes.length}/${tableCount} tables → ${percent}%)`);
            }
        }

    public resolveAmbiguousCodon(codon: string): string[] {
        const results: string[] = [];
        
        const isWild = this.isWildcardCodon(codon);
        if (isWild) {
            results.push("⚠ Wildcard Codon (contains extended alphabet)\n— matches may be broader than usual");
        }

        for (const key of Object.keys(ambigMap)) {
            const shouldMatch = isWild
                ? this.codonMatch(codon, key)    // user input is the pattern
                : this.codonMatch(key, codon);   // key is the pattern

            if (!shouldMatch) continue;
                    
            const entry = ambigMap[key as AmbigCodon];
            if (!entry) continue;

            vscUtils.print(`Testing ${codon} against pattern = key:${key}`);
            this.fillAmbigEntries(entry!,results);
                
            vscUtils.print(`User codon ${codon} matched ambiguous pattern ${key}`);
            }
        return results.sort((a, b) => {
            const getFreq = (s: string) => parseInt(s.split('/')[0].match(/\d+$/)?.[0] || "0");
            return getFreq(b) - getFreq(a);
        });
        // return [...new Set(matches)];
    } 

    // public resolveAmbiguousCodonORI(codon: string): string[] {
    //     const results: string[] = [];
        
    //     for (const [pattern, ambigEntry] of Object.entries(ambigMap)) {
    //         if (this.codonMatch(pattern, codon)) {
    //             vscUtils.print(`Testing ${codon} against pattern = ${pattern}`);
    //             const tableCount = tableIndex.length;
    //             for (const [amino, indexes] of Object.entries(ambigEntry)) {
    //                 const percent = Math.round((indexes.length / tableCount) * 100);
    //                 results.push(`${amino} (${indexes.length}/${tableCount} tables → ${percent}%)`);
    //             }
    //         }
    //     }
    //     return results.sort((a, b) => {
    //         const getFreq = (s: string) => parseInt(s.split('/')[0].match(/\d+$/)?.[0] || "0");
    //         return getFreq(b) - getFreq(a);
    //     });
    //     // return [...new Set(matches)];
    // }

    public resolveRareCodon(codon: string): string[] {
        const results: string[] = [];
        
        const isWild = this.isWildcardCodon(codon);
        if (isWild) {
            results.push("⚠ Wildcard Codon (contains extended alphabet)\n— matches may be broader than usual");
        }

       for (const [amino, patterns] of Object.entries(rareCodonMap)) {
            for (const pattern of patterns) {
                 const shouldMatch = isWild
                ? this.codonMatch(codon, pattern)   // user input is the pattern
                : this.codonMatch(pattern, codon);  // pattern is the pattern

                if (shouldMatch)  {
                    results.push(amino); // No need to deduplicate unless maps overlap
                }
            }
        }
        return [...new Set(results)];
    }
}
//     public resolveUniversalCodon(codon: string, fileName: string, Map: Record<string, string[]>): string | null {
//         const literal = codon.toUpperCase().replace(/T/g, "U"); // literal input, not regex
//         // const normalized = this.normalizeCodon(codon);

//         for (const [amino, codons] of Object.entries(Map)) {
//             for (const rule of codons) {
//                 const pattern = this.normalizeCodon(rule); // rule = e.g. \"AGR\"
//                 vscUtils.print(`Testing ${literal} against ${rule} → pattern = ${pattern}`);
//                 const regex = new RegExp(`^${pattern}$`, "i");
//                 if (regex.test(literal)) {
//                     return amino;
//                 }
//             }
//             return null;
//         }
//         return null;
//     }
// }



export default HoverObj.refHoverObj();