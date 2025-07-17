import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { version } from "../package.json";

import { boolUtils } from "./booleans";
import * as def from "./definitions";

import { vscUtils, themeUtils } from "./vscUtils";
import { FileMeta, FilePath, JsonFile, ColorFile } from "./fileMeta";

import colorMath from "./colorInverter";
// import hoverOver from "./hoverOver";

const DEFAULT_PALETTE = "fasta-colors.json";

export class PatchColors{
    // private static readonly DEFAULT_PALETTE = DEFAULT_PALETTE ;
    private vscCOUT = vscUtils.vscCOUT;
    private workspaceConfig = vscUtils.editorConfig();
    private currCustomization = vscUtils.currCustomization;
    private colorUtil = new colorMath(this.context);


    constructor(private context: vscode.ExtensionContext, private meta: FileMeta) {
        this.vscCOUT(`PatchColors initialized with context: ${this.context.extensionPath}`);
    }

    public versionTagRule(rule: def.ColorRule): def.ColorRule{
        return this.tagRule(rule);
    }
    
    public userTagRule(rule: def.ColorRule): def.ColorRule{
       return this.tagRule(rule,"userRule");
    }

    public highLightTagRule(rule: def.ColorRule): def.ColorRule{
       return this.tagRule(rule,"highLightRule");
    }

    private tagRule(rule: def.ColorRule, category?: string): def.ColorRule{
        if(boolUtils.isAlreadyTagged(rule)) return rule;

        const categorySuffix = category ? ` ${category}` : "";
        return{
            ...rule,
            name :`bio-colorer@${version}: ${rule.name || "unnamed"}${categorySuffix}`
        };
    }

    public tagColorsGenRules(colors: def.ColorRule[], category?: def.TagCategory): def.ColorRule[]{
        const tagged = colors.map(rule =>
            boolUtils.isAlreadyTagged(rule)
                ? rule 
                : this.tagRule(rule,category)
        );
        
        return tagged;                          //Print FileName or Palette Name instead
    }

    // public loadColors(filename = DEFAULT_PALETTE): def.ColorRule[]{
    //     const colorPath = path.isAbsolute(filename)
    //     ? filename
    //     : path.join(this.context.extensionPath, "palettes", path.basename(filename));

    
    //     // path.join(context.extensionPath, "fasta-colors.json")
    //     return this.loadColorsFromPath(colorPath as PaletteFilePath);
    // }

    public loadColors(filename = DEFAULT_PALETTE): def.ColorRule[]{
        // path.join(context.extensionPath, "fasta-colors.json")
        return this.loadColorsFromPath(this.meta.fullFilePath as FilePath);
    }

    public loadColorsFromPath(colorPath: FilePath): def.ColorRule[]{
        if (!fs.existsSync(colorPath)) {
            throw new Error(`Color file not found: ${colorPath}`);
        }
        const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));
        const rules = colors.tokenColors as def.ColorRule[];
        this.vscCOUT(`Loaded colors from ${colorPath}: ${colors.tokenColors.length} rules`);
        
        return rules;
    }

    // public pullRule(tokenName: string, palettePath: FilePath): def.ColorRule | null {
    //     const palette = this.loadColors(palettePath);
    //     const scope = def.tokenMap[tokenName.toUpperCase() as def.tokenType];
    //     if (!scope) {
    //         this.vscCOUT(`Token "${tokenName}" not found in tokenMap.`);
    //         return null;
    //     }
    //     return palette.find(rule => rule.scope === scope) || null;
    // }//TODO: Implement Edits to rules as a seperate rule with its own "userEdit" Tag
    // //TODO: For ease of deletion and reset to defaults but also prioritization of `UserEdit`s above Default settings
        
        public async ruleHighlight(rule: def.ColorRule): Promise<def.ColorRule | null> {
            if(!rule || !rule.settings) return null;
            
    
            const config = vscUtils.editorConfig();
            const defaultFg = themeUtils.defaultTextColor();  // Adjustable for themes
    
            const textColor  = rule.settings.background || defaultFg 
            const fg = rule.settings.foreground || this.colorUtil.complementaryHex(textColor) || "#FFFFFF";
    
            return {
                ...rule,
                name: `${rule.name || "highlighted-rule"}`,
                settings: {
                    ...rule.settings,
                    foreground: textColor ,
                    background: fg,
                    fontStyle: "bold underline"
                }
            };
        }
    
    // public editColorRule(rule: def.ColorRule, newColor: def.colorHex): def.ColorRule {
    //     if (!boolUtils.isValidRule(rule)){ 
    //         this.vscCOUT("Invalid rule provided for editing.");
    //         return rule;
    //     }
    //     const updatedRule: def.ColorRule = {
    //         ...rule,   
    //         settings: {
    //             ...rule.settings,
    //             foreground: newColor
    //         }
    //     }
    //     return updatedRule;
    // }
   
    // public toggleHighlight(rule: def.ColorRule){
    //     if (!boolUtils.isValidRule(rule)) {
    //         this.vscCOUT("Invalid rule provided for toggling highlight.");
    //         return rule;
    //     }
        
    //     let currColor = rule.settings?.foreground || "#000000"; // Default to black if no color set
    //     if (!boolUtils.isValidColor(currColor)) {
    //         this.vscCOUT(`Invalid color: ${currColor}. Defaulting to red highlight.`);
    //         currColor = "#FF0000"; // Default to red if current color is invalid
    //     }
    
    //     const updatedRule: def.ColorRule = {
    //         ...rule,
    //         settings: {
    //             ...rule.settings,
    //             foreground: rule.settings?.foreground === "#FF0000" // Toggle between red and original color
    //                 ? rule.settings?.foreground // Keep original color
    //                 : "#FF0000" // Highlight with red
    //         }
    //     };
        
    //     this.vscCOUT(`Toggled highlight for rule: ${updatedRule.name}`);
    //     return updatedRule;
    // }
    
    public mergeRules(newRules : def.ColorRule[]){
        const customization = this.currCustomization(vscUtils.globalConfig());
        
        const existing = Array.isArray(customization.textMateRules)
        ? customization.textMateRules
            : [];
        // Keep rules that aren't from source.fasta.* OR are clearly tagged by this extension
        const filtered = 
        existing.filter(rule  => 
            // not !isScoped(rule) || 
            !boolUtils.isAlreadyTagged(rule)
        );
        // vscCOUT("Final rules to apply:", updatedRules);
        return {
            ...customization,
            textMateRules: filtered.concat(newRules)
        };
    }

    public getTokenRepo(palette : any): Array<def.ColorRule>{ //TODO: Possibly Extract Method to vscUtils to Mirror LangHandler as PaletteHandler
    // {
    // "name": "Warm Palette Colors",
    // "description": "Custom overlay intended to Highlight FastA and FastQ files in Dark Mode",
    // "tokenColors": [ ColorRules ]

        palette.tokenColors = Array.isArray(palette.tokenColors) ? palette.tokenColors : [];
        return palette.tokenColors;
    }

    
    private async applyCustomTokens(customization: Record<string,unknown>): Promise<void> {
        const config = this.workspaceConfig;
        
        this.vscCOUT(`Writing customization to editor.tokenColorCustomizations: ${customization}`);
        await config.update(
            "tokenColorCustomizations", 
            customization,
            vscode.ConfigurationTarget.Workspace
        );
        this.vscCOUT("Custom token colors applied.");
    }

    public async patchTokenColors(fileName : string= DEFAULT_PALETTE): Promise<void> {
        try{
            let rules    = this.loadColors(fileName);
            let tagged   = this.tagColorsGenRules(rules)
            this.vscCOUT(`Tagged rules: ${fileName}`);//TODO: this prints Tagged rules: [object Object], X 34 not great 
            const merged = this.mergeRules(tagged);
            
            await this.applyCustomTokens(merged);
            this.vscCOUT("BioNotation patch applied.");
        }catch(err){
            this.vscCOUT(`Failed to apply BioNotation patch: ${err}`)
        }
    }
    
    public async removeTokenColors(): Promise<void> { 
        const config = this.workspaceConfig;
        const customization = this.currCustomization(config);
        const plainCustomization = JSON.parse(JSON.stringify(customization));

        delete plainCustomization["textMateRules"];
        delete plainCustomization["[*Light*]"];
        delete plainCustomization["[*Dark*]"];
        // const customization = config.get("editor.tokenColorCustomizations") || {};
        
        const rules = 
            Array.isArray(customization.textMateRules)
            ?customization.textMateRules 
            :[];
        
            const cleanedRules = rules.filter((rule: def.ColorRule) => !boolUtils.isAlreadyTagged(rule));
            // not ! containsLegacyTag(rule) && !isManualG(rule)
            // not!rule.name?.startsWith("bio-colorer@")
        
        // If no changes are needed, exit early
        if(cleanedRules.length === rules.length || rules.length === 0) return;
        
        const newConfig = {
            ...customization,
            textMateRules: cleanedRules
        };

        await config.update(
            "tokenColorCustomizations",
            newConfig,
            vscode.ConfigurationTarget.Workspace
        );
    }
}

let patcherInstance: PatchColors;