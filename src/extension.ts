/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
*/

// import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";
import * as vscode from "vscode";
import { vscUtils, themeUtils, Neons } from "./vscUtils";
import * as str from "./stringUtils";
import { PatchColors } from "./patch";

import * as def from "./definitions";
import hoverOver from './hoverOver';
import highLightOverlay from "./highlightOverlay";

import { LangFile, Lang } from "./fileMeta";
import { FileMeta, JsonFile, ColorFile, FilePath } from "./fileMeta";
import { LangParams, PaletteParams } from "./ruleWriter";
import { LangFileEditor, LangGenerator } from "./langGen";
const DEFAULT_PALETTE = "fasta-colors.json";

export const Themes = ["warm", "cool", "cold", "hades", "jadedragon" ];
export type Theme = (typeof Themes)[number];

//TODO: Use classes in .ts files for better foundation and maintainability
//TODO: Add functions to be run on an uninstall event to clean up settings and token colors
//TODO: Set up Highlighting for specified letter or Motif in a file
//TODO: Implement On Hover from Refactored file



export class BioNotation{ 
    private patcher: PatchColors;
    private targetConfigWorkspace = vscode.ConfigurationTarget.Workspace;
    private readonly defaultPalette: FilePath;
    private activePalette: FileMeta;
    private meta: FileMeta;
   
    private langGen! : LangGenerator;
    private vscCOUT = vscUtils.vscCOUT;
    // private patchTokenColors: (fileName?: string) => Promise<void>;
    // private removeTokenColors: () => Promise<void>;

    //TODO: create Sanger Colors Pallete
    //TODO: set Sanger Colors as Default
    //TODO: create Illuminia Colors Pallete
    constructor(private context: vscode.ExtensionContext, fileName:string) {
        this.meta = new FileMeta(fileName as JsonFile, context);
        this.defaultPalette = this.meta.fullFilePath;
        this.vscCOUT(`File path: ${this.meta.fullFilePath}`)
        this.patcher = new PatchColors(context, this.meta);
        // this.patchTokenColors = this.patcher.patchTokenColors.bind(this.patcher);
        // this.removeTokenColors = this.patcher.removeTokenColors.bind(this.patcher);
        this.activePalette = this.meta// ||  "fasta-colors-cool.json" as ColorRule;
        this.setLangGen();
        this.registerCommands();
        hoverOver.registerProvider();
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand("bioNotation.selectPalette", this.selectPalette.bind(this)),
            vscode.commands.registerCommand("bioNotation.toggleColorsOverlay", this.toggleColorOverlay.bind(this)),
            vscode.commands.registerCommand("bioNotation.toggleAlphabet", this.toggleAlphabet.bind(this)),
            vscode.commands.registerCommand("bioNotation.clearColors", this.clearColors.bind(this)),
            vscode.commands.registerCommand("bioNotation.applyColors", this.applyColors.bind(this)),
            vscode.commands.registerCommand("bioNotation.onUninstall", this.onUninstall.bind(this)),
            vscode.commands.registerCommand("bioNotation.toggleHighLight", this.toggleHighLight.bind(this)),
            //TODO extract Method from RegExBuilder.test
        );
    }
            
    private setLangGen(){
        const metaLang = new FileMeta(`${this.activePalette.lang}.tmLanguage.json`,this.context);
        const langParams: LangParams = {
            theme: metaLang.theme!,
            variants: metaLang.variants!,//TODO: May be needed later 
            tmLangFile : metaLang.genLangPath() as LangFile,
            jsonKind: "syntaxes"
            };
        this.langGen = new LangGenerator(this.context!,langParams);
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

    private printSelectLine(selection : string, alpha : string): void{
        this.vscCOUT(`${selection}:   BioNotation isolated all ${selection} ${alpha}.`);
    }

    private printSelectionHighLight(selection: string, alpha: string ) {
        const nukeStr = "Nucleic acids";
        const aminoStr = "Amino acids";

        
        if(alpha == "Aminos" as def.HoverAlphabet){
            this.printSelectLine(selection, aminoStr);
        } else if(alpha == "Nucleotides" as def.HoverAlphabet){
            this.printSelectLine(selection, nukeStr);
        } else if(this.arrIsSubOfString(selection,["Clear"])){
            this.vscCOUT("Cleared: BioNotation's highlighted blocks.");
        } else if(this.arrIsSubOfString(selection,["Kmer"])){
            this.vscCOUT("Kmer:   BioNotation registered user entry as pattern.");
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
 

    private async secondChoice(options : string[], lang : string) : Promise<[def.HLSelect, string] | undefined>{
        const secondSelection = await vscUtils.showInterface(options, `Choose ${lang} Highlight`) as def.HLSelect;
            if (!secondSelection) return;
        this.printSelectionHighLight(secondSelection, lang);
        return [secondSelection, `${lang}`];
    }

    public async hLUserChoice(): Promise<[def.HLSelect, string] | undefined> {
        const firstSelection = await vscUtils.showInterface([...def.HLight.topLevelOptions], "Choose or Type Highlight Category") as def.HLSelect;
            if (!firstSelection) return;

        if (firstSelection === def.kmerText as def.HLSelect) {
            const result = await this.secondChoice([...def.HLight.alphaSubOptions], "Alphabet"); 
            // const secondSelection = await vscUtils.showInterface([...def.HLight.alphaSubOptions], "Choose Alphabet") as def.HLSelect;
            if (!result) return;//     if (!secondSelection) return;  // this.printSelectionHighLight(secondSelection);
            const [secondSelection, junk] = result;
            return [firstSelection, secondSelection as def.HLSelect];
        }

        if (firstSelection === def.aminoText  as def.HLSelect) {
            return await this.secondChoice([...def.HLight.aminoSubOptions], "Aminos");
        }

        if (firstSelection === def.nukeText as def.HLSelect) {
            return await this.secondChoice([...def.HLight.nucleotideSubOptions], "Nucleotides");
        }
        
        if (firstSelection === def.clearText as def.HLSelect) {
            await this.clearHighLightOverlays();
            return;
        }

        // TODO: Limit the language choices based on getCurrAlpha() from HoverOver

        // this.printSelectionHighLight(firstSelection, alpha);
        return [firstSelection, "Ambiguous"];
    }

    public async hLColorChoice(): Promise<Neons | undefined> {
        const colorChoice = await vscUtils.showInterface([       
            "Neon Yellow",
            "Neon Green",
            "Neon Blue",
            "Neon Magneta"], "Choose Highlight Category") as def.ColorHex;
        return themeUtils.highLightColors(colorChoice)
    }
            
    public async patternChoice(selection: def.HLSelect, alpha: string): Promise<string| undefined> {
        if(selection === def.kmerText as def.HLSelect)
            return await vscUtils.showInputBox("Enter a kmer/Codon/pattern","ATG, GCT, etc.");
        
        if(alpha === "Nucleotides" || alpha === "Aminos"){
            return selection[0];
        }
        return undefined;
    }   
   
    private async toggleHighLight(): Promise<void> {
        const result = await this.hLUserChoice();
            if (!result) return;
        const [selection, alpha] = result;

        this.vscCOUT(`Alpha passed to patternChoice: ${alpha}`);
        const pattern = await this.patternChoice(selection, alpha);
            if (!pattern) return;

        const regExBody = this.langGen.genRegEx(pattern, alpha);
        const regEx = new RegExp(regExBody, "gi");
        const color = await this.hLColorChoice();
            if (!color) return;

        highLightOverlay.applyHighLight(regEx, color);
        this.vscCOUT(`Applied runtime highlight overlay for pattern: ${pattern} ${regEx} with color: ${color}.`);
    }

    private async clearHighLightOverlays(): Promise<void> {
        highLightOverlay.clearAllHighLights();
        this.vscCOUT("Cleared all highlight blocks.");
    }

    private arrIsSubOfString(selection: string, arr: string[]){
        return arr.find(each => selection.includes(each)); //Works for small len arrays not the best for larger data
    }

    private extractAlphabet(selection: string){
        return this.arrIsSubOfString(selection, def.hoverAlpha);
        // return def.hoverAlpha.find(eachAlpha => selection.includes(eachAlpha)); //Works for small len arrays not the best for larger data
    }

    public async toggleAlphabet(){
        const dropDownOptions: string[] = [
            "Determine Alphabet for HoverOver Info:",
            "Protein:     Aminos",
            "DNA/RNA: Nucleotides",
            "Default:     Ambigious"
        ];
        
        const selection = await vscUtils.showInterface(dropDownOptions, "Ambiguous\tNucleotides\tAminos");
        const alpha = this.extractAlphabet(selection!);
         
        await hoverOver.switchAlphabets(alpha as def.HoverAlphabet);
        
        this.vscCOUT(`BioNotation registered alphabet as: ${alpha}`);

        if(alpha === "Ambiguous"){
            this.vscCOUT("Ambiguous: BioNotation registered letters as either Nucleotides or Amino Acids by toggle.");
        }else if(alpha === "Nucleotides"){
            this.vscCOUT("DNA/RNA:   BioNotation registered letters as Nucleotides on toggle.");
        }else if(alpha === "Aminos"){
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

    public async applyColors(fileName: string = this.activePalette.fileName ): Promise<void> {
        await this.patcher.patchTokenColors(fileName);
        await this.updateEnabledFlag(true);
        this.vscCOUT("BioNotation colors applied.");
    }

    public async selectPalette(): Promise<void> {
        const paletteOptions = str.capAll(Themes);
    
        const choice = await vscode.window.showQuickPick(paletteOptions, {
            placeHolder: "Select a BioNotation color palette:",
            canPickMany: false
        });
    
        if(!choice) {
            this.vscCOUT("No valid palette selected.");
            return;
        }
        const fileName = this.palettePath(choice.toLowerCase());
        if(!fileName) return;
    
        await this.switchPalettes(fileName);
        this.vscCOUT(`BioNotation colors switched to ${choice} palette.`);
    }

    // public palettePathORI(choice: string | Theme): ColorFile | undefined {
    //     const fileName = PaletteMap[choice?.toLowerCase() as Theme];
    //     if(!fileName){
    //         this.vscCOUT(`Palette "${choice}" not found.`);
    //         return;
    //     }
    //     return fileName;
    // }
    
    public palettePath(theme: Theme): ColorFile | undefined {
      this.vscCOUT(`palettePath creating new meta for theme: ${theme}`);
        try {
            const newMeta = this.meta.genNewColorFile(theme);
            const fileName = newMeta.fileName;
            this.vscCOUT(`Generated filename: ${fileName}`);
            this.activePalette = newMeta;
            return fileName as ColorFile;
        } catch (error) {
            this.vscCOUT(`Error creating FileMeta: ${error}`);
            return;
        }
    }

    public async switchPalettes(fileName : JsonFile): Promise<void> {
        if (!(await this.isActive())) {
            this.vscCOUT("Cannot switch palettes when BioNotation is inactive.");
            return;
        }
        await this.patcher.removeTokenColors();
        await this.updateEnabledFlag(true); // Ensure enabled before applying new palette
        // const fileName = PaletteMap.get(PaletteName);
        
        this.activePalette = new FileMeta(fileName, this.context);
        this.patcher = new PatchColors(this.context, this.activePalette);
        await this.patcher.patchTokenColors(fileName);
        this.vscCOUT(`BioNotation colors switched for ${fileName}.`);
    }
    
    public async setUp(): Promise<void> {
        // this.registerCommands(); //Redundant
        
        if(await this.isActive()){ 
            await this.patcher.patchTokenColors(this.activePalette.fileName); // Only apply if enabled
            this.vscCOUT("BioNotation colors auto-applied on activation.");
        }else{
            this.vscCOUT("Error: Cannot activate Unless you Toggle On.");
        }
    }
    
    public async breakDown(): Promise<void> {
        await this.patcher.removeTokenColors(); // Always remove
        await this.updateEnabledFlag(false); // Clear flag
        this.vscCOUT("BioNotation colors removed on deactivation.");
    }

    private async updateEnabledFlag(bool : boolean): Promise<void> {   
        await vscode.workspace.getConfiguration().update("bioNotation.enabled", bool, this.targetConfigWorkspace);
    }

    private async removeHoverAlphaFlag(): Promise<void> {  
        await this.removeWorkSpaceFlag("bioNotation.alphabet"); 
    }

    private async removeEnabledFlag(): Promise<void> {  
        // await vscode.workspace.getConfiguration().update("bioNotation.enabled", undefined, this.targetConfigWorkspace);
        await this.removeWorkSpaceFlag("bioNotation.enabled"); 
    }
    
    private async removeWorkSpaceFlag(param :string): Promise<void> {   
        await vscode.workspace.getConfiguration().update(param, undefined, this.targetConfigWorkspace);
    }

    public async onUninstall(): Promise<void>{
        await this.removeHoverAlphaFlag();
        await this.clearColors();
        await this.removeEnabledFlag();
        //   "bioNotation.alphabet": "Nucleotides",
    }

}

let bioNotationInstance: BioNotation;

export function activate(context: vscode.ExtensionContext) {
    bioNotationInstance = new BioNotation(context,"fasta-colors-warm.json");
    bioNotationInstance.setUp();
}

export function deactivate() {
    if (bioNotationInstance) {
        bioNotationInstance.breakDown();
    }
}