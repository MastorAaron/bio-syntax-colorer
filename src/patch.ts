import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { boolUtils } from "./booleans";
import * as def from "./definitions";
import { vscUtils } from "./vscUtils";
import { version } from "../package.json";

const DEFAULT_PALETTE = "fasta-colors.json";

export class PatchColors{
    // private static readonly DEFAULT_PALETTE = DEFAULT_PALETTE ;
    private vscCOUT = vscUtils.vscCOUT;
    private globalConfig = vscUtils.globalConfig;
    private editorConfig = vscUtils.editorConfig;
    private currCustomization = vscUtils.currCustomization;

    constructor(private context: vscode.ExtensionContext) {
        this.vscCOUT(`PatchColors initialized with context: {this.context.extensionPath}`);
    }

    public mappingRule(rule: def.ColorRule): def.ColorRule{
        return{
            ...rule,
            name: rule.name.startsWith("bio-colorer@")
            ? rule.name
            :`bio-colorer@${version}: ${rule.name || "unnamed"}`
        };
    }

    public tagColorsGenRules(colors: def.ColorRule[]): def.ColorRule[]{
        const tagged = colors.map(rule =>
            boolUtils.isAlreadyTagged(rule)? rule : this.mappingRule(rule)
        );
        this.vscCOUT(`Tagged rules: ${tagged}`);   
        return tagged;     
    }

    public loadColors(filename = DEFAULT_PALETTE): def.ColorRule[]{
        const colorPath = path.isAbsolute(filename)
        ? filename
        : path.join(this.context.extensionPath, "palettes", path.basename(filename));
    
        // path.join(context.extensionPath, "fasta-colors.json")
        if (!fs.existsSync(colorPath)) {
            throw new Error(`Color file not found: ${colorPath}`);
        }
        const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));
        
        this.vscCOUT(`Loaded colors from ${filename}: ${colors.tokenColors.length} rules`);
        this.vscCOUT(`Loaded colors: ${colors.tokenColors}`);
        return colors.tokenColors
    }
    
    public editColorRule(rule: def.ColorRule, newColor: string): def.ColorRule {
        if (!boolUtils.isValidRule(rule)){ 
            this.vscCOUT("Invalid rule provided for editing.");
            return rule;
        }
        const updatedRule: def.ColorRule = {
            ...rule,   
            settings: {
                ...rule.settings,
                foreground: newColor
            }
            
        }
        return updatedRule;
    }
   
    public toggleHighlight(rule: def.ColorRule){
        if (!boolUtils.isValidRule(rule)) {
            this.vscCOUT("Invalid rule provided for toggling highlight.");
            return rule;
        }
        
        let currColor = rule.settings?.foreground || "#000000"; // Default to black if no color set
        if (!boolUtils.isValidColor(currColor)) {
            this.vscCOUT(`Invalid color: ${currColor}. Defaulting to red highlight.`);
            currColor = "#FF0000"; // Default to red if current color is invalid
        }
    
        const updatedRule: def.ColorRule = {
            ...rule,
            settings: {
                ...rule.settings,
                foreground: rule.settings?.foreground === "#FF0000" // Toggle between red and original color
                    ? rule.settings?.foreground // Keep original color
                    : "#FF0000" // Highlight with red
            }
        };
        
        this.vscCOUT(`Toggled highlight for rule: ${updatedRule.name}`);
        return updatedRule;
    }
    
    private mergeRules(newRules : Array<def.ColorRule>){
        const customization = this.currCustomization(this.globalConfig());
        
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
    
    private async applyCustomTokens(customization: Record<string,unknown>): Promise<void> {
        const config = this.editorConfig();
        
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
            const merged = this.mergeRules(tagged);
            
            await this.applyCustomTokens(merged);
            this.vscCOUT("BioNotation patch applied.");
        }catch(err){
            this.vscCOUT(`Failed to apply BioNotation patch: ${err}`)
        }
    }
    
    public async removeTokenColors(): Promise<void> { 
        const config = this.editorConfig();
        const customization = this.currCustomization(config);
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