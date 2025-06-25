import * as vscode from "vscode";
import { patchTokenColors, removeTokenColors, loadColors, vscCOUT } from "./patch";

const DEFAULT_PALETTE = "fasta-colors.json";
/**
 * BioNotation - A VSCode extension for enhanced bioinformatics file visualization.
 * 
 * This module provides functions to apply, clear, and toggle BioNotation colors,
 * as well as manage color palettes and check the active state of the extension.
 */

export async function updateEnabledFlag(value : boolean): Promise<void> {   
    await vscode.workspace.getConfiguration().update("bioNotation.enabled", value, vscode.ConfigurationTarget.Workspace);
}

export async function applyBioNotation(context: { extensionPath: string}, fileName: string= DEFAULT_PALETTE ): Promise<void> {
    // await removeTokenColors(); // always clean first
    await patchTokenColors(context,fileName);
    await updateEnabledFlag(true);
    vscCOUT("BioNotation colors applied.");
}

export async function clearBioNotation(){
    await removeTokenColors();
    await updateEnabledFlag(false);
    vscCOUT("BioNotation colors cleared.");
}

export async function toggleColorOverlay(context: { extensionPath: string }): Promise<void> {
    if(await isActive()){
        await clearBioNotation();
        console.log("BioNotation deactivated via toggle.");
    }else{
        await applyBioNotation(context);
        vscCOUT("BioNotation activated via toggle.");
    }
}

export type PaletteName = "Default" | "Warm" | "WarmComp" | "Cool"| "CoolComp";

const palleteMap: Record<PaletteName, string> = {
    "Default": "fasta-colors.json",
    "Warm":"fasta-color-warm.json",
    "WarmComp":"fasta-color-warm-comp.json",
    "Cool":"fasta-color-cool.json",
    "CoolComp":"fasta-color-cool-comp.json"
    // ["Default","fasta-color-default.json"],
    // ["DefaultComp","fasta-color-default-comp.json"],
    // ["BioNotation","bio-notation.json"]
}

export async function selectPalette(context: { extensionPath: string }): Promise<void> {
    const paletteOptions = Object.keys(palleteMap) as PaletteName[];

    const choice = await vscode.window.showQuickPick(paletteOptions, {
        placeHolder: "Select a BioNotation color palette\n Warm, Cool",
        canPickMany: false
    });

    if(!choice) {
        vscCOUT("No valid palette selected.");
        return;
    }

    await switchPalettes(context, choice);
    vscCOUT(`BioNotation colors switched to ${choice} palette.`);
}

export async function switchPalettes(context: { extensionPath: string }, palleteName : string): Promise<void> {
    await removeTokenColors();
    await updateEnabledFlag(true); // Ensure enabled before applying new palette
    // const fileName = palleteMap.get(palleteName);
    const fileName = palleteMap[palleteName as PaletteName];
    if(!fileName){
        vscCOUT(`Palette "${palleteName}" not found.`);
        return;
    }
    await patchTokenColors(context, fileName);
    vscCOUT(`BioNotation colors switched for ${fileName}.`);
}

export async function isActive(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration();
    return config.get("bioNotation.enabled") === true; 
    // Only treat *true* as active
}

export function registerCommands(context: vscode.ExtensionContext): void {
    const toggleCommand = vscode.commands.registerCommand(
        "bioNotation.toggleColors", async () => {
            await toggleColorOverlay(context);
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
            await applyBioNotation(context); 
            vscCOUT("BioNotation forcibly applied.");
        }
    );

    const pickCommand = vscode.commands.registerCommand(
        "bioNotation.selectPalette",
        async () => {
            await selectPalette(context);
            console.log("BioNotation palette selection triggered.");
        }
    );

    context.subscriptions.push(toggleCommand, clearCommand, applyCommand, pickCommand);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    registerCommands(context);

    if(await isActive()){ 
        // toggleBioNotation(context);
        await patchTokenColors(context); // Only apply if enabled
        vscCOUT("BioNotation colors auto-applied on activation.");
    }
}

export async function deactivate(): Promise<void> {
    // toggleBioNotation(context);
    await removeTokenColors(); // Always remove
    await updateEnabledFlag(false); // Clear flag
    vscCOUT("BioNotation colors removed on deactivation.");
}

// ["bioNotation.acid", "#FF6347"], // Tomato
// ["bioNotation.base", "#4682B4"], // SteelBlue
// ["bioNotation.rna", "#32CD32"], // LimeGreen
// ["bioNotation.dna", "#FFD700"], // Gold
// ["bioNotation.protein", "#8A2BE2"], // BlueViolet
// ["bioNotation.sequence", "#FF4500"], // OrangeRed
// ["bioNotation.annotation", "#00CED1"] // DarkTurquoise

export function isFastaFile(filename: string): boolean {
    return /\.(fa|fasta|fastq)$/i.test(filename);
}
export function isGFFFile(filename: string): boolean {
    return /\.(gff|gff3)$/i.test(filename);
}
export function isBEDFile(filename: string): boolean {
    return /\.(bed)$/i.test(filename);
}
export function isGenBankFile(filename: string): boolean {
    return /\.(gb|gbk)$/i.test(filename);
}
export function isVCFFile(filename: string): boolean {
    return /\.(vcf|vcf.gz)$/i.test(filename);
}
export function isSAMFile(filename: string): boolean {
    return /\.(sam|bam)$/i.test(filename);
}
export function isBAMFile(filename: string): boolean {
    return /\.(bam)$/i.test(filename);
}
export function isBigWigFile(filename: string): boolean {
    return /\.(bw|bigwig)$/i.test(filename);
}
export function isBigBedFile(filename: string): boolean {
    return /\.(bb|bigbed)$/i.test(filename);
}
export function isGTFFile(filename: string): boolean {
    return /\.(gtf|gff)$/i.test(filename);
}
export function isSequenceFile(filename: string): boolean {
    return isFastaFile(filename) || isGenBankFile(filename) || isGFFFile(filename) || isBEDFile(filename);
}
export function isAnnotationFile(filename: string): boolean {
    return isGFFFile(filename) || isBEDFile(filename) || isGTFFile(filename) || isVCFFile(filename);
}           