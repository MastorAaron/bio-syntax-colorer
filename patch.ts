import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { version } from "./package.json";

export interface ColorRule {
    name: string;      //optional Name
    scope: string;     //optional Scope
    comment?: string;     //optional Comment
    settings?: {
        foreground: string;
        background?: string; //optional Background color
        fontStyle?: string; //optional Font style
    };
}

export function mappingRule(rule: ColorRule): ColorRule{
    return{
        ...rule,
        name: rule.name.startsWith("bio-colorer@")
        ? rule.name
        :`bio-colorer@${version}: ${rule.name || "unnamed"}`
    };
}

export function isNull(value: unknown): boolean {
    return value === null;
}

export function hasNameStr(rule: ColorRule): boolean {
    return typeof rule.name === "string";
}

//Returns a Boolean at runtime but 
//also verifies the type at compile time
export function isObj(potObj : unknown): potObj is Record<string, unknown>{
    return potObj !== null
    && typeof potObj === "object" 
    && !Array.isArray(potObj);
} 

export function hasSettings(rule : ColorRule): boolean{
    return isObj(rule.settings) 
    && Object.keys(rule.settings).length > 0;
}

export function isCompleteRule(rule : ColorRule): boolean {
    return hasNameStr(rule);
} 

export function isValidRule(rule: unknown): rule is ColorRule {
    return (
        isObj(rule) &&
        !Array.isArray(rule) &&
        typeof (rule as Record<string, unknown>).name === "string"
    );
}

export function isAlreadyTagged(rule : ColorRule): boolean {
    return isValidRule(rule) 
    && rule.name.startsWith("bio-colorer@");
}

interface TokenCustomization {
    textMateRules?: ColorRule[];
    [key: string]: unknown;
}

export function globalConfig(): vscode.WorkspaceConfiguration{
    return vscode.workspace.getConfiguration() || {};
}
export function editorConfig(): vscode.WorkspaceConfiguration{
    return vscode.workspace.getConfiguration("editor") || {};
}

export function currCustomization(config : vscode.WorkspaceConfiguration): TokenCustomization {
    return config.get("tokenColorCustomizations") || {};
}

export function isScoped(rule : ColorRule): boolean {
    const scope = rule.scope || "";
    return typeof scope === "string" && scope.startsWith("source.fasta.");
}

export function tagColorsGenRules(colors: ColorRule[]): ColorRule[]{
    const tagged = colors.map(rule =>
        isAlreadyTagged(rule)? rule : mappingRule(rule)
    );
    console.log("Tagged rules:", tagged);   
    return tagged;     
}

export function loadColors(context: { extensionPath: string }): ColorRule[]{
    const colorPath = path.join(context.extensionPath, "fasta-colors.json")
    const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));
    
    console.log("Loaded colors:", colors.tokenColors);
    return colors.tokenColors
}

export function mergeRules(newRules : Array<ColorRule>){
    const customization = currCustomization(globalConfig());
    
    const existing = Array.isArray(customization.textMateRules)
    ? customization.textMateRules
        : [];
    // Keep rules that aren't from source.fasta.* OR are clearly tagged by this extension
    const filtered = 
    existing.filter(rule  => 
        // not !isScoped(rule) || 
        !isAlreadyTagged(rule)
    );
    // console.log("Final rules to apply:", updatedRules);
    return {
        ...customization,
        textMateRules: filtered.concat(newRules)
    };
}

export async function applyCustomTokens(customization: Record<string,unknown>): Promise<void> {
    const config = editorConfig();

    console.log("Writing customization to editor.tokenColorCustomizations:",  customization);
    await config.update(
        "tokenColorCustomizations", 
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


export function containsTag(category : ColorRule | string): boolean {
    return typeof category === "string" && /^bio(-syntax)?-colorer@/.test(category)  
} 

export function containsLegacyTag(rule  : ColorRule) {
    const comment = rule.comment || "";
    const name = rule.name || "";
    
    return containsTag(comment) || containsTag(name);
}

export function isManualG(rule : ColorRule): boolean {
    return rule.scope === "source.fasta.ntG" && !rule.name;
}

export async function patchTokenColors(context: { extensionPath: string }): Promise<void> {
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

export async function removeTokenColors(): Promise<void> { 
    const config = editorConfig();
    const customization = currCustomization(config);
    // const customization = config.get("editor.tokenColorCustomizations") || {};
    
    const rules = 
        Array.isArray(customization.textMateRules)
        ?customization.textMateRules 
        :[];
    
        const cleanedRules = rules.filter((rule: ColorRule) => !isAlreadyTagged(rule));
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

// module.exports = {
//     patchTokenColors,
//     removeTokenColors,
//     isAlreadyTagged
// };

// module.exports = exports;

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