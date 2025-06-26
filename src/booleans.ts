import * as def from "./definitions";

export class boolUtils{
    static isFastaFile(filename: string): boolean {
        return /\.(fa|fasta|fastq)$/i.test(filename);
    }
    static isGFFFile(filename: string): boolean {
        return /\.(gff|gff3)$/i.test(filename);
    }
    static isBEDFile(filename: string): boolean {
        return /\.(bed)$/i.test(filename);
    }
    static isGenBankFile(filename: string): boolean {
        return /\.(gb|gbk)$/i.test(filename);
    }
    static isVCFFile(filename: string): boolean {
        return /\.(vcf|vcf.gz)$/i.test(filename);
    }
    static isSAMFile(filename: string): boolean {
        return /\.(sam|bam)$/i.test(filename);
    }
    static isBAMFile(filename: string): boolean {
        return /\.(bam)$/i.test(filename);
    }
    static isBigWigFile(filename: string): boolean {
        return /\.(bw|bigwig)$/i.test(filename);
    }
    static isBigBedFile(filename: string): boolean {
        return /\.(bb|bigbed)$/i.test(filename);
    }
    static isGTFFile(filename: string): boolean {
        return /\.(gtf|gff)$/i.test(filename);
    }


    static isSequenceFile(filename: string): boolean {
        return this.isFastaFile(filename) || this.isGenBankFile(filename) || this.isGFFFile(filename) || this.isBEDFile(filename);
    }

    static isAnnotationFile(filename: string): boolean {
        return this.isGFFFile(filename) || this.isBEDFile(filename) || this.isGTFFile(filename) || this.isVCFFile(filename);
    }           

    static isNull(value: unknown): boolean {
        return value === null;
    }
    
    static hasNameStr(rule: def.ColorRule): boolean {
        return typeof rule.name === "string";
    }
    
    //Returns a Boolean at runtime but 
    //also verifies the type at compile time
    static isObj(potObj : unknown): potObj is Record<string, unknown>{
        return potObj !== null
        && typeof potObj === "object" 
        && !Array.isArray(potObj);
    } 
    
    static hasSettings(rule : def.ColorRule): boolean{
        return this.isObj(rule.settings) 
        && Object.keys(rule.settings).length > 0;
    }
    
    static isCompleteRule(rule : def.ColorRule): boolean {
        return this.hasNameStr(rule);
    } 
    
    static isValidRule(rule: unknown): rule is def.ColorRule {
        return (
            this.isObj(rule) &&
            !Array.isArray(rule) &&
            typeof (rule as Record<string, unknown>).name === "string"
        );
    }
    
    static isAlreadyTagged(rule : def.ColorRule): boolean {
        return this.isValidRule(rule) 
        && rule.name.startsWith("bio-colorer@");
    }

    static containsTag(category : def.ColorRule | string): boolean {
        return typeof category === "string" && /^bio(-syntax)?-colorer@/.test(category);  
    } 
    
    static containsLegacyTag(rule : def.ColorRule) {
        const { containsTag } = this;
        // Check if the rule has a comment or name that contains the legacy tag
        const comment = rule.comment || "";
        const name = rule.name || "";
        
        return containsTag(comment) || containsTag(name);
    }
    
    static isManualG(rule : def.ColorRule): boolean {
        return rule.scope === "source.fasta.ntG" && !rule.name;
    }
    
    static isValidColor(color: string): boolean {
        // Simple regex to check if color is in hex format
        return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
    }


} 