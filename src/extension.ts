// import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";
import * as vscode from "vscode";
import { vscUtils, themeUtils } from "./vscUtils";
import {PatchColors} from "./patch";
import colorMath from "./ColorInverter";
import * as def from "./definitions";
import hoverOver from './hoverOver';


const DEFAULT_PALETTE = "fasta-colors.json";

export type PaletteName = 
// "Default" |
"Warm" |
"Cold" | 
"Cool" | 
"CoolComp" |
"CoolInvert";

const PaletteMap: Record<PaletteName, def.PaletteFilePath> = {
    // "Default": "fasta-colors.json"as def.PaletteFilePath,
    "Warm": "fasta-colors-warm.json"as def.PaletteFilePath,
    "Cool": "fasta-colors-cool.json"as def.PaletteFilePath,
    "Cold": "fasta-colors-cold.json"as def.PaletteFilePath,
    "CoolComp": "fasta-colors-cold-comp.json" as def.PaletteFilePath,
    "CoolInvert": "fasta-colors-cold-inverted.json" as def.PaletteFilePath
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
//TODO: Implement On Hover from Refactored file


export class BioNotation{ 
    private patcher: PatchColors;
    private targetConfigWorkspace = vscode.ConfigurationTarget.Workspace;
    private activePalette: def.PaletteFilePath;
    private colorUtil = new colorMath(this.context);

    

    
    private vscCOUT = vscUtils.vscCOUT;
    private patchTokenColors: (fileName?: string) => Promise<void>;
    private removeTokenColors: () => Promise<void>;


   

    constructor(private context: vscode.ExtensionContext) {
        this.patcher = new PatchColors(context);
        this.patchTokenColors = this.patcher.patchTokenColors.bind(this.patcher);
        this.removeTokenColors = this.patcher.removeTokenColors.bind(this.patcher);
        this.activePalette = PaletteMap["Warm"];//TODO: set Sanger Colors as Default
                                                //TODO: create Sanger Colors Pallete
                                                //TODO: create Illuminia Colors Pallete

        this.selectPalette = this.selectPalette.bind(this);
        this.toggleColorOverlay = this.toggleColorOverlay.bind(this);
        this.clearBioNotation = this.clearBioNotation.bind(this);
        this.applyBioNotation = this.applyBioNotation.bind(this);

        this.registerCommands();
        hoverOver.registerProvider();

    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand("bioNotation.selectPalette", this.selectPalette),
            vscode.commands.registerCommand("bioNotation.toggleColors", this.toggleColorOverlay),
            vscode.commands.registerCommand("bioNotation.clearColors", this.clearBioNotation),
            vscode.commands.registerCommand("bioNotation.applyColors", this.applyBioNotation)
        );
    }
            
    private async updateEnabledFlag(value : boolean): Promise<void> {   
        await vscode.workspace.getConfiguration().update("bioNotation.enabled", value, this.targetConfigWorkspace);
    }

    public async clearBioNotation(): Promise<void> {
        await this.removeTokenColors();
        await this.updateEnabledFlag(false);
        this.vscCOUT("BioNotation colors cleared.");
    }
    
    public async toggleColorOverlay(): Promise<void> {
        if(await this.isActive()){
            await this.clearBioNotation();
            this.vscCOUT("BioNotation deactivated via toggle.");
        }else{
            await this.applyBioNotation();
            this.vscCOUT("BioNotation activated via toggle.");
        }
    }

    public async isActive(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration(); //changes at runtime, should not be a private variable
        return config.get("bioNotation.enabled") === true; 
        // Only treat *true* as active
    }

    public async pullRule(tokenName: string): Promise<def.ColorRule | null> {
        const palettePath = this.activePalette;
        const palette = await this.patcher.loadColors(palettePath);
        const scope = def.tokenMap[tokenName.toUpperCase()];
        if (!scope) {
            this.vscCOUT(`Token "${tokenName}" not found in tokenMap.`);
            return null;
        }
        return palette.find(rule => rule.scope === scope) || null;
    }//TODO: Implement Edits to rules as a seperate rule with its own "userEdit" Tag
    //TODO: For ease of deletion and reset to defaults but also prioritization of `UserEdit`s above Default settings
    
    public async ruleHighlight(rule: def.ColorRule): Promise<def.ColorRule | null> {
        if(!rule || !rule.settings) return null;
        

        const config = vscUtils.editorConfig();
        const defaultFg = themeUtils.defaultTextColor();  // Adjustable for themes

        const textColor  = rule.settings.background || defaultFg 
        const fg = rule.settings.foreground || this.colorUtil.complementaryHex(textColor) || "#FFFFFF";

        return {
            ...rule,
            name: `${rule.name || "highlighted-rule"}`,
            settings: {
                ...rule.settings,
                foreground: textColor ,
                background: fg,
                fontStyle: "bold underline"
            }
        };
    }
    


    public async applyBioNotation(fileName: string= this.activePalette ): Promise<void> {
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
        }
    }
    
    public async deactivate(): Promise<void> {
        await this.removeTokenColors(); // Always remove
        await this.updateEnabledFlag(false); // Clear flag
        this.vscCOUT("BioNotation colors removed on deactivation.");
    }
}

// ["bioNotation.acid", "#FF6347"], // Tomato
// ["bioNotation.base", "#4682B4"], // SteelBlue
// ["bioNotation.rna", "#32CD32"], // LimeGreen
// ["bioNotation.dna", "#FFD700"], // Gold
// ["bioNotation.protein", "#8A2BE2"], // BlueViolet
// ["bioNotation.sequence", "#FF4500"], // OrangeRed
// ["bioNotation.annotation", "#00CED1"] // DarkTurquoise

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