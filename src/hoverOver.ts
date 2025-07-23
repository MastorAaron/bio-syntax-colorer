import * as vscode from "vscode";
import * as def from "./definitions";
import { FilePath } from "./fileMeta";
import { boolUtils } from "./booleans";
import { vscUtils } from "./vscUtils";
import { RegExBuilder } from "./regExBuilder";
import { Position } from "vscode";
import * as menu from "./menus";
import * as fred from "./phredHandler"
import { PhredHover, PhredType } from "./phredHandler"

import { universalCodonMap, condensedAmbig, ambigMap, 
    AmbigCodon, tableIndex, rareCodonMap  } from "./codons";
import { isAscii } from "node:buffer";
const path = require('path');



export class HoverObj{ 
    private DEFAULT_ALPHABET: menu.HoverAlphabet = "Ambiguous"
    private currAlpha: menu.HoverAlphabet = this.DEFAULT_ALPHABET; // Default mode
    
    private phredStatusBarItem?: vscode.StatusBarItem;


    private static instance: HoverObj;
    public fredo: PhredHover = new PhredHover();
    private regi: RegExBuilder = new RegExBuilder(true);
    
    private print = vscUtils.print;
    
    constructor() {
        this.print("HoverObj initialized");
        this.initAlpha();
        this.initFredo();
    }
    
    private getTextEditor(): vscode.TextEditor{
        return vscode.window.activeTextEditor!;
    }
    
    private shortenAlpha(alpha: menu.HoverAlphabet): string { 
        const shortAlphaRec : Record<menu.HoverAlphabet, string> = {
            "Nucleotides": "Nts",
            "Aminos": "AAs",  
            "Ambiguous": "Ambig"
        }

        return shortAlphaRec[alpha] || "alpha";

    }

    public showAlphaStatusBar() {
        if (!this.phredStatusBarItem) {
            this.phredStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            this.phredStatusBarItem.command = "bioNotation.toggleAlphabet"; // optional
        }
        this.phredStatusBarItem.text = `$(beaker) Lang: ${this.shortenAlpha(this.currAlpha)}`; //🧬
        this.phredStatusBarItem.tooltip = "Click to toggle DNA/Protein Alphabets";
        this.phredStatusBarItem.show();
    }

    public static refHoverObj(): HoverObj {
        if (!HoverObj.instance) {
            HoverObj.instance = new HoverObj();
        }
        
        return HoverObj.instance;
    }
     
    private async initAlpha(): Promise<void> {
        const storedAlpha = await menu.getStoredAlpha();
        if (storedAlpha) {
            this.currAlpha = storedAlpha;
        }
    } 

    private async initFredo(): Promise<void> {
        this.fredo = new PhredHover();
        await this.fredo.initPhred();  
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
    
    // private createScoreHover(letter: string){
    //     const phredObj = new PhredHover(letter, this.currPhred);
    //     return [
    //     `Quality Character ${letter}`,
    //     `Phred Score ${phredObj.currPhred}: ${phredObj.phredScore}`,
    //     `Confidence Level: ${phredObj.medal} ${phredObj.scoreLevel}`
    //     ].join();
    // }

    // private probsPhredLine(doc: vscode.TextDocument, lineNum: number): boolean {
    //     if(!boolUtils.isFastqFile(doc.fileName)) return false; //May be too strict

    //     const currLine = doc.lineAt(lineNum).text;
    //     const prevLine = lineNum > 0 ? doc.lineAt(lineNum - 1).text : "";


    //     const isAscii = /^[!-~]{10,}$/.test(currLine );
    //     const probsLine4 = (lineNum % 4 === 3);
    //     const looksLikeNukes  = !/[ACGTUNacgtun]{10,}/.test(currLine );
    //     const looksLikeAminos = !/[EeQqZzFfLlIiJjPpOoXx]{10,}/.test(currLine );//Too strict? Ascii has these values too what if everything is really high score?

    //     const notAlpha = (this.currAlpha=="Ambiguous")? true :((this.currAlpha=="Aminos")? looksLikeAminos  : looksLikeNukes );

    //     return isAscii && probsLine4 && notAlpha;  // FASTQ line 4: quality line
    // }

    public provideSingleCharInfo(doc : vscode.TextDocument, pos: Position){
        const line = doc.lineAt(pos.line).text; // const word = doc.getText(doc.getWordRangeAtPosition(pos));
            
        const letter = line[pos.character].toUpperCase(); // const letter = word[pos.character];
            if (!letter) return;

        if((this.isNukes(doc) || this.currAlpha === "Ambiguous") && this.fredo.probsPhredLine(doc, pos.line) ){
            return this.providePhredInfo(letter, doc, pos);
        }else{
            return this.provideLetterInfo(letter, doc, pos);
        }    
    }

    public provideLineLength(doc : vscode.TextDocument, pos: Position){
        const sel = vscode.window.activeTextEditor?.selection;
        if (sel && !sel.isEmpty && sel.contains(pos)) {
            const len = sel.end.character - sel.start.character;
            if((len > 3 )){
                if(this.isNukes(doc) && len > 9){
                    return new vscode.Hover(`🔢: ${len} bp likely ${Math.floor(len / 3)} codons`);
                }else if(this.isNukes(doc) && len < 9){
                    return new vscode.Hover(`🔢: ${len} bp`);
                }else if(this.isAminos(doc)){
                    return new vscode.Hover(`🔢: ${len} aa`);
                }else{
                    return new vscode.Hover(`🔢: ${len}`);
                }
            }
        }
        return undefined;
    }

    public countGC(str : string, allowExtended: boolean = false){
        let g=0; let c=0; let s=0; let other=0;
        let wild=0;
        for(const char of str){
            const each = char.toUpperCase();
            if(each == 'G')
                g++;
            if(each == 'C')
                c++;
            if(each == 'S')
                s++;
            if(allowExtended && ['R','Y'].includes(each))
                wild++;
            else
                other++;
        }
        const total = g+c+s+other+wild;
        return (total > 0) ? ((g+c+s+wild)/total) : 0;
    }

    public provideGCCount(doc : vscode.TextDocument, pos: Position, allowExtended: boolean = false){
        const editor = vscode.window.activeTextEditor
        const sel = editor?.selection;
        
        if(sel && !sel.isEmpty && sel.contains(pos)){
            const selectedText = doc.getText(sel);
            if(selectedText.length > 2){
                const gc = this.countGC(selectedText, allowExtended);
                const pct = (gc * 100).toFixed(2);
                return new vscode.Hover(`🧪 GC Content: ${pct}%`);
            }
        }
        return undefined;
    }

    public provideLetterInfo(letter : string, doc : vscode.TextDocument, pos: Position){
        const description = def.getDescription(letter, this.currAlpha, doc.fileName as FilePath);
        return this.onHover(description, pos);
    } 
    
    public providePhredInfo(letter : string, doc : vscode.TextDocument, pos: Position){
        const hoverText = this.fredo.providePhredInfo(letter);
        return this.onHover(hoverText, pos);
    }

    public isAmbig(codon: string){
        for(const each of condensedAmbig){
            if(this.codonMatch(this.normalizeCodon(each), codon)){
                return true;
            }
        }
        return false;
    }
    
    private isRare(amino: string) {
        return rareCodonMap.keys.forEach(key => {
            (this.codonMatch(this.normalizeCodon(key), amino))
        })
    }

    public async setAlphabet(selection: menu.HoverAlphabet){
        this.currAlpha = selection;
        this.showAlphaStatusBar();
        await vscode.workspace.getConfiguration().update(
            "bioNotation.alphabet",
            selection,
            vscode.ConfigurationTarget.Workspace
            );
        // this.print(`BioNotation alphabet mode set to: ${selection}`);
        menu.printSelectionAlpha(selection);
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

    private normalizeCodon(codon: string): string {
        return this.regi.genNukeRegEx(codon, false, false);
    }
    /**
     * Resolves a 3-letter codon to a universal amino acid symbol using universalCodonMap.
     * Returns null if codon is ambiguous or not found.
     */
    public resolveUniversalCodon(codon: string): string | null {
            for (const [amino, codons] of Object.entries(universalCodonMap)) {
                for (const rule of codons) {
                    if (this.codonMatch(rule, codon)) {
                        return this.expand(amino);
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
        return /[NBDHVRY]/.test(cleaned) && cleaned !== "NNN";
    }

    private fillAmbigEntries(ambigEntry: Record<string, number[]>, results : string[]){
        const tableCount = tableIndex.length;
        for (const [amino, indexes] of Object.entries(ambigEntry)) {
            if(indexes.length === 0){
                results.push(`Maps to ${this.expand(amino)} under certain contexts`);
            }else{
                const percent = Math.round((indexes.length / tableCount) * 100);
                results.push(`${this.expand(amino)} (${indexes.length}/${tableCount} tables → ${percent}%)`);
            }
        }
    }
    private isNukes(doc : vscode.TextDocument){
        return this.currAlpha === "Nucleotides" || boolUtils.isFna(doc.fileName);
    }
    
    private isAminos(doc : vscode.TextDocument){
        return this.currAlpha === "Aminos" || boolUtils.isFaa(doc.fileName);
    }

    public registerProvider(): void {
        vscode.languages.registerHoverProvider(['fasta', 'fastq', 'fastx'], {
            provideHover: (doc : vscode.TextDocument, pos: Position): vscode.Hover | undefined => { // provideHover(document, position/*, token*/) {//Token should only be used for async hovers which allow cancellation of hover logic
                try{
                    this.provideLineLength(doc,pos);
                    if (this.isNukes(doc)) {
                        const codonHover = this.provideCodonInfo(doc, pos);
                        if (codonHover) return codonHover;
                    }
                    return this.provideSingleCharInfo(doc,pos);
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
            
            const blocks: string[] = [];
            const isWild = this.isWildcardCodon(codon)
            if (isWild) {
                blocks.push("⚠ Contains Extended Alphabet\n— matches may be broader than usual");
            }

            const rare = this.resolveRareCodon(codon, isWild);
            if(rare.length > 0){
                const canonical = rare.map(r => r.toLowerCase());
                if (canonical.includes('w') || canonical.includes('trp') || canonical.includes('tryptophan')) {
                    blocks.push(`⚗ Rare Codon`);
                }else{
                    blocks.push(`⚗ Rare Codon\nContextually maps to: ${rare.join(',\n')}`);
                }
            }
           
            const univAmino = this.resolveUniversalCodon(codon);
            if(univAmino){ 
                blocks.push(`⛨ Universal Codon\nAmino Acid: ${univAmino}`);
                return this.onHover(blocks.join('\n'), pos);
            }
            
            const ambigPossibles = this.resolveAmbiguousCodon(codon, isWild);
            if(ambigPossibles.length > 0)  blocks.push(`⚠ Ambiguous Codon\nPossible Amino Acids:\n${ambigPossibles.join(',\n')}`);
            
            
            if (blocks.length > 0) return this.onHover(blocks.join('\n\n'), pos);

            // Fallback: No hits
            return this.onHover("⚠ Unknown codon — no match found", pos);
            }
        }
    } 

    public resolveAmbiguousCodon(codon: string, isWild: boolean): string[] {
        const results: string[] = [];

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

    public expand(amino: string): string{
        return def.aminoInfoMap[amino as def.aminos][1];
    }

    public resolveRareCodon(codon: string, isWild: boolean): string[] {
        const results: string[] = [];
        
       for (const [amino, patterns] of Object.entries(rareCodonMap)) {
            for (const pattern of patterns) {
                const shouldMatch = isWild
                ? this.codonMatch(codon, pattern)   // user input is the pattern
                : this.codonMatch(pattern, codon);  // pattern is the pattern

                if (shouldMatch)  {
                    results.push(this.expand(amino)); // No need to deduplicate unless maps overlap
                }
            }
        }
        return [...new Set(results)];
    }
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