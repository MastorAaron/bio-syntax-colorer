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

    const cleanedRules = (current.textMateRules || []).filter(rule =>  !rule.comment || !rule.comment.startsWith("bio-syntax-colorer")

        return !rule.scope.startsWith("source.fasta.aa");
    });

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