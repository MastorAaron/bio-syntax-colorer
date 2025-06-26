import * as vscode from "vscode";
// import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";
import { vscUtils } from "./vscUtils";
import * as def from "./definitions";
import {PatchColors} from "./patch";

const DEFAULT_PALETTE = "fasta-colors.json";

export type PaletteName = 
"Default" | 
"Warm" | "WarmComp" | 
    "Cool"| "CoolComp";

const PaletteMap: Record<PaletteName, def.PaletteFilePath> = {
    "Default":  "palettes/fasta-colors.json" as def.PaletteFilePath,
    "Warm":     "palettes/fasta-color-warm.json"as def.PaletteFilePath,
    "WarmComp": "palettes/fasta-color-warm-comp.json"as def.PaletteFilePath,
    "Cool":     "palettes/fasta-color-cool.json"as def.PaletteFilePath,
    "CoolComp": "palettes/fasta-color-cool-comp.json" as def.PaletteFilePath
}

/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
*/

//TODO: Use classes in .ts files for better foundation and maintainability
//TODO: Add functions to be run on an uninstall event to clean up settings and token colors
//TODO: Set up Highlighting for specified letter or Motif in a file

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
        this.activePalette = PaletteMap["Default"];
        this.registerCommands();
    }

    private registerCommands(): void {
        const { context, 
            applyBioNotation, 
            toggleColorOverlay,
            clearBioNotation, 
            selectPalette,
            vscCOUT
        } = this;
        
        const toggleCommand = vscode.commands.registerCommand(
            "bioNotation.toggleColors", async () => {
                await toggleColorOverlay();
                vscCOUT("BioNotation Toggled.");
            }
        );

        const clearCommand = vscode.commands.registerCommand(
            "bioNotation.clearColors", async () => {
                await clearBioNotation(); 
                vscCOUT("BioNotation forcibly cleared.");
            }
        );
        
        const applyCommand = vscode.commands.registerCommand(
            "bioNotation.applyColors", async () => {
                await applyBioNotation(); 
                vscCOUT("BioNotation forcibly applied.");
            }
        );

        const pickCommand = vscode.commands.registerCommand(
            "bioNotation.selectPalette", async () => {
                await selectPalette();
                console.log("BioNotation palette selection triggered.");
            }
        );
        context.subscriptions.push(toggleCommand, clearCommand, applyCommand, pickCommand);
    }

    private async updateEnabledFlag(value : boolean): Promise<void> {   
        await vscode.workspace.getConfiguration().update("bioNotation.enabled", value, this.targetConfigWorkspace);
    }


    public async clearBioNotation(): Promise<void> {
        const { removeTokenColors, updateEnabledFlag, vscCOUT } = this;
        await removeTokenColors();
        await updateEnabledFlag(false);
        vscCOUT("BioNotation colors cleared.");
    }
    
    public async toggleColorOverlay(): Promise<void> {
        const { vscCOUT } = this;
        const { isActive, clearBioNotation, applyBioNotation } = this;
        if(await isActive()){
            await clearBioNotation();
            console.log("BioNotation deactivated via toggle.");
        }else{
            await applyBioNotation();
            vscCOUT("BioNotation activated via toggle.");
        }
    }

    public async isActive(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration(); //changes at runtime, should not be a private variable
        return config.get("bioNotation.enabled") === true; 
        // Only treat *true* as active
    }


    public palettePath(choice: string | PaletteName): def.PaletteFilePath | undefined {
        const { vscCOUT } = this;
        const fileName = PaletteMap[choice as PaletteName];
        if(!fileName){
            vscCOUT(`Palette "${choice}" not found.`);
            return;
        }
        return fileName;
    }

    public async applyBioNotation(fileName: string= this.activePalette ): Promise<void> {
        const { context, patchTokenColors, updateEnabledFlag, vscCOUT } = this;
        await patchTokenColors(fileName);
        await updateEnabledFlag(true);
        vscCOUT("BioNotation colors applied.");
    }
        

    public async selectPalette(): Promise<void> {
        const { vscCOUT } = this;
        const paletteOptions = Object.keys(PaletteMap) as PaletteName[];
    
        const choice = await vscode.window.showQuickPick(paletteOptions, {
            placeHolder: "Select a BioNotation color palette:",
            canPickMany: false
        });
    
        if(!choice) {
            vscCOUT("No valid palette selected.");
            return;
        }
        const fileName = this.palettePath(choice);
        if(!fileName) return;
     
        await this.switchPalettes(fileName);
        vscCOUT(`BioNotation colors switched to ${choice} palette.`);
    }


    public async switchPalettes(fileName : def.PaletteFilePath): Promise<void> {
        const { vscCOUT, removeTokenColors, patchTokenColors} = this;
        await removeTokenColors();
        await this.updateEnabledFlag(true); // Ensure enabled before applying new palette
        // const fileName = PaletteMap.get(PaletteName);
        
        this.activePalette = fileName;
        await patchTokenColors(fileName);
        vscCOUT(`BioNotation colors switched for ${fileName}.`);
    }
    
    public async activate(): Promise<void> {
        const { vscCOUT, patchTokenColors } = this;
        // this.registerCommands(); //Redundant
        
        if(await this.isActive()){ 
            await patchTokenColors(this.activePalette); // Only apply if enabled
            vscCOUT("BioNotation colors auto-applied on activation.");
        }
    }
    
    public async deactivate(): Promise<void> {
        const { vscCOUT, removeTokenColors, updateEnabledFlag } = this;
        await removeTokenColors(); // Always remove
        await updateEnabledFlag(false); // Clear flag
        vscCOUT("BioNotation colors removed on deactivation.");
    }
}

// ["bioNotation.acid", "#FF6347"], // Tomato
// ["bioNotation.base", "#4682B4"], // SteelBlue
// ["bioNotation.rna", "#32CD32"], // LimeGreen
// ["bioNotation.dna", "#FFD700"], // Gold
// ["bioNotation.protein", "#8A2BE2"], // BlueViolet
// ["bioNotation.sequence", "#FF4500"], // OrangeRed
// ["bioNotation.annotation", "#00CED1"] // DarkTurquoise