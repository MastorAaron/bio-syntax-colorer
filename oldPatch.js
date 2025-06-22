const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { version } = require("./package.json");

//Original Build
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
        const customization = config.get("tokenColorCustomizations") || {};
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

function tagColorsGenRules(colors){
    return colors.map(rule => ({
            ...rule,
            comment: `bio-colorer@${version}`
        }));
}

function loadColors(context){
    const colorPath = path.join(context.extensionPath, "fasta-colors.json");
    const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));

    return colors

}

function mergeRules(){
    const config = vscode.workspace.getConfiguration("editor");
    const customization = config.get("tokenColorCustomizations") || {};
    customization.textMateRules = (customization.textMateRules || []).concat(rules);
}

async function applyCustomTokens(customization){
    await vscode.workspace.getConfiguration().update(
        "editor.tokenColorCustomizations",
        customization,
        vscode.ConfigurationTarget.Global
    );
}

async function patchTokenColors(context){
    try{
        let colors = loadColors(context);
        let taggedRules = tagColorsGenRules(colors)
        const updatedRules = mergeRules(taggedRules);

        await applyCustomTokens(updatedRules);
        console.log("BioNotation patch applied.");
    }catch(err){
        console.error("Failed to apply BioNotation patch: ", err)
    }
}

module.exports = {
    patchTokenColors
};