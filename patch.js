const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { version } = require("./package.json");


// async function patchTokenColors(context) {
//     const colorPath = path.join(context.extensionPath, "fasta-colors.json");

//     try {
//         const data = JSON.parse(fs.readFileSync(colorPath, "utf8"));
//         let rules = data.tokenColors;

//         // Inject version comment into each rule
//         rules = rules.map(rule => ({
//             ...rule,
//             name: rule.name?.startsWith("bio-colorer@") 
//                 ? rule.name 
//                 : `bio-colorer@${version}: ${rule.name || "unnamed"}`
//         }))

//         //mergeWithFilteredExistingRules
//         const config = vscode.workspace.getConfiguration("editor");
//         const customization = vscode.workspace.getConfiguration("editor").get("tokenColorCustomizations") || {};
//         customization.textMateRules = (customization.textMateRules || []).filter(rule => {
//         // Keep rules that aren't from source.fasta.* OR are clearly tagged by this extension
//             const scope = rule.scope || "";
//             const name = rule.name || "";

//             const isFastaScope = typeof scope === "string" && scope.startsWith("source.fasta.");
//             const isTagged = name.startsWith("bio-colorer@");

//             return !isFastaScope || isTagged;
//         }).concat(rules);

//             await vscode.workspace.getConfiguration().update(
//             "editor.tokenColorCustomizations",
//             customization,
//             vscode.ConfigurationTarget.Global
//         );
        
//         console.log("BioNotation patch applied.");
//     }catch(err){
//         console.error("Failed to apply BioNotation patch: ", err)
//     }
// }

function tagRules(data){
    return data.tokenColors.map(rule => ({
        ...rule,
        name: rule.name?.startsWith("bio-colorer@")
            ? rule.name
            : `bio-colorer@${version}: ${rule.name || "unnamed"}`
    }));
}

function loadRules(context){
    const colorPath = path.join(context.extensionPath, "fasta-colors.json")
    const data = JSON.parse(fs.readFileSync(colorPath, "utf8"));

    return tagRules(data)
}

function mergeRules(newRules){
    const config = vscode.workspace.getConfiguration("editor");
    const customization = config.get("tokenColorCustomizations") || {};

    const existing = customization.textMateRules || [];
    const filtered = existing.filter(rule => {
        // Keep rules that aren't from source.fasta.* OR are clearly tagged by this extension
            const scope = rule.scope || "";
            const name = rule.name || "";

            const isFastaScope = typeof scope === "string" && scope.startsWith("source.fasta.");
            const isTagged = name.startsWith("bio-colorer@");

            return !isFastaScope || isTagged
        }
    );
    return {
        ...customization,
        textMateRules: filtered.concat(newRules)
    };
}

async function applyCustomTokens(customization){
    await vscode.workspace.getConfiguration("editor").update(
        "tokenColorCustomizations",
        customization,
        vscode.ConfigurationTarget.Global
    );
}

async function patchTokenColors(context){
    try{
        const rules = loadRules(context);
        const updatedRules = mergeRules(rules);

        await applyCustomTokens(updatedRules);
        console.log("BioNotation patch applied.");
    }catch(err){
        console.error("Failed to apply BioNotation patch: ", err)
    }
    
}

function containsTag(cate){
    return typeof cate === "string" && /^bio(-syntax)?-colorer@/.test(cate)  
    // return comment.startsWith("bio-colorer@") || comment.startsWith("bio-syntax-colorer@");
    // return /^bio(-syntax)?-colorer@/.test(name || ""); 

} 

function containsLegacyTag(rule) {
    const comment = rule.comment || "";
    const name = rule.name || "";

    return containsTag(comment) || containsTag(name);
}

// function REMOVALrules(rules =[]){
//     return rules.filter(rule => {
//         const name = rule.name || "";
//         return !containsTag(name);
//     })
// }

function isManualG(rule) {
  return rule.scope === "source.fasta.ntG" && !rule.name;
}

async function removeTokenColors() { 
    const config = vscode.workspace.getConfiguration();
    const current = config.get("editor.tokenColorCustomizations") 
    || {};

    const textMateRules = 
        Array.isArray(current.textMateRules)? 
        current.textMateRules : [];
    const cleanedRules = textMateRules.filter(
        rule => !containsLegacyTag(rule) && !isManualG(rule)
    );

    if(cleanedRules.length === current.textMateRules.length) return; // No bio-colorer rules to remove

    const newConfig = {
        ...current,
        textMateRules: cleanedRules
    };

    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Global);
    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Workspace);
    // await patchTokenColors(context); // <- Must be here
}

module.exports = {
    patchTokenColors,
    removeTokenColors
};