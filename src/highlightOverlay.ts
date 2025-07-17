import * as vscode from "vscode";

export class HighLightOverlayController {
    private highLightTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
    private activehighLights: Map<string, vscode.Range[]> = new Map();

    public getConfig(){
        return vscode.window.activeTextEditor;
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
        if(!highLightType){
            highLightType = vscode.window.createTextEditorDecorationType({
                backgroundColor: color,
                borderRadius: "2px"
            });
            this.highLightTypes.set(pattern, highLightType);
        }
        return highLightType;
    }

    public applyHighLight(patternOrRegEx: string | RegExp, color: string){
        const editor = this.getConfig();
        if(!editor) return;
        const doc = editor.document;
       
        const ranges = this.extractMatchRanges(patternOrRegEx,doc);
        const highLightType = this.defineHighLight(patternOrRegEx.toString(), color);

        editor.setDecorations(highLightType, ranges);
        this.activehighLights.set(patternOrRegEx.toString(), ranges);
    }

    public clearAllHighLights(){
        const editor = vscode.window.activeTextEditor;
        if(!editor) return;

        for(const [pattern, highLightType] of this.highLightTypes.entries()){
            editor.setDecorations(highLightType,[]);
        }

        this.highLightTypes.clear();
        this.activehighLights.clear();
        
    }
}

export default new HighLightOverlayController();