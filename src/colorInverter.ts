import * as vscode from "vscode";
import { vscUtils } from "./vscUtils";

export class colorMath{ 
    private vscCOUT = vscUtils.vscCOUT;
   
    constructor(private context: vscode.ExtensionContext) {
        this.vscCOUT("colorMath initialized");
    }
    
    public invertHexColor(hexStr: string): string {
        if (hexStr.length !== 6) return "#FF00FF";  // Failsafe
        let [r, g, b] = this.hexStrToRGB(hexStr);
        return this.rgbToHex(
            this.invertChannel(r),
            this.invertChannel(g),
            this.invertChannel(b)
        );
    }

    public complementaryHex(hexStr:string):string{
        const [r, g, b] = this.hexStrToRGB(hexStr);
        // convert RGB to HLS (note: colorsys uses H, L, S)
        const [h, l, s] = this.rgbToHLS(r, g, b); //Hue, Luminance, Saturation
        const h2 = (h + 0.5) % 1.0;
        const [r2, g2, b2] = this.hlsToRGB(h2, l, s);
        return this.rgbToHex(r2, g2, b2);
    }

    private invertChannel(channel255: number): number {
        return 1.0 - this.scaleChannelToUnit(channel255);
    }

    // Normalize 0-255 channel to 0.0–1.0
    private scaleChannelToUnit(value: number): number {
        return value / 255;
    }
    
    // Convert normalized 0.0–1.0 value to 0-255 channel
    private scaleUnitToChannel(value: number): number {
        return Math.round(value * 255);
    }

    private channelToHex(pureColor:number): string{
        pureColor = this.scaleUnitToChannel(pureColor);
        return pureColor.toString(16).padStart(2, "0").toUpperCase();
    }

    private rgbToHex(r:number, g:number, b:number): string{
       const rHex = this.channelToHex(r);
       const gHex = this.channelToHex(g);
       const bHex = this.channelToHex(b);
       
        return (`#${rHex}${gHex}${bHex}`);
    }

    private parseHexPair(pair: string): number{
        return parseInt(pair, 16); //hexidecimal base 16
    }

    private hexStrToRGB(hexStr: string): [number,number,number]{
        hexStr = this.sanitizeHexStr(hexStr);
        return [
            this.parseHexPair(hexStr.slice(0, 2)),
            this.parseHexPair(hexStr.slice(2, 4)),
            this.parseHexPair(hexStr.slice(4, 6))
        ];
    }

    private sanitizeHexStr(hexStr: string): string{
        hexStr = hexStr.replace(/^#/, "").trim();
        if (!/^[0-9a-fA-F]{6}$/.test(hexStr)) {
            const err = `Invalid hex color: '${hexStr}'`;
            this.vscCOUT(err);
            throw new Error(err);
        }
        return hexStr;
    }

    //Color: (HLS) Hue, Luminance and Saturation //NOTE: adapted from Python's Color Library
    private rgbToHLS(r:number, g:number, b:number): [number,number,number]{
        r= this.scaleChannelToUnit(r);
        g= this.scaleChannelToUnit(g);
        b= this.scaleChannelToUnit(b);

        const maxC = Math.max(r,g,b);
        const minC = Math.min(r,g,b);

        const sumC = maxC + minC;
        const rangeC = maxC - minC;

        const lum = sumC / 2;

        if(minC == maxC){
            return [0.0, lum ,0.0]
        }

        let sat = 0;
        if(lum <= 0.5){
            sat = rangeC / sumC;
        }else{
            sat = rangeC / (2.0 - maxC - minC);
        }

        const rC = (maxC - r)/ rangeC;
        const gC = (maxC - g)/ rangeC;
        const bC = (maxC - b)/ rangeC;

        let hue = 0;
        if(r === maxC){
            hue = bC - gC;
        }else if(g === maxC){
            hue = 2.0 + rC - bC;
        }else{
            hue = 4.0 + gC - rC;
        } 
        hue = (hue / 6.0) % 1.0;
        if(hue < 0){
            hue += 1.0;
        }
        return [hue, lum, sat];
    }
    
    private hlsToRGB(hue:number, lum:number, sat:number): [number,number,number]{ //NOTE: adapted from Python's Color Library
        if(sat === 0.0){
            return [lum,lum,lum];
        }

        const hueToRGB = (m1:number,m2:number,hh:number) => {
            if (hh < 0) hh+=1;
            if (hh > 1) hh-=1;

            if (hh < 1/6) return m1 + (m2 -m1)* hh * 6 ;
            if (hh < 1/2) return m2;
            if (hh < 2/3) return m1 + (m2 -m1)* (2/3 - hh) * 6;
            return m1;
        };

        const m2 = lum <= 0.5 ? lum * (1.0 + sat) : lum + sat - lum * sat;
        const m1 = 2.0 * lum - m2;

        return [
            hueToRGB(m1,m2,hue + 1/3),
            hueToRGB(m1,m2,hue),
            hueToRGB(m1,m2,hue - 1/3),
        ];
    }
}

export default colorMath;