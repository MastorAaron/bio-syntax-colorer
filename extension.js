const vscode = require("vscode");
const { patchTokenColors } = require("./patch");

function activate(context){
    patchTokenColors(context);
}

// function deactivate() {
//     const config = vscode.workspace.getConfiguration();
//     config.update("editor.tokenColorCustomizations", undefined, vscode.ConfigurationTarget.Workspace);
// }

async function deactivate() { 
    const config = vscode.workspace.getConfiguration();
    const current = config.get("editor.tokenColorCustomizations") || {};

    const cleanedRules = Array.isArray(current.textMateRules)
    ? current.textMateRules.filter(rule => {
        const comment = rule.comment || "";
        return !comment.startsWith("bio-syntax-colorer@");
      })
    : [];

    const newConfig = {
        ...current,
        textMateRules: cleanedRules
    };

    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Workspace);
}

module.exports = {
    activate,
    deactivate
};