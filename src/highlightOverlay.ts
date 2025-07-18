import * as vscode from "vscode";

export class HighLightOverlayController {
    private highLightTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
    private activehighLights: Map<string, vscode.Range[]> = new Map();

    public getConfig(){
        return vscode.window.activeTextEditor;
    }

    private extractMatchRanges(pattern: string, doc : vscode.TextDocument){
        const regEx = new RegExp(pattern, "gi");
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

    public applyHighLight(pattern: string, color: string){
        const editor = this.getConfig();
        if(!editor) return;
        const doc = editor.document;
       
        const ranges = this.extractMatchRanges(pattern,doc);
        const highLightType = this.defineHighLight(pattern, color);

        editor.setDecorations(highLightType, ranges);
        this.activehighLights.set(pattern, ranges);
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