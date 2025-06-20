const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { version } = require("./package.json");

function patchTokenColors(context) {
    const tokenColorPath = path.join(context.extensionPath, "themes", "token-colors.json");

    try {
        const data = JSON.parse(fs.readFileSync(tokenColorPath, "utf8"));
        const rules = data.tokenColors;

        // Inject version comment into each rule
         rules = rules.map(rule => ({
            ...rule,
            comment: `bio-syntax-colorer@${version}`
        }));

        const config = vscode.workspace.getConfiguration("editor");
        const customization = vscode.workspace.getConfiguration("editor").get("tokenColorCustomization") || {};
        customization.textMateRules = (customization.textMateRules || []).concat(rules);

        config.update(
            "tokenColorCustomizations",
            customization,
            vscode.ConfigurationTarget.Global
        );

        vscode.workspace.getConfiguration().update(
            "editor.tokenColorCustomizations",
            customization,
            vscode.ConfigurationTarget.Global
        );
        
        console.log("BioSyntax patch applied.");
    }catch(err){
        console.error("Failed to apply Biosyntax patch: ", err)
    }
}

module.exports = {
    patchTokenColors
};