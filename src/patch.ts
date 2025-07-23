import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { version } from "../package.json";

import { boolUtils } from "./booleans";
import * as def from "./definitions";
import HoverOver from './hoverOver';

import { vscUtils, themeUtils } from "./vscUtils";
import { FileMeta, FilePath, JsonFile, ColorFile } from "./fileMeta";
import { DEFAULT_PHRED, PhredType } from "./phredHandler";
import { HoverObj } from "./hoverOver";


// import hoverOver from "./hoverOver";

const DEFAULT_PALETTE = "fasta-colors-warm.json";

export class PatchColors{
    // private static readonly DEFAULT_PALETTE = DEFAULT_PALETTE ;
    private print = vscUtils.print;
    private workspaceConfig = vscUtils.editorConfig();
    private currCustomization = vscUtils.currCustomization;

    constructor(private context: vscode.ExtensionContext, private meta: FileMeta) {
        this.print(`PatchColors initialized with context: ${this.context.extensionPath}`);
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
    
    public async loadColors(filename = DEFAULT_PALETTE as ColorFile): Promise<def.ColorRule[]>{
        // path.join(context.extensionPath, "fasta-colors.json")
        return await this.loadColorsFromPath(this.meta.fullFilePath as FilePath);
    }

  

    public async loadColorsFromPath(colorPath: FilePath): Promise<def.ColorRule[]>{
        if (!fs.existsSync(colorPath)) {
            throw new Error(`Color file not found: ${colorPath}`);
        }
        const colors = JSON.parse(fs.readFileSync(colorPath, "utf8"));
        const rules = colors.tokenColors as def.ColorRule[];

        this.print(`Loaded colors from ${colorPath}: ${rules.length} rules`);
        
        const activeDoc = vscUtils.getActiveFileType();
        const isFastq = activeDoc && boolUtils.isFastqFile(activeDoc.fileName);
            return rules;
    }
    
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
        // print("Final rules to apply:", updatedRules);
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
        
        this.print(`Writing customization to editor.tokenColorCustomizations: ${customization}`);
        await config.update(
            "tokenColorCustomizations", 
            customization,
            vscode.ConfigurationTarget.Workspace
        );
        this.print("Custom token colors applied.");
    }

    public async patchTokenColors(fileName : ColorFile = DEFAULT_PALETTE): Promise<void> {
        try{
            let rules    = await this.loadColors(fileName);
            let tagged   = this.tagColorsGenRules(rules)
            this.print(`Tagged rules: ${fileName}`);//TODO: this prints Tagged rules: [object Object], X 34 not great 
            const merged = this.mergeRules(tagged);
            
            await this.applyCustomTokens(merged);
            this.print("BioNotation patch applied.");
        }catch(err){
            this.print(`Failed to apply BioNotation patch: ${err}`)
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

        // ✅ NEW: Also try to remove global if it matches or includes our tags
        const globalConfig = vscUtils.globalConfig();
        const globalCustomization = vscUtils.currCustomization(globalConfig);

        if (Array.isArray(globalCustomization.textMateRules)) {
            const stillTagged = globalCustomization.textMateRules.some(rule =>
                boolUtils.isAlreadyTagged(rule)
            );

            if (stillTagged) {
                await globalConfig.update(
                    "tokenColorCustomizations",
                    undefined,
                    vscode.ConfigurationTarget.Global
                );
                this.print("BioNotation cleared from global settings.");
            }

    }
    }
}

let patcherInstance: PatchColors;


    // public loadColors(filename = DEFAULT_PALETTE): def.ColorRule[]{
    //     const colorPath = path.isAbsolute(filename)
    //     ? filename
    //     : path.join(this.context.extensionPath, "palettes", path.basename(filename));

    
    //     // path.join(context.extensionPath, "fasta-colors.json")
    //     return this.loadColorsFromPath(colorPath as PaletteFilePath);
    // }

    

    // public editColorRule(rule: def.ColorRule, newColor: def.colorHex): def.ColorRule {
    //     if (!boolUtils.isValidRule(rule)){ 
    //         this.print("Invalid rule provided for editing.");
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
   