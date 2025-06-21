const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { version } = require("./package.json");

async function patchTokenColors(context) {
    const colorPath = path.join(context.extensionPath, "fasta-colors.json");

    try {
        const data = JSON.parse(fs.readFileSync(colorPath, "utf8"));
        let rules = data.tokenColors;

        // Inject version comment into each rule
         rules = rules.map(rule => ({
            ...rule,
            comment: `bio-colorer@${version}`
        }));

        const config = vscode.workspace.getConfiguration("editor");
        const customization = vscode.workspace.getConfiguration("editor").get("tokenColorCustomizations") || {};
        customization.textMateRules = (customization.textMateRules || []).concat(rules);

            await vscode.workspace.getConfiguration().update(
            "editor.tokenColorCustomizations",
            customization,
            vscode.ConfigurationTarget.Global
        );
        
        console.log("BioNotation patch applied.");
    }catch(err){
        console.error("Failed to apply BioNotation patch: ", err)
    }
}

async function removeTokenColors() { 
    const config = vscode.workspace.getConfiguration();
    const current = config.get("editor.tokenColorCustomizations") || {};

    const cleanedRules = Array.isArray(current.textMateRules)
    ? current.textMateRules.filter(rule => {
        const comment = rule.comment || "";
        return !comment.startsWith("bio-colorer@");
      })
    : [];

    if (current.textMateRules && cleanedRules.length === current.textMateRules.length) {
        return; // No bio-colorer rules to remove
    }

    const newConfig = {
        ...current,
        textMateRules: cleanedRules
    };

    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Workspace);
}

module.exports = {
    patchTokenColors,
    removeTokenColors
};