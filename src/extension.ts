/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
*/

// import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";
import * as vscode from "vscode";
import { vscUtils, themeUtils } from "./vscUtils";
import * as str from "./stringUtils";
import { PatchColors } from "./patch";

import * as def from "./definitions";
import hoverOver from './hoverOver';
import { FileMeta, JsonFile, ColorFile, PaletteFilePath } from "./fileMeta";

const DEFAULT_PALETTE = "fasta-colors.json";

export const Themes = ["warm", "cool", "cold", "hades", "jadedragon" ];
export type Theme = (typeof Themes)[number];

const PaletteMap: Record<Theme, ColorFile> = {
    // "Default": "fasta-colors.json"as ColorFile,
    "warm": "fasta-colors-warm.json"as ColorFile,
    "cool": "fasta-colors-cool.json"as ColorFile,
    "cold": "fasta-colors-cold.json"as ColorFile
    // "CoolComp": "fasta-colors-cold-comp.json" as ColorFile,
    // "CoolInvert": "fasta-colors-cold-inverted.json" as ColorFile
}

//TODO: Use classes in .ts files for better foundation and maintainability
//TODO: Add functions to be run on an uninstall event to clean up settings and token colors
//TODO: Set up Highlighting for specified letter or Motif in a file
//TODO: Implement On Hover from Refactored file

export class BioNotation{ 
    private patcher: PatchColors;
    private targetConfigWorkspace = vscode.ConfigurationTarget.Workspace;
    private readonly defaultPalette: PaletteFilePath;
    private activePalette: FileMeta;
    private meta : FileMeta;
   
    private vscCOUT = vscUtils.vscCOUT;
    // private patchTokenColors: (fileName?: string) => Promise<void>;
    // private removeTokenColors: () => Promise<void>;

    constructor(private context: vscode.ExtensionContext, fileName:string) {
        this.meta = new FileMeta(fileName as JsonFile, context);
        this.defaultPalette = this.meta.fullFilePath;
        this.vscCOUT(`File path: ${this.meta.fullFilePath}`)
        this.patcher = new PatchColors(context, this.meta);
        // this.patchTokenColors = this.patcher.patchTokenColors.bind(this.patcher);
        // this.removeTokenColors = this.patcher.removeTokenColors.bind(this.patcher);
        this.activePalette = this.meta// ||  "fasta-colors-cool.json" as ColorRule;
        //TODO: create Sanger Colors Pallete
        //TODO: set Sanger Colors as Default
        //TODO: create Illuminia Colors Pallete

        this.selectPalette = this.selectPalette.bind(this);
        this.toggleColorOverlay = this.toggleColorOverlay.bind(this);
        this.toggleAlphabet = this.toggleAlphabet.bind(this);
        this.clearColors = this.clearColors.bind(this);
        this.applyColors = this.applyColors.bind(this);

        this.registerCommands();
        hoverOver.registerProvider();
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand("bioNotation.selectPalette", this.selectPalette),
            vscode.commands.registerCommand("bioNotation.toggleColorsOverlay", this.toggleColorOverlay),
            vscode.commands.registerCommand("bioNotation.toggleAlphabet", this.toggleAlphabet),
            vscode.commands.registerCommand("bioNotation.clearColors", this.clearColors),
            vscode.commands.registerCommand("bioNotation.applyColors", this.applyColors)
        );
    }
            
    private async updateEnabledFlag(bool : boolean): Promise<void> {   
        await vscode.workspace.getConfiguration().update("bioNotation.enabled", bool, this.targetConfigWorkspace);
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
   
    private extractAlphabet(selection: string){
        return def.hoverAlpha.find(eachAlpha => selection.includes(eachAlpha)); //Works for small len arrays not the best for larger data
    }

    public async toggleAlphabet(){
        //["Ambiguous", "Nucleotides", "Aminos"];
        // const searchBarText = 
        // const dropDownOptions: def.alphabet[] = 
        const dropDownOptions: string[] = 
        ["Determine Alphabet for HoverOver Info:",
            "\tProtein: Aminos",
            "\tDNA/RNA: Nucleotides",
            "\tDefault: Ambigious"];
        
        const selection = await vscUtils.showInterface(dropDownOptions, "Ambiguous\tNucleotides\tAminos");
        const alpha = this.extractAlphabet(selection!);
            // const selection = await vscode.window.showQuickPick(options, 
            //     { placeHolder: "Select Notation Mode\nAminos\nNucleotides" }
            // );
        
        await hoverOver.switchAlphabets(alpha as def.Alphabet);
        
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

    public palettePathORI(choice: string | Theme): ColorFile | undefined {
        const fileName = PaletteMap[choice?.toLowerCase() as Theme];
        if(!fileName){
            this.vscCOUT(`Palette "${choice}" not found.`);
            return;
        }
        return fileName;
    }
    
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