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

    private getTextEditor(): vscode.TextEditor{
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

    private defineHighLight(pattern: string, bgColor: string, fgColor: string){
        let highLightType = this.highLightTypes.get(pattern);
       
        if (highLightType) {
            highLightType.dispose();  // Dispose old decoration before replacing
        }

        highLightType = vscode.window.createTextEditorDecorationType({
            backgroundColor: bgColor,
            color: fgColor,
            borderRadius: "1px",
            // hoverMessage: new vscode.MarkdownString("Reuse command to clear highlight.")
        });
        this.highLightTypes.set(pattern, highLightType);
        return highLightType;
    }

    private extractColor(color : string, token : string ): [ColorHex,ColorHex]{
        if(color === "Comple" || color === "Text"){
            const pair = this.tokenColorMap.get(token.toUpperCase());
            if(!pair){
                const [bgColor, fgColor] = themeUtils.defaultColorPair(); 
                return [bgColor, fgColor]; 
            }  
            color = (color === "Text")? pair[0] : pair[1];
        }  
        return [color as ColorHex, themeUtils.defaultTextColor()];
    }

    public applyHighLight(patternOrRegEx: string | RegExp, color: string){
        const editor = this.getTextEditor();
        if(!editor) return;
        const doc = editor.document;
       
        const raw = (typeof patternOrRegEx === "string") ? patternOrRegEx : patternOrRegEx.source;
        const firstLetter = raw.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();

        const [resolvedColor, fgColor] = this.extractColor(color, firstLetter);
        const ranges = this.extractMatchRanges(patternOrRegEx, doc);
        const highLightType = this.defineHighLight(patternOrRegEx.toString(), resolvedColor, fgColor);

        editor.setDecorations(highLightType, ranges);
        this.activehighLights.set(patternOrRegEx.toString(), ranges);
    }

    public clearAllHighLights(){
        const editor = this.getTextEditor();
        if(!editor) return;

        for(const [pattern, highLightType] of this.highLightTypes.entries()){
            editor.setDecorations(highLightType,[]);
        }

        this.highLightTypes.clear();
        this.activehighLights.clear();
    }
}

export default new HighLightOverlay();