/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
*/

// import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { vscUtils, themeUtils, Neons } from "./vscUtils";
import { PatchColors, getPatcherInstance, initPatcher } from "./patch";
import { PaletteGenerator } from "./paletteGen";
import { ColorFile, LangParams, PaletteParams } from "./ruleWriter";
import * as rW from "./ruleWriter";
import { LangFileEditor, LangGenerator } from "./langGen";

import * as def from "./definitions";
import { HLight, HLSelect } from "./definitions";
import hoverOver from './hoverOver';
import { config } from "process";

const DEFAULT_PALETTE = "fasta-colors-warm.json";

export type Theme = 
    // "Default" |
    "Warm" |
    "Cool" | 
    "Cold" ;
    // "CoolComp" |
    // "CoolInvert";

const PaletteMap: Record<Theme, ColorFile> = {
    // "Default": "fasta-colors.json"as def.PaletteFilePath,
    "Warm": "fasta-colors-warm.json"as ColorFile,
    "Cool": "fasta-colors-cool.json"as ColorFile,
    "Cold": "fasta-colors-cold.json"as ColorFile
    // "CoolComp": "fasta-colors-cold-comp.json" as def.PaletteFilePath,
    // "CoolInvert": "fasta-colors-cold-inverted.json" as def.PaletteFilePath
}

//TODO: Use classes in .ts files for better foundation and maintainability
//TODO: Add functions to be run on an uninstall event to clean up settings and token colors
//TODO: Set up Highlighting for specified letter or Motif in a file
//TODO: Implement On Hover from Refactored file

const MAX_LEN_DISPLAY : number = 25;
export class BioNotation{ 
    private targetConfigWorkspace = vscode.ConfigurationTarget.Workspace;
    private activePalette: ColorFile;
    private theme: Theme;
    private tmLang : LangFileEditor;
    private langGen! : LangGenerator;
    private paletteGen! : PaletteGenerator;
   
    private vscCOUT = vscUtils.vscCOUT;
    // private patchTokenColors: (fileName?: string) => Promise<void>;
    // private removeTokenColors: () => Promise<void>;
    private patcher = getPatcherInstance();

    constructor(private context: vscode.ExtensionContext, meta: rW.FileMeta){
        // this.patchTokenColors = this.patcher.patchTokenColors.bind(this.patcher);
        // this.removeTokenColors = this.patcher.removeTokenColors.bind(this.patcher);
        this.activePalette = meta.filePath as ColorFile;
        // this.activePalette =  DEFAULT_PALETTE as ColorFile;//TODO: set Sanger Colors as Default
                                                //TODO: create Sanger Colors Pallete
                                                //TODO: create Illuminia Colors Pallete

        this.theme = meta.theme!;                                                
        this.tmLang = new LangFileEditor(this.context);

        this.setLangGen(meta);
        this.setPaletteGen(meta);
        
        
        this.registerCommands();
        hoverOver.registerProvider();
    }

    private setLangGen(meta: rW.FileMeta){
        const langParams: LangParams = {
            palFlavor: meta.theme!,
            variants: meta.variants!,//TODO: May be needed later 
            tmLangFile : meta.genLangPath() as rW.LangFile,
            jsonKind: "syntaxes"
        };
        this.langGen = new LangGenerator(this.context!,langParams);
    }
    
    private setPaletteGen(meta: rW.FileMeta){
        const colorParams: PaletteParams = {
            descript: "HighLighter Palatte Generator",
            paletteFile : this.activePalette,
            jsonKind: "palettes"
        };
        this.paletteGen = new PaletteGenerator(this.context!,colorParams);
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand("bioNotation.selectPalette", this.selectPalette.bind(this)),
            vscode.commands.registerCommand("bioNotation.toggleColorsOverlay", this.toggleColorOverlay.bind(this)),
            vscode.commands.registerCommand("bioNotation.toggleAlphabet", this.toggleAlphabet.bind(this)),
            vscode.commands.registerCommand("bioNotation.clearColors", this.clearColors.bind(this)),
            vscode.commands.registerCommand("bioNotation.applyColors", this.applyColors.bind(this)),
            vscode.commands.registerCommand("bioNotation.onUninstall", this.onUninstall.bind(this)),
            vscode.commands.registerCommand("bioNotation.toggleHighLight", this.toggleHighLight.bind(this))//TODO extract Method from RegExBuilder.test
        );
    }
    
    private getActiveFileKind(): rW.Lang {
        const doc = vscUtils.getActiveDoc();
        if (!doc) return "fasta"; // default fallback

        const ext = path.extname(doc.fileName).toLowerCase().replace(".", "");
        if (ext === "fasta" || ext === "fa") return "fasta";
        if (ext === "fastq") return "fastq";
        return "fasta";
    }

    private async updateEnabledFlag(bool : boolean): Promise<void> {   
        await vscode.workspace.getConfiguration().update("bioNotation.enabled", bool, this.targetConfigWorkspace);
    }
    
    private async removeEnabledFlag(): Promise<void> {   
        await vscode.workspace.getConfiguration().update("bioNotation.enabled", undefined, this.targetConfigWorkspace);
    }
// export type alphabet = 
// "Nucleotides" | "Aminos" | "Ambiguous" 
// | "Aminos Properties" | "Nucleotide Categories";
//     private convAlphaToTokenType(alpha: def.alphabet){
//         switch(alpha){  
//             case "Nucleotides":
//             case "Nucleotides Categories":
//                 return "nt";
//             case "Aminos":
//             return "aa"
//             case "sym":
//             case "Title":
//     }

    private async toggleHighLight(): Promise<void> {
        const result = await this.hLUserChoice();
            if (!result) return;
        const [selection, alpha] = result;
    
        const pattern = await this.patternChoice(selection, alpha);
            if(!pattern) return;
        const color = await this.hLColorChoice();
            if(!color) return;

        // this.addToLangTmFile(pattern, color);
        const patternRule = this.langGen.genPatternRule(pattern, "hl");
        this.tmLang.appendPattern(patternRule);

        const colorRule = this.paletteGen
        // await this.patcher.patchTokenColors(this.activePalette);
        this.vscCOUT(`Updated palette applied from ${this.activePalette}.`);
        //TODO: push functions from Tests here!
    }

    public async clearColors(): Promise<void> {
        await this.patcher.removeTokenColors();
        await this.updateEnabledFlag(false);
        this.vscCOUT("BioNotation colors cleared.");
    }
    
    public async toggleColorOverlay(): Promise<void> {
        if(await this.isActive()){
            await this.clearColors();
            this.vscCOUT("BioNotation deactivated via toggle.");
        }else{
            await this.applyColors();
            this.vscCOUT("BioNotation activated via toggle.");
        }
    }
   
    public async toggleAlphabet(){
        const options: def.alphabet[] = ["Ambiguous", "Nucleotides", "Aminos"];
        const userText = def.arrayToStr(
            ["Determine Alphabet for HoverOver Info:",
            "Protein: Aminos",
            "DNA/RNA: Nucleotides",
            "Default: Ambigious"
        ]);

        const selection = await vscUtils.showInterface(options, userText);
        await hoverOver.switchAlphabets(selection as def.alphabet);
        this.printSelectionAlpha(selection!);
    }
        
    public async patternChoice(selection: def.HLSelect, alpha: string): Promise<string| undefined> {
        if(selection === def.kmerText as def.HLSelect)
            return await vscUtils.showInputBox("Enter a kmer/Codon/pattern","ATG, GCT, etc.");
        
        if(alpha == "Nucleotide" || alpha == "Amino"){
            return selection[0];
        }
        return undefined;
    }   

    private async secondChoice(options : string[], lang : string) : Promise<[def.HLSelect, string] | undefined>{
        const secondSelection = await vscUtils.showInterface(options, `Choose ${lang} Highlight`) as def.HLSelect;
            if (!secondSelection) return;
        this.printSelectionHighLight(secondSelection);
        return [secondSelection, `${lang}`];
    }


    public async hLUserChoice(): Promise<[def.HLSelect, string] | undefined> {
        const firstSelection = await vscUtils.showInterface([...def.HLight.topLevelOptions], "Choose or Type Highlight Category") as def.HLSelect;
            if (!firstSelection) return;

        if (firstSelection === def.kmerText as def.HLSelect) {
            const result = await this.secondChoice([...def.HLight.alphaSubOptions], "Alphabet"); // const secondSelection = await vscUtils.showInterface([...def.HLight.alphaSubOptions], "Choose Alphabet") as def.HLSelect;
            if (!result) return;//     if (!secondSelection) return;  // this.printSelectionHighLight(secondSelection);
            const [secondSelection] = result;
            return [firstSelection, secondSelection as def.HLSelect];
        }

        if (firstSelection === def.aminoText  as def.HLSelect) {
            return await this.secondChoice([...def.HLight.aminoSubOptions], "Amino");
        }

        if (firstSelection === def.nukeText as def.HLSelect) {
            return await this.secondChoice([...def.HLight.nucleotideSubOptions], "Nucleotide");
        }

        this.printSelectionHighLight(firstSelection);
        return [firstSelection, "ambiguous"];

    }

    public async hLColorChoice(): Promise<Neons | undefined> {
        const colorChoice = await vscUtils.showInterface([       
            "Neon Yellow",
            "Neon Green",
            "Neon Blue",
            "Neon Magneta"], "Choose Highlight Category") as def.ColorHex;
        return themeUtils.highLightColors(colorChoice)
    }


    private printSelectLine(selection : string, alpha : string): void{
        this.vscCOUT(`${selection}:   BioNotation isolated all ${selection} ${alpha}.`);
    }


    private printSelectionHighLight(selection: string) {
        const nukes = "Nucleic acids";
        const amino = "Amino acids";

        const map: Record<string, () => void> = {
            "Swap Text Colors and Highlight Colors":       () => this.vscCOUT("Swapped: BioNotation text colors for highlighted blocks by toggle."),
            "Find Entered Pattern: kmer, Codon, letter, etc":       () => this.vscCOUT("Kmer:   BioNotation registered user entry as pattern."),
            
            "N: Nonpolar/Alipathic":   () => this.printSelectLine(selection, amino),
            "P: Polar":   () => this.printSelectLine(selection, amino),
            "A: Aromatic":   () => this.printSelectLine(selection, amino),
            "R: Ringed":     () => this.printSelectLine(selection, amino),
            "+: Positive\\Basic:":   () => this.printSelectLine(selection, amino),
            "-: Negative\\Acidic:":   () => this.printSelectLine(selection, amino),

            "B: B Drift: Asx: Asn or Asp":    () => this.printSelectLine(selection, amino),
            "J: J Drift: (Iso)leucine: L or I":    () => this.printSelectLine(selection, amino),
            "Z: Z Drift: Glx: Gln or Glu":    () => this.printSelectLine(selection, amino),
            
            "R: Purine":     () => this.printSelectLine(selection, nukes),
            "Y: Pyrimidine": () => this.printSelectLine(selection, nukes),
            
            "S: Strong Bonds":     () => this.printSelectLine(selection, nukes),
            "W: Weak Bonds":       () => this.printSelectLine(selection, nukes),
            
            "M: Amino":      () => this.printSelectLine(selection, nukes),
            "K: Ketone":     () => this.printSelectLine(selection, nukes),
            
            "B: Not A":      () => this.printSelectLine(selection, nukes),
            "D: Not C":      () => this.printSelectLine(selection, nukes),
            "H: Not G":      () => this.printSelectLine(selection, nukes),
            "V: Not T/U":      () => this.printSelectLine(selection, nukes)
        };

        if (map[selection]) {
            map[selection]();
        } else {
            this.vscCOUT(`Invalid input: ${selection}.`);
        }
    }
    
    private printSelectionAlpha(selection : string){
        if(selection === "Ambiguous"){
            this.vscCOUT("Ambiguous: BioNotation registered letters as either Nucleotides or Amino Acids by toggle.");
        }else if(selection === "Nucleotides"){
            this.vscCOUT("DNA/RNA:   BioNotation registered letters as Nucleotides on toggle.");
        }else if(selection === "Aminos"){
            this.vscCOUT("Protein:   BioNotation registered letters as Amino Acids on toggle.");
        }else{
            this.vscCOUT("Ambiguous: BioNotation registered letters as either Nucleotides or Amino Acids by Default.");
        }
    }
    
    public async isActive(): Promise<boolean> {
        const config = vscUtils.globalConfig(); //changes at runtime, should not be a private variable
        return config.get("bioNotation.enabled") === true; 
        // Only treat *true* as active
    }

    public async applyColors(fileName: ColorFile= this.activePalette ): Promise<void> {
        await this.patcher.patchTokenColors(fileName);
        await this.updateEnabledFlag(true);
        this.vscCOUT("BioNotation colors applied.");
    }

    public async selectPalette(): Promise<void> {
        const paletteOptions = Object.keys(PaletteMap) as Theme[];
    
        const choice = await vscode.window.showQuickPick(paletteOptions, {
            placeHolder: "Select a BioNotation color palette:",
            canPickMany: false
        });
    
        if(!choice) {
            this.vscCOUT("No valid palette selected.");
            return;
        }
        const fileName = this.palettePath(choice);
        if(!fileName) return;
    
        await this.switchPalettes(fileName);
        this.vscCOUT(`BioNotation colors switched to ${choice} palette.`);
    }

    public palettePath(choice: string | Theme): ColorFile | undefined {
        const fileName = PaletteMap[choice as Theme];
        if(!fileName){
            this.vscCOUT(`Palette "${choice}" not found.`);
            return;
        }
        return fileName;
    }

    public async switchPalettes(fileName : ColorFile): Promise<void> {
        if (!(await this.isActive())) {
            this.vscCOUT("Cannot switch palettes when BioNotation is inactive.");
            return;
        }
        await this.patcher.removeTokenColors();
        await this.updateEnabledFlag(true); // Ensure enabled before applying new palette
        // const fileName = PaletteMap.get(PaletteName);
        
        this.activePalette = fileName;
        await this.patcher.patchTokenColors(fileName);
        this.vscCOUT(`BioNotation colors switched for ${fileName}.`);
    }
    



    public genHLNameScope(kmer: string): def.NameScope{
        if(kmer.length < MAX_LEN_DISPLAY){
            return `source.fasta.hl${kmer}.highLightRule`;//TODO: Change this so it's not possibly putting insanely long patterns into kmer 
        }else{
            return `source.fasta.hlkmer.highLightRule`;//TODO: Change this so it's not possibly putting insanely long patterns into kmer 
        }
    }

    public genHighLightRule(pattern: string = "ATGN", color : string): def.ColorRule{
        const scopeName = this.genHLNameScope(pattern);
        const colorRule: def.ColorRule = {
            name: "kmer Highlighter",
            scope: scopeName,
            settings: {
                "foreground": themeUtils.defaultTextColor(),
                "background": themeUtils.highLightColors(color)
            }
        };

        const [taggedRule] = this.patcher.tagColorsGenRules([colorRule]);
        return taggedRule;
    }

    public addToLangTmFile(pattern: string = "ATGN", color : string){
        const taggedRule = this.genHighLightRule(pattern,color);
        
        // "fasta-colors-warm.json"
        const palette = this.patcher.loadColors(this.activePalette);
        const updatedPalette = this.patcher.tagColorsGenRules(palette.concat(taggedRule));
        
        //Append new Color Rule updates palette array
        const found = updatedPalette.find((rule : def.ColorRule) => rule.scope === taggedRule.scope);
        
        //Write updated palette to file and check content
        fs.writeFileSync(this.activePalette, JSON.stringify({ tokenColors: updatedPalette }, null, 2));
    }



    // public async addTokenToOverLayOri(pattern : string) {
    //    const doc = vscUtils.getActiveDoc();
    //     if (!doc) {
    //         this.vscCOUT("No active document found.");
    //         return;
    //     }
                
    //     const fileExtension = path.extname(doc.fileName).toLowerCase().replace(".", "");
    //     const fileKind = 
    //         fileExtension === "fasta" || fileExtension === "fa" ? "fasta" :
    //         fileExtension === "fastq" ? "fastq" :
    //         "fasta";  // Default fallback

    //     const palFlavor = vscode.workspace.getConfiguration().get<string>("bioNotation.colorScheme") || "warm";


    //     const paramsForKmerPalette : PaletteParams = {
    //         jsonKind: "palettes",
    //         fileKind: fileKind,
            
    //         descript: `Token ${pattern} added to Overlay`,
    //         palFlavor: palFlavor,
    //         actualPalFile : this.activePalette
    //     }
    

    //     const paletteGen = new PaletteGenerator(this.context, paramsForKmerPalette);
    //     paletteGen.writeRule(pattern);

    //     await this.patcher.patchTokenColors(paletteGen.genOutputFileStr());
    // }

    public async activate(): Promise<void> {
        if(await this.isActive()){ 
            await this.patcher.patchTokenColors(this.activePalette); // Only apply if enabled
            this.vscCOUT("BioNotation colors auto-applied on activation.");
        }else{
            this.vscCOUT("Error: Cannot activate Unless you Toggle On.");
        }
    }
    
    public async deactivate(): Promise<void> {
        await this.patcher.removeTokenColors(); // Always remove
        await this.updateEnabledFlag(false); // Clear flag
        this.vscCOUT("BioNotation colors removed on deactivation.");
    }

    public async onUninstall(): Promise<void>{
        //Clean Rules
        await this.clearColors();
        await this.removeEnabledFlag();
    }
}



let bioNotationInstance: BioNotation;

export function activate(context: vscode.ExtensionContext) {
    try {
       vscode.window.showInformationMessage("HELLO WORLD");

        const metaFileColors = new rW.FileMeta("fasta-colors-warm.json");  
        // const metaFileLang = new rW.FileMeta("fasta.tmLanguage.json");
        initPatcher(context, metaFileColors);  

        // bioNotationInstance = new BioNotation(context, metaFileColors);
        // // bioNotationInstance = new BioNotation(context, metaFileColors, metaFileLang);
        // bioNotationInstance.activate();
    } catch (err) {
        console.error("BioNotation activation failed:", err);
        vscode.window.showInformationMessage(`BioNotation activation failed: ${err}`);
    }
}

// export function deactivate() {
//     if (bioNotationInstance) {
//         bioNotationInstance.deactivate();
//     }
// }