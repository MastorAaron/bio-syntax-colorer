const vscode = require("vscode");
const { patchTokenColors, removeTokenColors } = require("./patch");

async function updateEnabledFlag(value){   
    await vscode.workspace.getConfiguration().update("bioNotation.enabled", value, vscode.ConfigurationTarget.Workspace);
}

async function applyBioNotation(context){
    // await removeTokenColors(); // always clean first
    await patchTokenColors(context);
    await updateEnabledFlag(true);
    vscode.window.showInformationMessage("BioNotation colors applied.");
}

async function clearBioNotation(context){
    await removeTokenColors(context);
    await updateEnabledFlag(false);
    vscode.window.showInformationMessage("BioNotation colors cleared.");
}

async function toggleBioNotation(context){
    if(await isActive()){
        await clearBioNotation(context);
        console.log("BioNotation deactivated via toggle.");
    }else{
        await applyBioNotation(context);
        console.log("BioNotation activated via toggle.");
    }
}

async function isActive(){
    const config = vscode.workspace.getConfiguration();
    return config.get("bioNotation.enabled") === true; 
    // Only treat *true* as active
}

function DefineCommands(context){
    const toggleCommand = vscode.commands.registerCommand(
        "bioNotation.toggleColors", async () => {
            await toggleBioNotation(context);
            console.log("BioNotation Toggled.");
        }
    );
    
    const clearCommand = vscode.commands.registerCommand(
        "bioNotation.clearColors", async () => {
            await clearBioNotation(context); 
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

async function activate(context){
    DefineCommands(context);

    if(await isActive()){ 
        // toggleBioNotation(context);
        await patchTokenColors(context); // Only apply if enabled
        console.log("BioNotation colors auto-applied on activation.");
    }
}

async function deactivate() {
    // toggleBioNotation(context);
    await removeTokenColors(); // Always remove
    await updateEnabledFlag(false); // Clear flag
    console.log("BioNotation colors removed on deactivation.");
}

module.exports = {
    activate,
    deactivate
};

// async function activate(context){
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