/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
*/

// import { patchTokenColors, removeTokenColors, loadColors, print } from "./patch";
import * as vscode from "vscode";
import { vscUtils, themeUtils, Neons } from "./vscUtils";
import * as str from "./stringUtils";
import { PatchColors } from "./patch";

import * as def from "./definitions";
import hoverOver from './hoverOver';
import highLightOverlay from "./highLightOverlay";

import { Lang } from "./definitions";
import { LangFile } from "./fileMeta";
import { FileMeta, JsonFile, ColorFile, FilePath } from "./fileMeta";

import { hlMenuObj } from "./menus";
import * as menu from "./menus";
import { RegExBuilder } from "./regExBuilder";

export const Themes = ["warm", "cool", /*"cold",*/ "hades", "jade dragon" ];
export type Theme = (typeof Themes)[number];

//TODO: Use classes in .ts files for better foundation and maintainability
//TODO: Add functions to be run on an uninstall event to clean up settings and token colors
//TODO: Set up Highlighting for specified letter or Motif in a file
//TODO: Implement On Hover from Refactored file



export class BioNotation{ 
    private patcher: PatchColors;
    private readonly defaultPalette: FilePath;
    private activePalette: FileMeta;
    private meta: FileMeta;
    private hlMenu!: hlMenuObj

    private paletteStatusBarItem?: vscode.StatusBarItem;
   
    private regi! : RegExBuilder;
    private print = vscUtils.print;
    // private patchTokenColors: (fileName?: string) => Promise<void>;
    // private removeTokenColors: () => Promise<void>;

    //TODO: create Sanger Colors Pallete
    //TODO: set Sanger Colors as Default
    //TODO: create Illuminia Colors Pallete
    constructor(private context: vscode.ExtensionContext, fileName:string) {
        this.meta = new FileMeta(fileName as JsonFile, context);
        this.defaultPalette = this.meta.fullFilePath;
        this.print(`File path: ${this.meta.fullFilePath}`)
        hoverOver.registerProvider();
        this.patcher = new PatchColors(context, this.meta);
        this.regi = new RegExBuilder(true);
       
        this.activePalette = this.meta;// ||  "fasta-colors-cool.json" as ColorRule;
        // this.setLangGen();
        this.registerCommands(); 
        
        
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
            
            vscode.commands.registerCommand("bioNotation.clearPhredLine", this.clearPhredLine.bind(this)),
            vscode.commands.registerCommand("bioNotation.selectQualityType", this.selectPhred.bind(this))

            // this.patchTokenColors = this.patcher.patchTokenColors.bind(this.patcher);
            // this.removeTokenColors = this.patcher.removeTokenColors.bind(this.patcher);

            //TODO extract Method from RegExBuilder.test
        );
        this.setUpStatusBar();
        this.hlMenu = new hlMenuObj(this.toggleColorOverlay.bind(this));
    }
            
    // private setLangGen(){
    //     const metaLang = new FileMeta(`${this.activePalette.lang}.tmLanguage.json`,this.context);
    //     const langParams: LangParams = {
    //         theme: metaLang.theme!,
    //         variants: metaLang.variants!,//TODO: May be needed later 
    //         tmLangFile : metaLang.genLangPath() as LangFile,
    //         jsonKind: "syntaxes"
    //         };
    //     this.langGen = new LangGenerator(this.context!,langParams);
    // }

    public async clearColors(): Promise<void> {
        await this.patcher.removeTokenColors();
        await this.updateEnabledFlag(false);
        this.print("BioNotation colors cleared.");
    }
    
    public async clearPhredLine(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscUtils.print("No active editor for Phred overlay.");
                return;
            }
        await hoverOver.fredo.clearPhredOverlay(editor);
        this.print("Phred line colors cleared.");
    }

    public async toggleColorOverlay(): Promise<void> {
        if(await this.isActive()){
            await this.clearColors();
            this.print("BioNotation deactivated via toggle.");
        }else{
            await this.applyColors();
            this.print("BioNotation activated via toggle.");
        }
    }

  
    public async selectPhred(){
        const editor = vscode.window.activeTextEditor;
         if (!editor) {
            vscUtils.print("No active editor for Phred overlay.");
            return;
        }
        return await hoverOver.fredo.changePhred(editor);
    }

    private async toggleHighLight(): Promise<void> {
        const result = await this.hlMenu.hlUserChoice();
            if (!result) return;
        const [selection, alpha] = result;

        this.print(`Alpha passed to patternChoice: ${alpha}`);
        this.print(`Selection passed to patternChoice: ${selection}`);
        const pattern = await this.hlMenu.hlPatternChoice(selection, alpha);
            if (!pattern) return;
        
        const regEx = this.regi.genRegEx(pattern, alpha);
        
        const color = await this.hlMenu.hLColorChoice();
            if (!color) return;

        highLightOverlay.applyHighLight(regEx, color);
        this.print(`Applied runtime highlight overlay for pattern: ${pattern} ${regEx} with color: ${color}.`);
    }

    private async clearHighLightOverlays(): Promise<void> {
        highLightOverlay.clearAllHighLights();
        this.print("Cleared all highlight blocks.");
    }

    public async toggleAlphabet(){
        const dropDownOptions: string[] = [
            "Determine Alphabet for HoverOver Info:",
            "Protein:     Aminos",
            "DNA/RNA: Nucleotides",
            "Default:     Ambigious"
        ];
        
        const selection = await vscUtils.showInterface(dropDownOptions, "Ambiguous\tNucleotides\tAminos");
        const alpha = this.hlMenu.extractAlphabet(selection!);
         
        await hoverOver.switchAlphabets(alpha as menu.HoverAlphabet);
        
        this.print(`BioNotation registered alphabet as: ${alpha}`);
        hoverOver.showAlphaStatusBar();
        menu.printSelectionAlpha(alpha as menu.HoverAlphabet);
    }

    public async isActive(): Promise<boolean> {
        const config = vscUtils.globalConfig(); //changes at runtime, should not be a private variable
        return config.get("bioNotation.enabled") === true; 
        // Only treat *true* as active
    }

    public async applyColors(fileName: string = this.activePalette.fileName ): Promise<void> {
        await this.patcher.patchTokenColors(fileName as ColorFile);
        await this.updateEnabledFlag(true);
        this.print("BioNotation colors applied.");
    }



    // public palettePathORI(choice: string | Theme): ColorFile | undefined {
    //     const fileName = PaletteMap[choice?.toLowerCase() as Theme];
    //     if(!fileName){
    //         this.print(`Palette "${choice}" not found.`);
    //         return;
    //     }
    //     return fileName;
    // }
    
    public palettePath(theme: Theme): ColorFile | undefined {
      this.print(`palettePath creating new meta for theme: ${theme.toLowerCase()}`);
        try {
            const newMeta = this.meta.genNewColorFile(theme.toLowerCase());
            const fileName = newMeta.fileName;
            this.print(`Generated filename: ${fileName}`);
            this.activePalette = newMeta;
            return fileName as ColorFile;
        } catch (error) {
            this.print(`Error creating FileMeta: ${error}`);
            return;
        }
    }

    public async switchPalettes(fileName : ColorFile): Promise<void> {
        if (!(await this.isActive())) {
            this.print("Cannot switch palettes when BioNotation is inactive.");
            return;
        }
        await this.patcher.removeTokenColors();
        await this.updateEnabledFlag(true); // Ensure enabled before applying new palette
        // const fileName = PaletteMap.get(PaletteName);
        
        this.activePalette = new FileMeta(fileName, this.context);
        this.patcher = new PatchColors(this.context, this.activePalette);
        await this.patcher.patchTokenColors(fileName as ColorFile);
        highLightOverlay.initColorMap();
        this.print(`BioNotation colors switched for ${fileName}.`);
        this.showThemeStatusBar();
    }

    public async selectPalette(): Promise<void> {
        const paletteOptions = str.capAll(Themes);
    
        const choice = await vscUtils.showInterface(paletteOptions, "Select a BioNotation color palette:");
    
        if(!choice) {
            this.print("No valid palette selected.");
            return;
        }
        const fileName = this.palettePath(str.collapseLower(choice));
        if(!fileName) return;
    
        await this.switchPalettes(fileName);
        
        this.print(`BioNotation colors switched to ${choice} palette.`);
    }
    
    public async setUp(): Promise<void> {
        // this.registerCommands(); //Redundant
        
        if(await this.isActive()){ 
            await this.patcher.patchTokenColors(this.activePalette.fileName as ColorFile); // Only apply if enabled
            this.print("BioNotation colors auto-applied on activation.");
        }else{
            this.print("Error: Cannot activate Unless you Toggle On.");
        }
    }
    
    public async breakDown(): Promise<void> {
        await this.patcher.removeTokenColors(); // Always remove
        await this.updateEnabledFlag(false); // Clear flag
        this.print("BioNotation colors removed on deactivation.");
    }

    private async updateEnabledFlag(bool : boolean): Promise<void> {   
        await vscUtils.updateFlag("bioNotation.enabled", bool);
    }

    private async removeFlags(): Promise<void> {  
        await this.removeWorkSpaceFlag("bioNotation.alphabet"); 
        await this.removeWorkSpaceFlag("bioNotation.enabled"); 
        await this.removeWorkSpaceFlag("bioNotation.phred"); 
    }
    
    private async removeWorkSpaceFlag(flag :string): Promise<void> {   
        await vscUtils.updateFlag(flag, undefined);
    }

    public async onUninstall(): Promise<void>{
        await this.clearColors();
        await this.removeFlags();
        //   "bioNotation.alphabet": "Nucleotides",
    }

    private shortenTheme(theme: Theme): string { 
        const shortThemeRec : Record<Theme, string> = {
            "jadedragon": "Jade",
        }

        return shortThemeRec[theme] || str.capFront(theme);
    }

    public showThemeStatusBar() {
        if (!this.paletteStatusBarItem) {
            this.paletteStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            this.paletteStatusBarItem.command = "bioNotation.selectPalette"; // optional
        }
        this.paletteStatusBarItem.text = `$(symbol-color) Theme: ${this.shortenTheme(this.activePalette.theme!)}`; // 🎨🖌️
        this.paletteStatusBarItem.tooltip = "Select a BioNotation color palette";
        this.paletteStatusBarItem.show();
    }

    private setUpStatusBar(){
        this.showThemeStatusBar();
        if(hoverOver) {
            hoverOver.showAlphaStatusBar();
        }
        if (hoverOver.fredo) {
            hoverOver.fredo.showPhredStatusBar();
        }
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