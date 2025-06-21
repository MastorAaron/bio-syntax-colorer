const vscode = require("vscode");
const { patchTokenColors, removeTokenColors } = require("./patch");

async function isActive(){
    const config = vscode.workspace.getConfiguration();
    // const current = config.get("editor.tokenCustomizations") || {};
    // const currRULES = current.textMateRules || [];
    
    // return currRULES.some(rule =>
    //     typeof rule.comment === "string" && rule.comment.startsWith("bio-colorer@")
    // );
    return config.get("bioNotation.enabled") === true; // Only treat *true* as active
}

async function activate(context){
    const config = vscode.workspace.getConfiguration();

    const toggleCommand = vscode.commands.registerCommand("bioNotation.toggleColors", async () =>{
        if(await isActive()){
            await removeTokenColors();
            await config.update("bioNotation.enabled", false, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage("BioNotation colors Deactivated.");
        }else{
            await patchTokenColors(context);
            await config.update("bioNotation.enabled", true, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage("BioNotation colors Activated.");
        }
    });

    context.subscriptions.push(toggleCommand);

    if (await isActive()) {
        await patchTokenColors(context);
        console.log("BioNotation colors auto-applied on activation.");
    }
}

async function deactivate() {
    await removeTokenColors();
}

module.exports = {
    activate,
    deactivate
};