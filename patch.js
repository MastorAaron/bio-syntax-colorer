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

function mappingRule(rule){
    return{
        ...rule,
        name: rule.name?.startsWith("bio-colorer@")?
        rule.name:
        `bio-colorer@${version}: ${rule.name || "unnamed"}`
    }
}

function isAlreadyTagged(rule){
    const name = rule.name;
    return typeof name === "string" && name.startsWith("bio-colorer@");
}

function isScoped(rule){
    const scope = rule.scope || "";
    return typeof scope === "string" && scope.startsWith("source.fasta.");
}

function tagColorsGenRules(colors){
    return colors.tokenColors.map(rule =>{
        return isAlreadyTagged(rule)? rule : mappingRule(rule);
        }
    );
}

function loadColors(context){
    const colorPath = path.join(context.extensionPath, "fasta-colors.json")
    const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));

    return colors
}

function mergeRules(newRules){
    const customization = currCustomization(editorConfig());

    const existing = customization.textMateRules || [];
    // Keep rules that aren't from source.fasta.* OR are clearly tagged by this extension
    const filtered = existing.filter(rule => {
            return !isScoped(rule) || isAlreadyTagged(rule);
        }
    );
    return {
        ...customization,
        textMateRules: filtered.concat(newRules)
    };
}


async function applyCustomTokens(customization){
    const config = editorConfig();
    await config.update(
        "tokenColorCustomizations",
        customization,
        vscode.ConfigurationTarget.Workspace
    );
    await config.update(
        "bioNotation.enabled",
        true,
        vscode.ConfigurationTarget.Workspace
    );
    await config.update(
        "tokenColorCustomizations",
        customization,
        vscode.ConfigurationTarget.Global
    );
    await config.update(
        "bioNotation.enabled",
        true,
        vscode.ConfigurationTarget.Global
    );
}


function containsTag(category){
    return typeof category === "string" && /^bio(-syntax)?-colorer@/.test(category)  
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

function editorConfig(){
    return vscode.workspace.getConfiguration("editor");
}

function currCustomization(config){
    return config.get("editor.tokenColorCustomizations") || {};
}

async function removeTokenColors() { 
    const config = editorConfig();
    const customization = currCustomization(config);

    const textMateRules = 
        Array.isArray(customization.textMateRules)
        ?customization.textMateRules 
        :[];

        const cleanedRules = textMateRules.filter(
            rule => !containsLegacyTag(rule) && !isManualG(rule)
        );

    // If no changes are needed, exit early
    if(textMateRules.length === 0 || textMateRules.length === cleanedRules.length) return;
    if(cleanedRules.length === customization.textMateRules.length) return; // No bio-colorer rules to remove

    const newConfig = {
        ...customization,
        textMateRules: cleanedRules
    };

    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Workspace);
    await config.update("editor.tokenColorCustomizations", newConfig, vscode.ConfigurationTarget.Global);
}

async function patchTokenColors(context){
    try{
        let rules = loadColors(context);
        let taggedRules = tagColorsGenRules(rules)
        const updatedRules = mergeRules(taggedRules);

        await applyCustomTokens(updatedRules);
        console.log("BioNotation patch applied.");
    }catch(err){
        console.error("Failed to apply BioNotation patch: ", err)
    }
}


module.exports = {
    patchTokenColors,
    removeTokenColors
};