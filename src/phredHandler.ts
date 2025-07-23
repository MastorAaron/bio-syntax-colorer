import * as vscode from "vscode";
import {vscUtils} from "./vscUtils"
import {boolUtils} from "./booleans"
import * as menu from "./menus";
import * as def from "./definitions";
import { PatchColors } from "./patch";
import { stat } from "node:fs";


export const fullPhredTypes = [ 
           "Sanger (Phred+33)", 
    "Illumina 1.3+ (Phred+64)", 
    "Illumina 1.5+ (Phred+64)", 
    "Solexa (Phred+64)", 
//     Illumina 1.5
// Same as 1.3 but with dummy quality scores for unaligned bases using B.
// This throws off basic regex rules because B has to be handled as “special.”
    "Nanopore (Phred+33)",
    "Illumina 1.8+ (Phred+33)",
    "ElemBio AVITI (Phred+33)",
    "PacBio (Phred+33)",

    // Oxford Nanopore, PacBio
    // Solexa (before Illumina adopted Phred)

    ] as const;

export const phredTypes = ["Phred+33","Phred+64"]
export type PhredType    = (typeof phredTypes)[number];
export type FullPhredType    = (typeof fullPhredTypes)[number];
export const DEFAULT_PHRED: PhredType = "Phred+33"; //"Illumina 1.8+ (Phred+33)";

export const phredEncodingMap: Record<PhredType, {
    scoreRange: [number, number];
    splitRanges: [number, number][];
    ASCIIrange: [string, string];
    ASCIIregEx: [string, string, string];
}> = {
    "Phred+33": {
        "scoreRange":  [0, 41],
        "splitRanges": [[0,19], [20,29], [30,41]],
        
        "ASCIIrange": ['!','J'],
        "ASCIIregEx": ["[!-4]", "[5->]", "[?-J]"]
        },
    "Phred+64": {
        "scoreRange":  [-5, 40], 
        "splitRanges": [[-5, 19], [20,29], [30,40]],

        "ASCIIrange": [';','i'],
        "ASCIIregEx": ["[;-S]", "[T-]]", "[^-n]"]
    } 
}

// return this.onHover(`
// Quality Character: 'I'
// Phred Score (Phred+33): 40
// Confidence Level: 🟢 High
// `, pos);

const qualities = {
    low  : 0,
    mid  : 1,
    high : 2
}

export class PhredHover{
    private medals = ['🥉' , '🥈' , '🥇'];
    private offset!: number;
    
    private qualityColors!: Record<PhredType,def.ColorHex[]>;
    private activePhredDecorations: vscode.TextEditorDecorationType[] = [];

    private currPhred: PhredType = DEFAULT_PHRED; // Default mode
    private debugOverlayEnabled = true; // Toggle for debug overlay

    private phredStatusBarItem?: vscode.StatusBarItem;


    constructor(phred?: PhredType, private patcher?: PatchColors) { 
        const stored = vscode.workspace.getConfiguration().get<PhredType>("bioNotation.phred");
        this.currPhred = stored || DEFAULT_PHRED;
        this.extractOffset(); // still safe
    }

    // showGENERICStatusBar(statusBarItem : any, pos : number, commandBool : any, toolTip : string, buttonText: string) {
    //     if(!statusBarItem){
    //         statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, pos);
    //         statusBarItem.command = commandBool; // optional
    //     }
    //     statusBarItem.text = `$(symbol-variable) ${buttonText}`;
    //     statusBarItem.tooltip = toolTip;
    //     statusBarItem.show();
    //     return statusBarItem;
    // }

    private shortenPhred(phred: menu.HoverAlphabet): string { 
        const shortPhredRec : Record<PhredType | FullPhredType, string> = {
                   "Sanger (Phred+33)" : "Sanger+33", 
                            "Phred+33" : "+33", 
                            "Phred+64" : "+64", 
            "Illumina 1.3+ (Phred+64)" : "Illu+64 1.3+", 
            "Illumina 1.5+ (Phred+64)" : "Illu+64 1.5+", 
                   "Solexa (Phred+64)" : "Solexa+64" , 
                 "Nanopore (Phred+33)" : "Nano+33",
            "Illumina 1.8+ (Phred+33)" : "Illu+33 1.8+",
            "ElemBio AVITI (Phred+33)" : "ElmBioAVITI+33",
                   "PacBio (Phred+33)" : "PacBio+33"
        }

        return shortPhredRec[phred] || "???";

    }

    public showPhredStatusBar() {
        if (!this.phredStatusBarItem) {
            this.phredStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            this.phredStatusBarItem.command = "bioNotation.selectQualityType"; // optional
        }
        this.phredStatusBarItem.text = `$(symbol-variable) Phred: ${this.currPhred}`;
        this.phredStatusBarItem.tooltip = "Click to toggle Phred encoding (+33/+64)";
        this.phredStatusBarItem.show();
    }
    
    private async getStoredPhred(): Promise<PhredType> {
        //duped logic for getting currAlpha in HoverOver
        return vscode.workspace.getConfiguration().get<PhredType>("bioNotation.phred") as PhredType;
        // return vscUtils.getFlagVal<fred.PhredType>("bioNotation.phred")!;
    }
    
    private async setStoredPhred(val: PhredType): Promise<void> {
        await vscUtils.updateFlag("bioNotation.phred",val);
    }

    public async initPhred(): Promise<void> {
        let storedPhred = await this.getStoredPhred();
        
        if(!storedPhred) {
            storedPhred = DEFAULT_PHRED;
            await this.setStoredPhred(storedPhred);
        }

        this.currPhred = storedPhred;
        this.extractOffset();
        this.setColors();
        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscUtils.print("No active editor for Phred overlay.");
            return;
        }
        this.applyPhredOverlay(editor);
    }

    private retrieveActiveColors(): def.ColorRule[] {
        const config = vscUtils.editorConfig();
        const textMateRules = config.get<def.ColorRule[]>("editor.tokenColorCustomizations.textMateRules") || [];
        const rules = textMateRules.filter(rule => rule.scope?.includes("phred"));
        
        return rules;

        // const phredColor = tokenColors?.textMateRules?.find((rule: any) =>
        //     Array.isArray(rule.scope)
        //         ? rule.scope.includes("source.fasta.phredLine")
        //         : rule.scope === "source.fasta.phredLine"
        // )?.settings?.foreground ?? "#999999";
    }

    public async phredChoice(): Promise<PhredType | undefined> {
        const phredChoice = await vscUtils.showInterface([...phredTypes, "Default Phred+33"], "Select or type Phred Type");
        if(phredTypes.includes(phredChoice as PhredType)){
            return phredChoice;
        }else{
            vscUtils.print("[phredChoice]: INVALID");
            return DEFAULT_PHRED;
        }
    }

    public async changePhred(editor: vscode.TextEditor): Promise<void> {
        const newPhred = await this.phredChoice();
        if(newPhred && newPhred !== this.currPhred) {
            await this.setPhred(newPhred);
            this.clearPhredOverlay(editor);
            this.applyPhredOverlay(editor);
            this.showPhredStatusBar();
            vscUtils.print(`[changePhred] Changed to ${newPhred}`);
        } else {
            vscUtils.print("[changePhred] No change made.");
        }
        this.showPhredStatusBar(); // ✅ refresh phred label
    }

    private setColors(){
        const rules = this.retrieveActiveColors();
        this.isolatePhredRules(rules);
    }
    
    private isolatePhredRules(rules : def.ColorRule[]): void {
        let qualityColors: Record<PhredType, def.ColorHex[]> = {
            "Phred+33": [],
            "Phred+64": []
        };
    
        for(const rule of rules){
            if(rule.scope?.includes("phred33")){
                const currColor = rule.settings.foreground;
                qualityColors["Phred+33"].push(currColor as def.ColorHex);
                vscUtils.print(`[isolatePhredRules] was Phred+33 rule: ${rule.name}`);
            }else if(rule.scope?.includes("phred64")){
                vscUtils.print(`[isolatePhredRules] was Phred+64 rule: ${rule.name}`);
                const currColor = rule.settings.foreground;
                qualityColors["Phred+64"].push(currColor as def.ColorHex);
            }else{
                continue;
            }
        }
        this.qualityColors = qualityColors;
    }

    private phredTextDec(textColor : def.ColorHex): vscode.TextEditorDecorationType {
        return vscode.window.createTextEditorDecorationType({
            color: textColor,
            isWholeLine: false,
            overviewRulerColor: textColor,
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    }

    public clearPhredOverlay(editor: vscode.TextEditor): void {
        for (const dec of this.activePhredDecorations) {
            editor.setDecorations(dec, []);
        }
    }

    public debugOverlay(line: number, col: number, char: string, score: number, tier: "Low" | "Mid" | "High" | "Invalid") {
        if (!this.debugOverlayEnabled) return;
        
        try {
            const pos = `(${line}, ${col})`;
            const message = `[Overlay Debug] ${pos} '${char}' → score=${score}, tier=${tier}`;
            vscUtils.print(message);
        } catch (err) {
            vscUtils.print(`[Overlay Debug ERROR] ${err}`);
        }
    }

    public applyPhredOverlay(editor: vscode.TextEditor) {
        const doc = editor.document;
        const config = vscUtils.editorConfig();

        const [lowColor, midColor, highColor] = this.qualityColors[this.currPhred];
        const lowDec = this.phredTextDec(lowColor);
        const midDec = this.phredTextDec(midColor);
        const highDec = this.phredTextDec(highColor);

        
        const lowRanges: vscode.DecorationOptions[] = [];
        const midRanges: vscode.DecorationOptions[] = [];
        const highRanges: vscode.DecorationOptions[] = [];
        
        
        let tier: "Low" | "Mid" | "High" | "Invalid" = "Invalid";
        for(let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
            if(this.probsPhredLine(doc, lineNum)){
                const text = doc.lineAt(lineNum).text;
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const score = this.deterPhredScore(char);
                    
                    const range = new vscode.Range(lineNum, i, lineNum, i + 1);
                    // const hoverMessage = this.providePhredInfo(char);
                    
                    const decoration: vscode.DecorationOptions = {
                        range
                        // hoverMessage
                    };
                    
                    if(this.isLow(score)) {
                        lowRanges.push(decoration);
                        tier = "Low";
                    }else if(this.isMid(score)) {
                        midRanges.push(decoration);
                        tier = "Mid";
                    }else if(this.isHigh(score)) {
                        highRanges.push(decoration);
                        tier = "High";
                    }else{
                        vscUtils.print(`[applyPhredOverlay] Error: Invalid Phred score for char '${char}' at line ${lineNum}`);
                    } 
                    this.debugOverlay(lineNum, i, char, score, tier);
                }
            }
        }
        editor.setDecorations(lowDec, lowRanges);
        editor.setDecorations(midDec, midRanges);
        editor.setDecorations(highDec, highRanges);
        vscUtils.print("BioNotation activated Phred Score Text Color Overlay.");
        vscUtils.print(`[Overlay] Using ${this.currPhred} colors: ${JSON.stringify(this.qualityColors[this.currPhred])}`);
        this.activePhredDecorations = [lowDec, midDec, highDec];
    }

    private is4thLine(doc : vscode.TextDocument, lineNum: number){
        if(lineNum % 4 === 3) return true;

        const scaledIndex = this.getNonSkipIndex(doc, lineNum);
        return scaledIndex % 4 === 3;
    }

    private getNonSkipIndex(doc : vscode.TextDocument, lineNum: number): number{
        let index = 0;
        for(let i=0; i<=lineNum; i++){
            const text = doc.lineAt(i).text;
            if(!this.skipLine(text)){
                index++
            }
        }
        return index - 1;
    }

    public ASCIIrange(fred : PhredType): [string, string]{
        return phredEncodingMap[fred].ASCIIrange;
    }

    private isPlusLine(line : string){
        return /^\+(\s?[a-zA-Z0-9_.:-]+)?$/.test(line)
    }

    private skipLine(str : string){
        return (str === ""|| str.startsWith("#")|| str.startsWith("@")|| str.startsWith(">"));
    }

    private findNthValidLine(doc: vscode.TextDocument, lineNum: number, n: number): string | undefined {
        let found = 0;

        for(let i = lineNum - 1; i >= 0; i--) {
            const line = doc.lineAt(i).text.trim();
            if(this.skipLine(line)) continue;

            found++;
            if(found === n) {
                return line;
            }
        }
        return undefined;
    }

    private prevIsPlusLine(doc : vscode.TextDocument, lineNum: number){
        const prev = this.findNthValidLine(doc,lineNum,1);
        return prev ? this.isPlusLine(prev) : false;
    } 
    
    private probsSeqLine(line : string){
        return /[FLEIQZJPOXfleiqzjpox]{6,}/.test(line) ||/[ACGTUNacgtun]{8,}/.test(line);
    }

    private prevIsSeqLine(doc : vscode.TextDocument, lineNum: number):string | undefined{
        const prev = this.findNthValidLine(doc, lineNum, 2);
        return(prev && this.probsSeqLine(prev)) ? prev : undefined;
    }

    public probsPhredLine(doc : vscode.TextDocument, lineNum : number): boolean{//Score Heuristic
        if(!boolUtils.isFastqFile(doc.fileName)) return false;

        const line = doc.lineAt(lineNum).text;
        if(line.length === 0) return false;
        let score = 0;
        
        const susChars : Record<PhredType, RegExp> = {
            "Phred+33": /[K-Z]|[a-z]/, //if aminos exist in seqLine or lowerCase nukes/aminos
            "Phred+64": /[i-z]/       //potential lowercase letters from seqLine, edge case but helps
        }
        if(susChars[this.currPhred].test(line))     return false;

        //1. 4th line
        if(this.is4thLine(doc,lineNum)) score++

        //2. Valid ASCII range for currPhred
        const [start, end] = this.ASCIIrange(this.currPhred);
        const ASCIImatch = new RegExp(`^[${start}-${end}]+`);
        if(ASCIImatch.test(line)) score++;

        //4. Prev NonBlank Line is a '+'plusLine
        if(this.prevIsPlusLine(doc, lineNum)) score++;
        
        //5. Second Prev NonBlank Line is The SeqLine
        const seqLine = this.prevIsSeqLine(doc, lineNum);
        if(seqLine) score++;

        //6 SeqLine's length is same length 
        if(seqLine && seqLine?.trim().length ==line.trim().length) score++;
    
        vscUtils.print(`[Overlay] Line ${lineNum+1} is${(score >=4) ? '' : ' not'} a Phred line`);
        return score >=4;
    }

    public async setPhred(newType: PhredType) {
        this.currPhred = newType;
        this.extractOffset();
        await this.setStoredPhred(newType);
    }


    public getCurrPhred(): PhredType {
        //duped logic for getting currAlpha in HoverOver
        const storedPhred = vscode.workspace.getConfiguration().get<PhredType>("bioNotation.phred");
        return storedPhred || this.currPhred;
    }
    
    public providePhredInfo(letter : string){
        const phredScore = this.deterPhredScore(letter);
        const scoreLevel = this.deterQuality(phredScore)
        const medal = this.deterMedal(scoreLevel);
        return [
            `Quality Character '${letter}'`,
            `Phred Score ${this.currPhred}: ${phredScore}`,
            `Confidence Level: ${medal} ${scoreLevel}`
        ].join('\n');
    }

    private extractOffset(){
        if(this.currPhred!.includes("33")){
            this.offset = 33;
        }else if(this.currPhred!.includes("64")){
            this.offset = 64;
        }else{
            vscUtils.print("error [OFFSET]: invalid");
        }
    }

    private ASCII_to_int(ascii : string){
        return ascii.charCodeAt(0);
    }

    private ASCII_to_Phred(ascii : string, offset : number){
        return this.ASCII_to_int(ascii) - offset;
    }

    public int_to_ASCII(int : number){
        return String.fromCharCode(int);
    }

    public deterPhredScore(charASCII: string): number{
        return this.ASCII_to_Phred(charASCII,this.offset);
    }

    private isLow(score: number): boolean {
        const [low, mid, high] = phredEncodingMap[this.currPhred].splitRanges;
        return score >= low[0] && score <= low[1];
    }

     private isMid(score: number): boolean {
        const [low, mid, high] = phredEncodingMap[this.currPhred].splitRanges;
        return score >= mid[0] && score <= mid[1];
    }

     private isHigh(score: number): boolean {
        const [low, mid, high] = phredEncodingMap[this.currPhred].splitRanges;
        return score >= high[0] && score <= high[1];
    }

    public phredRangeToRegex(start : number, end : number, offset : number){
        const from = this.int_to_ASCII(start+offset);
        const to = this.int_to_ASCII(end+offset);
        return `[${from}-${to}]`;
    }

    public PhredRangeWrapper(numRanges: [number[],number[],number[]], offset : number){
        let obj;
        for(const nums of numRanges){
            const start = nums[0];
            const end = nums[1];
            obj = this.phredRangeToRegex(start, end, offset);
            console.log(obj);
        }
        return obj
    }

    private deterMedal(quality : string): string{
        switch(quality){
            case "Low":
                return this.medals[0];
            case "Mid":
                return this.medals[1];
            case "High":
                return this.medals[2];
            default:
                return ""
        }
    }
    
    private deterQuality(phredScore : number): string{
        if(this.isLow(phredScore)){
            return "Low";
            
        }else if(this.isMid(phredScore)){
            return "Mid";
            
        }else if(this.isHigh(phredScore)){
            return "High";

        }else{
            return "";
        } 
    }
}
// export { PhredHover, DEFAULT_PHRED, phredTypes };
// export const __test__ = { PhredHover };