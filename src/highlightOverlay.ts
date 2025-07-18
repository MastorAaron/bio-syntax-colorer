import * as vscode from "vscode";
import colorMath from "./colorInverter";
import { ColorHex } from "./definitions";
import { themeUtils } from "./vscUtils";


export const ALPHA_ONLY_REGEX = "[a-zA-Z]";
export const NUKE_TOKEN_REGEX = /nt([a-zA-Z])$/;
export const AMINO_TOKEN_REGEX = /aa([a-zA-Z])$/;

export class HighLightOverlay{
    private highLightTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
    private activehighLights: Map<string, vscode.Range[]> = new Map();
    private tokenColorMap: Map<string, [ColorHex, ColorHex]> = new Map;
    // private activeColorMap: Map<string, ColorHex> = new Map;


    constructor(){
        this.initColorMap();
    }

    private isColorRule(rule: any){
        return rule.name?.includes("bio-colorer@") && typeof rule.scope == "string" && rule.settings?.foreground;
    }

    // private
    public extractToken(scope : any): string| undefined{
        const letterMatch = scope.match(NUKE_TOKEN_REGEX) || scope.match(AMINO_TOKEN_REGEX);
        if (letterMatch){//array
            console.log(letterMatch)
            const letter = letterMatch[1].toUpperCase();
            return letter;
        }
        return;
    }

    public initColorMap(): void{
        const config = this.getWorkSpaceConfig();
        const customization = config.get("tokenColorCustomizations") as {textMateRules?: any[]};
        const rules = customization?.textMateRules || [];

        this.tokenColorMap.clear();

        for(const rule of rules){
            if(this.isColorRule(rule)){
                const scope = rule.scope; 
                const textColor = rule.settings.foreground; 
                const compColor = colorMath.complementaryHex(textColor); 

                const letter = this.extractToken(scope);
                if(letter){
                    this.tokenColorMap.set(letter, [textColor as ColorHex, compColor as ColorHex]);
                }
            }
        }
    }

    private getVscTextEditor(): vscode.TextEditor{
        return vscode.window.activeTextEditor!;
    } 
    
    private getWorkSpaceConfig(){
        return vscode.workspace.getConfiguration("editor");
    } 

    private extractMatchRanges(patternOrRegEx: string  | RegExp, doc : vscode.TextDocument){
        const regEx = typeof patternOrRegEx === "string" ? new RegExp(patternOrRegEx, "gi") : patternOrRegEx;
        // const regEx = new RegExp(patternOrRegEx, "gi");
        const ranges: vscode.Range[] = [];

        for(let i=0; i< doc.lineCount; i++){
            const line = doc.lineAt(i);
            let match: RegExpExecArray | null;
            while((match = regEx.exec(line.text)) !== null){
                const start = new vscode.Position(i, match.index);
                const end = new vscode.Position(i, match.index + match[0].length);
                ranges.push(new vscode.Range(start,end));
            }
        }
        return ranges;
    }

    private defineHighLight(pattern: string, color: string){
        let highLightType = this.highLightTypes.get(pattern);
       
        if (highLightType) {
            highLightType.dispose();  // Dispose old decoration before replacing
        }

        highLightType = vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            borderRadius: "2px",
            // hoverMessage: new vscode.MarkdownString("Reuse command to clear highlight.")
        });
        this.highLightTypes.set(pattern, highLightType);
        return highLightType;
    }

    private extractColor(color : string, token : string ): ColorHex{
        if(color === "Comple" || color === "Text"){
            const pair = this.tokenColorMap.get(token.toUpperCase());
            if(!pair){
                return themeUtils.defaultTextColor() as ColorHex; 
            }  
            color = (color === "Text")? pair[0] : pair[1];
        }  
        return color as ColorHex;
    }

    // private buildActiveColorMap(patternOrRegEx: string | RegExp, baseColor: string){
    //     const raw = (typeof patternOrRegEx === "string")? patternOrRegEx: patternOrRegEx.source;
    //     const letters = Array.from(new Set(raw.replace(/[^A-Za-z]/g,"").toUpperCase()));

    //     this.activeColorMap.clear();
    //     for(const letter of letters){
    //         const color = this.extractColor(baseColor, letter);
    //         this.activeColorMap.set(letter, color);
    //     }
    // }

    // public applyHighLightSwitch(patternOrRegEx: string | RegExp, color: string){
    //     const editor = this.getVscTextEditor();
    //     if (!editor) return;
    //     const doc = editor.document;
        
    //     if((patternOrRegEx).toString.length === 1){
    //         color = this.extractColor(color, patternOrRegEx.toString());
    //         this.applyHighLight(patternOrRegEx, color);
    //     }else{
    //         const raw = (typeof patternOrRegEx === "string") ? patternOrRegEx : patternOrRegEx.source;
    //         const firstLetter = raw.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();

    //         const resolvedColor = this.extractColor(color, firstLetter);
    //         this.applyHighLight(patternOrRegEx,resolvedColor);
    //         return;
    //     }
    // }

    // public applyHighLightSwitch(patternOrRegEx: string | RegExp, color: string) {
    //     const editor = this.getVscTextEditor();
    //     if (!editor) return;
    //     const doc = editor.document;

    //     this.buildActiveColorMap(patternOrRegEx, color);
    //     const allRanges: vscode.Range[] = [];

    //     for (const [letter] of this.activeColorMap.entries()) {
    //         const regEx = new RegExp(letter, "gi");
    //         const ranges = this.extractMatchRanges(regEx, doc);
    //         allRanges.push(...ranges);
    //     }

    //     const highLightType = this.defineHighLight(patternOrRegEx.toString(), color);
    //     editor.setDecorations(highLightType, allRanges);
    //     this.activehighLights.set(patternOrRegEx.toString(), allRanges);
    // }

    public applyHighLight(patternOrRegEx: string | RegExp, color: string){
        const editor = this.getVscTextEditor();
        if(!editor) return;
        const doc = editor.document;
       
        const raw = (typeof patternOrRegEx === "string") ? patternOrRegEx : patternOrRegEx.source;
        const firstLetter = raw.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();

        const resolvedColor = this.extractColor(color, firstLetter);

        // Clear existing highlight if present
        // const patternKey = patternOrRegEx.toString();
        // if (this.highLightTypes.has(patternKey)) {
        //     const previousType = this.highLightTypes.get(patternKey)!;
        //     editor.setDecorations(previousType, []);
        // }

        const ranges = this.extractMatchRanges(patternOrRegEx, doc);
        const highLightType = this.defineHighLight(patternOrRegEx.toString(), resolvedColor);

        editor.setDecorations(highLightType, ranges);
        this.activehighLights.set(patternOrRegEx.toString(), ranges);
    }

    public clearAllHighLights(){
        const editor = this.getVscTextEditor();
        if(!editor) return;

        for(const [pattern, highLightType] of this.highLightTypes.entries()){
            editor.setDecorations(highLightType,[]);
        }

        this.highLightTypes.clear();
        this.activehighLights.clear();
        
    }
}

export default new HighLightOverlay();