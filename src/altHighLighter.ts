import * as vscode from "vscode";
import { colorMath } from "./colorInverter";
import { vscUtils } from "./vscUtils";

import { type } from "node:os";


export class HighLightOverlay {
    private overlayMap: Map<string, vscode.TextEditorDecorationType> = new Map();


    private getVscTextEditor(): vscode.TextEditor{
        return vscode.window.activeTextEditor!;
    } 
    
    private getWorkSpaceConfig(){
        return vscode.workspace.getConfiguration("editor");
    } 

    public createOverlayFromScope(scope: string, colorRule: { foreground: string; background?: string; }): void {
        const baseColor = colorRule.foreground || "#FFFFFF";
        const compColor = colorMath.complementaryHex(baseColor);

        const overlay = vscode.window.createTextEditorDecorationType({
            backgroundColor: compColor,
            border: "1px solid black",
        });

        this.overlayMap.set(scope, overlay);
        vscUtils.print(`Overlay created for ${scope} with complementary ${compColor}`);
    }

    public applyOverlay(scope: string, ranges: vscode.Range[]): void {
        const editor = this.getVscTextEditor();
        if (!editor) return;

        const overlay = this.overlayMap.get(scope);
        if (overlay) {
            editor.setDecorations(overlay, ranges);
        }
    }

    public clearOverlays(): void {
        const editor = this.getVscTextEditor();
        if (!editor) return;

        for (const overlay of this.overlayMap.values()) {
            editor.setDecorations(overlay, []);
            overlay.dispose();
        }
        this.overlayMap.clear();
    }
}
