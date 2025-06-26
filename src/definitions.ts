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

export type PaletteFilePath = string & { readonly __paletteFilePath: unique symbol };