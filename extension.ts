import * as vscode from "vscode";
import { patchTokenColors, removeTokenColors } from "./patch";

export async function updateEnabledFlag(value : boolean): Promise<void> {   
    await vscode.workspace.getConfiguration().update("bioNotation.enabled", value, vscode.ConfigurationTarget.Workspace);
}

export async function applyBioNotation(context: { extensionPath: string }): Promise<void> {
    // await removeTokenColors(); // always clean first
    await patchTokenColors(context);
    await updateEnabledFlag(true);
    vscode.window.showInformationMessage("BioNotation colors applied.");
}

export async function clearBioNotation(){
    await removeTokenColors();
    await updateEnabledFlag(false);
    vscode.window.showInformationMessage("BioNotation colors cleared.");
}

export async function toggleBioNotation(context: { extensionPath: string }): Promise<void> {
    if(await isActive()){
        await clearBioNotation();
        console.log("BioNotation deactivated via toggle.");
    }else{
        await applyBioNotation(context);
        console.log("BioNotation activated via toggle.");
    }
}

export async function isActive(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration();
    return config.get("bioNotation.enabled") === true; 
    // Only treat *true* as active
}

export function DefineCommands(context: vscode.ExtensionContext): void {
    const toggleCommand = vscode.commands.registerCommand(
        "bioNotation.toggleColors", async () => {
            await toggleBioNotation(context);
            console.log("BioNotation Toggled.");
        }
    );
    
    const clearCommand = vscode.commands.registerCommand(
        "bioNotation.clearColors", async () => {
            await clearBioNotation(); 
            console.log("BioNotation forcibly cleared.");
        }
    );
    
    const applyCommand = vscode.commands.registerCommand(
        "bioNotation.applyColors", async () => {
            await applyBioNotation(context); 
            console.log("BioNotation forcibly applied.");
        }
    );
    context.subscriptions.push(toggleCommand, clearCommand, applyCommand);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    DefineCommands(context);

    if(await isActive()){ 
        // toggleBioNotation(context);
        await patchTokenColors(context); // Only apply if enabled
        console.log("BioNotation colors auto-applied on activation.");
    }
}

export async function deactivate(): Promise<void> {
    // toggleBioNotation(context);
    await removeTokenColors(); // Always remove
    await updateEnabledFlag(false); // Clear flag
    console.log("BioNotation colors removed on deactivation.");
}

export function isFastaFile(filename: string): boolean {
    return /\.(fa|fasta|fastq)$/i.test(filename);
}

// module.exports = {
//     activate,
//     deactivate,
//     isFastaFile
// };

// export async function activate(context){
    // const toggleCommand = vscode.commands.registerCommand("bioNotation.toggleColors", async () =>{
    //     const config = vscode.workspace.getConfiguration();
    //     if(await isActive()){
    //         await removeTokenColors();
    //         await config.update("bioNotation.enabled", false, vscode.ConfigurationTarget.Global);
    //         console.log("TOGGLE TRIGGERED")
    //         vscode.window.showInformationMessage("BioNotation colors Deactivated.");
    //     }else{
    //         await patchTokenColors(context);
    //         await config.update("bioNotation.enabled", true, vscode.ConfigurationTarget.Global);
    //         console.log("TOGGLE TRIGGERED")
    //         vscode.window.showInformationMessage("BioNotation colors Activated.");
    //     }
    // });

    // const clearCommand = vscode.commands.registerCommand("bioNotation.clearColors", async () => {
    //     await removeTokenColors();
    //     await vscode.workspace.getConfiguration().update("bioNotation.enabled", false, vscode.ConfigurationTarget.Global);
    //     vscode.window.showInformationMessage("BioNotation colors forcibly cleared.");
    // });
    // context.subscriptions.push(toggleCommand, clearCommand);

    // if (await isActive()) {
    //     await patchTokenColors(context);
    //     console.log("BioNotation colors auto-applied on activation.");
    // }
// }