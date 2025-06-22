const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { version } = require("./package.json");

function mappingRule(rule){
    return{
        ...rule,
        name: rule.name?.startsWith("bio-colorer@")?
        rule.name:
        `bio-colorer@${version}: ${rule.name || "unnamed"}`
    };
}

function isAlreadyTagged(rule){
    const name = rule.name;
    return typeof name === "string" && name.startsWith("bio-colorer@");
}

function globalConfig(){
    return vscode.workspace.getConfiguration() || {};
}

function editorConfig(){
    return vscode.workspace.getConfiguration("editor") || {};
}

function currCustomization(config){
    return config.get("editor.tokenColorCustomizations") || {};
}

function isScoped(rule){
    const scope = rule.scope || "";
    return typeof scope === "string" && scope.startsWith("source.fasta.");
}

function tagColorsGenRules(colors){
    const tagged = colors.map(rule =>
        isAlreadyTagged(rule)? rule : mappingRule(rule)
    );
    console.log("Tagged rules:", tagged);   
    return tagged;     
}

function loadColors(context){
    const colorPath = path.join(context.extensionPath, "fasta-colors.json")
    const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));

    console.log("Loaded colors:", colors.tokenColors);
    return colors.tokenColors
}

function mergeRules(newRules){
    const customization = currCustomization(globalConfig());

    const existing = Array.isArray(customization.textMateRules)
        ? customization.textMateRules
        : [];
    // Keep rules that aren't from source.fasta.* OR are clearly tagged by this extension
    const filtered = 
        existing.filter(rule => 
            // not !isScoped(rule) || 
            !isAlreadyTagged(rule)
        );
    // console.log("Final rules to apply:", updatedRules);
    return {
        ...customization,
        textMateRules: filtered.concat(newRules)
    };
}

async function applyCustomTokens(customization){
    const config = globalConfig();

    console.log("Writing customization to editor.tokenColorCustomizations:",  customization);
    await config.update(
        "editor.tokenColorCustomizations", 
        customization,
        vscode.ConfigurationTarget.Workspace
    );
    console.log("Custom token colors applied.");
}
    // const payload = {
    //     textMateRules: customization.textMateRules || []
    // };
    // try{
    //     await config.update(
    //         "tokenColorCustomizations",
    //         payload,
    //         vscode.ConfigurationTarget.Workspace
    //     );
    //     console.log("Custom token colors applied.");
    // }catch(err){
    //     console.error("Failed to update config:", err);
    // }

    // await config.update(
    //     "tokenColorCustomizations",
    //     customization,
    //     vscode.ConfigurationTarget.Global
    // );
    
    // await config.update(
    //     "bioNotation.enabled",
    //     true,
    //     vscode.ConfigurationTarget.Global
    // );
// }


function containsTag(category){
    return typeof category === "string" && /^bio(-syntax)?-colorer@/.test(category)  
} 

function containsLegacyTag(rule) {
    const comment = rule.comment || "";
    const name = rule.name || "";

    return containsTag(comment) || containsTag(name);
}

function isManualG(rule) {
    return rule.scope === "source.fasta.ntG" && !rule.name;
}

async function patchTokenColors(context){
    try{
        let rules    = loadColors(context);
        let tagged   = tagColorsGenRules(rules)
        const merged = mergeRules(tagged);

        await applyCustomTokens(merged);
        console.log("BioNotation patch applied.");
    }catch(err){
        console.error("Failed to apply BioNotation patch: ", err)
    }
}

async function removeTokenColors() { 
    const config = editorConfig();
    // const customization = currCustomization(config);
    const customization = config.get("editor.tokenColorCustomizations") || {};
    
    const rules = 
        Array.isArray(customization.textMateRules)
        ?customization.textMateRules 
        :[];
    
        const cleanedRules = rules.filter(rule => !isAlreadyTagged(rule));
        // not ! containsLegacyTag(rule) && !isManualG(rule)
        // not!rule.name?.startsWith("bio-colorer@")
    
    // If no changes are needed, exit early
    if(cleanedRules.length === rules.length || rules.length === 0) return;
    
    const newConfig = {
        ...customization,
        textMateRules: cleanedRules
    };

    await config.update(
        "editor.tokenColorCustomizations",
        newConfig,
        vscode.ConfigurationTarget.Workspace
    );
}

module.exports = {
    patchTokenColors,
    removeTokenColors
};

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
//             "editor.tokenColorCustomizations", //Wrong
//             customization,
//             vscode.ConfigurationTarget.Global
//         );
        
//         console.log("BioNotation patch applied.");
//     }catch(err){
//         console.error("Failed to apply BioNotation patch: ", err)
//     }
// }