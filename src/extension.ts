/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
*/

// import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";
import * as vscode from "vscode";
import { vscUtils, themeUtils } from "./vscUtils";
import {PatchColors} from "./patch";

import * as def from "./definitions";
import hoverOver from './hoverOver';

const DEFAULT_PALETTE = "fasta-colors.json";

export type PaletteName = 
    // "Default" |
    "Warm" |
    "Cool" | 
    "Cold" ;
    // "CoolComp" |
    // "CoolInvert";

const PaletteMap: Record<PaletteName, def.PaletteFilePath> = {
    // "Default": "fasta-colors.json"as def.PaletteFilePath,
    "Warm": "fasta-colors-warm.json"as def.PaletteFilePath,
    "Cool": "fasta-colors-cool.json"as def.PaletteFilePath,
    "Cold": "fasta-colors-cold.json"as def.PaletteFilePath
    // "CoolComp": "fasta-colors-cold-comp.json" as def.PaletteFilePath,
    // "CoolInvert": "fasta-colors-cold-inverted.json" as def.PaletteFilePath
}

//TODO: Use classes in .ts files for better foundation and maintainability
//TODO: Add functions to be run on an uninstall event to clean up settings and token colors
//TODO: Set up Highlighting for specified letter or Motif in a file
//TODO: Implement On Hover from Refactored file

export class BioNotation{ 
    private patcher: PatchColors;
    private targetConfigWorkspace = vscode.ConfigurationTarget.Workspace;
    private activePalette: def.PaletteFilePath;
   
    private vscCOUT = vscUtils.vscCOUT;
    private patchTokenColors: (fileName?: string) => Promise<void>;
    private removeTokenColors: () => Promise<void>;

    constructor(private context: vscode.ExtensionContext) {
        this.patcher = new PatchColors(context);
        this.patchTokenColors = this.patcher.patchTokenColors.bind(this.patcher);
        this.removeTokenColors = this.patcher.removeTokenColors.bind(this.patcher);
        this.activePalette = PaletteMap["Warm"] ||  "fasta-colors-warm.json" as def.PaletteFilePath;;//TODO: set Sanger Colors as Default
                                                //TODO: create Sanger Colors Pallete
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
        await this.removeTokenColors();
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
        const userText = def.arrayToStr(["Determine Alphabet for HoverOver Info:",
                                        "\tProtein: Aminos",
                                        "\tDNA/RNA: Nucleotides",
                                        "\tDefault: Ambigious"]);
        
        const selection = await vscUtils.showInterface(options, userText);
            // const selection = await vscode.window.showQuickPick(options, 
            //     { placeHolder: "Select Notation Mode\nAminos\nNucleotides" }
            // );

        await hoverOver.switchAlphabets(selection as def.alphabet);

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

    public async applyColors(fileName: string= this.activePalette ): Promise<void> {
        await this.patchTokenColors(fileName);
        await this.updateEnabledFlag(true);
        this.vscCOUT("BioNotation colors applied.");
    }

    public async selectPalette(): Promise<void> {
        const paletteOptions = Object.keys(PaletteMap) as PaletteName[];
    
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

    public palettePath(choice: string | PaletteName): def.PaletteFilePath | undefined {
        const fileName = PaletteMap[choice as PaletteName];
        if(!fileName){
            this.vscCOUT(`Palette "${choice}" not found.`);
            return;
        }
        return fileName;
    }

    public async switchPalettes(fileName : def.PaletteFilePath): Promise<void> {
        await this.removeTokenColors();
        await this.updateEnabledFlag(true); // Ensure enabled before applying new palette
        // const fileName = PaletteMap.get(PaletteName);
        
        this.activePalette = fileName;
        await this.patchTokenColors(fileName);
        this.vscCOUT(`BioNotation colors switched for ${fileName}.`);
    }
    
    public async activate(): Promise<void> {
        // this.registerCommands(); //Redundant
        
        if(await this.isActive()){ 
            await this.patchTokenColors(this.activePalette); // Only apply if enabled
            this.vscCOUT("BioNotation colors auto-applied on activation.");
        }else{
            this.vscCOUT("Error: Cannot activate Unless you Toggle On.");
        }
    }
    
    public async deactivate(): Promise<void> {
        await this.removeTokenColors(); // Always remove
        await this.updateEnabledFlag(false); // Clear flag
        this.vscCOUT("BioNotation colors removed on deactivation.");
    }
}

let bioNotationInstance: BioNotation;

export function activate(context: vscode.ExtensionContext) {
    bioNotationInstance = new BioNotation(context);
    bioNotationInstance.activate();
}

export function deactivate() {
    if (bioNotationInstance) {
        bioNotationInstance.deactivate();
    }
}