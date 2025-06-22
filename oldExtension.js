const vscode = require("vscode");
const { patchTokenColors } = require("./patch");

async function activateORI(context){
    const toggleCommand = vscode.commands.registerCommand("bioNotation.toggleColors", async () =>{
        if(await isActive()){
            await removeTokenColors() 
            vscode.window.showInformationMessage("BioNotation colors Deactivated.");
        }else{
            await patchTokenColors(context);
            vscode.window.showInformationMessage("BioNotation colors Activated.");
        }
    });

    context.subscriptions.push(toggleCommand);
    
    if (!await isActive()) {
        await patchTokenColors();
        console.log("BioNotation Extension Activated.");
    }
}

async function deactivateORI() { 
    const config = vscode.workspace.getConfiguration();
    const current = config.get("editor.tokenColorCustomizations") || {};

    const cleanedRules = Array.isArray(current.textMateRules)
    ? current.textMateRules.filter(rule => {
        const comment = rule.comment || "";
        return !comment.startsWith("bio-colorer@");
      })
    : [];

    const newConfig = {
        ...current,
        textMateRules: cleanedRules
    };
   await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Workspace);
}

async function updateEnabledFlag(value){ 
    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Workspace);
}

async function isActive(){
    const config = vscode.workspace.getConfiguration();
    return config.get("bioNotation.enabled");
    // const current = config.get("editor.tokenCustomizations") || {};
    // const currRULES = current.textMateRules || [];
    
    // return currRULES.some(rule =>
    //     typeof rule.comment === "string" && rule.comment.startsWith("bio-colorer@")
    // );
    // return config.get("bioNotation.enabled");
}

async function activate(context){
    // Define each command
    const toggleCommand = vscode.commands.registerCommand(
        "bioNotation.toggleColors", async () =>{
            if(await isActive()){
                await removeTokenColors() 
                vscode.window.showInformationMessage("BioNotation colors Deactivated.");
            }else{
                await patchTokenColors(context);
                vscode.window.showInformationMessage("BioNotation colors Activated.");
            }
        }
    );

    //Push each command
    context.subscriptions.push(toggleCommand);

    // Auto-apply if enabled
    if (!await isActive()) {
        await patchTokenColors();
        console.log("BioNotation Extension Activated.");
    }
}

// function deactivate() {
//     const config = vscode.workspace.getConfiguration();
//     config.update("editor.tokenColorCustomizations", undefined, vscode.ConfigurationTarget.Workspace);
// }

async function deactivate() { 
    await removeTokenColors();
    await updateEnabledFlag(false);
}



async function removeTokenColors(){
    const config = vscode.workspace.getConfiguration();
    const current = config.get("editor.tokenColorCustomizations") || {};

    const cleanedRules = 
        Array.isArray(current.textMateRules)?
        current.textMateRules.filter(rule => {
            const comment = rule.comment || "";
            return !comment.startsWith("bio-colorer@");
        })
    : [];

    const newConfig = {
        ...current,
        textMateRules: cleanedRules
    };

}

module.exports = {
    activate,
    deactivate
};