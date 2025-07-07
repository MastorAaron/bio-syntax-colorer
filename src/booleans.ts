import * as def from "./definitions";

export class boolUtils{
    
    static testForFile(fileName: string, extensions: string[]){
        const extPattern = extensions.join("|");
        const pattern = new RegExp(`\\.(${extPattern})$`, "i");
        return pattern.test(fileName);
    }

    static isValidColor(color: string): boolean {
        // Simple regex to check if color is in hex format
        return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
    }


    static isFastaFile(fileName: string): boolean {
        return this.testForFile(fileName, ["fa","fna","faa","fasta","fastq"]);
    }
    static isOriFastaFile(fileName: string): boolean {
        return /\.(fa|fna|faa|fasta|fastq)$/i.test(fileName);
    }
    static isFna(fileName: string): boolean {
        return /\.fna$/i.test(fileName);
    }
    static isFaa(fileName: string): boolean {
        return /\.faa$/i.test(fileName);
    }
    static isGFFFile(fileName: string): boolean {
        return /\.(gff|gff3)$/i.test(fileName);
    }
    static isBEDFile(fileName: string): boolean {
        return /\.(bed)$/i.test(fileName);
    }
    static isGenBankFile(fileName: string): boolean {
        return /\.(gb|gbk)$/i.test(fileName);
    }
    static isVCFFile(fileName: string): boolean {
        return /\.(vcf|vcf.gz)$/i.test(fileName);
    }
    static isSAMFile(fileName: string): boolean {
        return /\.(sam|bam)$/i.test(fileName);
    }
    static isBAMFile(fileName: string): boolean {
        return /\.(bam)$/i.test(fileName);
    }
    static isBigWigFile(fileName: string): boolean {
        return /\.(bw|bigwig)$/i.test(fileName);
    }
    static isBigBedFile(fileName: string): boolean {
        return /\.(bb|bigbed)$/i.test(fileName);
    }
    static isGTFFile(fileName: string): boolean {
        return /\.(gtf|gff)$/i.test(fileName);
    }


    static isSequenceFile(fileName: string): boolean {
        return this.isFastaFile(fileName) || this.isGenBankFile(fileName) || this.isGFFFile(fileName) || this.isBEDFile(fileName);
    }

    static isAnnotationFile(fileName: string): boolean {
        return this.isGFFFile(fileName) || this.isBEDFile(fileName) || this.isGTFFile(fileName) || this.isVCFFile(fileName);
    }           

    static isNull(value: unknown): boolean {
        return value === null;
    }

    static isObj(potObj : unknown): potObj is Record<string, unknown>{
        return potObj !== null
        && typeof potObj === "object" 
        && !Array.isArray(potObj);
    } 
    
    // static containsFrag(value: string | undefined, frag: string | RegExp): boolean {
    //     if (typeof value !== "string") return false;
    //     return frag instanceof RegExp ? frag.test(value) : value.includes(frag);
    // }
    
    static containsFrag(rule: { name?: string }, frag?: string): boolean {
        return typeof rule.name === "string" && typeof frag === "string" && rule.name.includes(frag);
    }

    static containsVersion(rule: { name?: string }): boolean {
        return this.containsFrag(rule, "bio-colorer@");
    }

    static isAlreadyTagged(rule : def.ColorRule): boolean {
        // this.isValidRule(rule) 
        // && 
        return this.containsVersion(rule);
    }

} 