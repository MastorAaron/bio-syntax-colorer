function ASCII_to_int(ascii : string){
    return ascii.charCodeAt(0);
}

function int_to_ASCII(int : number){
    return String.fromCharCode(int);
}

function ASCII_to_Phred(ascii : string, offset : number){
    return ASCII_to_int(ascii) - offset;
}

function phredRangeToRegex(start : number, end : number, offset : number){
    const from = int_to_ASCII(start+offset);
    const to = int_to_ASCII(end+offset);
    return `[${from}-${to}]`;
}


describe('Phred Values', () => {
    test('Phred of !', async () => {
        expect(ASCII_to_Phred('!',33)).toBe(0);
    });
    
    test('Phred of @', async () => {
        expect(ASCII_to_Phred('@',64)).toBe(0);
    });
    
    test('Phred of @', async () => {
        expect(ASCII_to_Phred('@',33)).toBe(31);
    }); 
}); 


describe('ASCII Ranges', () => {
    const lowRange33 = [0,19];
    const midRange33 = [20,29];
    const highRange33 =[30,41];//41
    let offset = 33;
    const numRanges33 = [lowRange33, midRange33, highRange33];
   
    const lowRange64 = [-5,19];
    const midRange64 = [20,29];
    const highRange64 =[30,40];
    offset = 64;
    const numRanges64 = [lowRange64, midRange64, highRange64];
   


    // for(const nums33 of numRanges33){
    //     PhredRangeWrapper(nums33, 33)
    // } 

    //[!-4]
    //[5->] 
    //[?-J]
    
    // PhredRangeWrapper(numRanges64, 64){};
    // }
    //[;-S] 
    //[T-]]
    //[^-h]
    function PhredRangeWrapper(numRanges: [number[],number[],number[]], offset : number){
        for(const nums of numRanges){
            const start = nums[0];
            const end = nums[1];
            console.log(phredRangeToRegex(start, end, offset));
        }
    }
    test('Low Phred+33', async () => {
        expect(phredRangeToRegex(0, 19, 33)).toBe("[!-4]");
    }); 
    test('Mid Phred+33', async () => {
        expect(phredRangeToRegex(20, 29, 33)).toBe("[5->]");
    }); 
    test('High Phred+33', async () => {
        expect(phredRangeToRegex(30, 41, 33)).toBe("[?-J]");
    }); 

    test('Low Phred+64', async () => {
        expect(phredRangeToRegex(-5, 19, 64)).toBe("[;-S]");
    });  
    
    test('Mid Phred+64', async () => {
        expect(phredRangeToRegex(20, 29, 64)).toBe("[T-]]");
    }); 
    test('High Phred+64', async () => {
        expect(phredRangeToRegex(30, 40, 64)).toBe("[^-h]");
    }); 
 
}); 
describe('ASCII Values', () => {
    test('ASCII of !', async () => {
        expect(ASCII_to_int('!')).toBeDefined();
    }); 

    test('ASCII of !', async () => {
        expect(ASCII_to_int('!')).toBe(33);
    });
    
    test('ASCII of !', async () => {
        expect(ASCII_to_int('@')).toBe(64);
    });

    test('ASCII of !', async () => {
        expect(int_to_ASCII(64)).toBe('@');
    });

    test('ASCII of !', async () => {
        expect(int_to_ASCII(33)).toBe('!');
    });
});

import { PhredHover, DEFAULT_PHRED } from '../src/phredHandler';

const qualityLine = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJ";
const hover = new PhredHover(DEFAULT_PHRED);

describe("PhredHover → providePhredInfo", () => {

    // ASCII characters from '!' (33) to 'J' (74)

    test.each(qualityLine.split('').map(c => [c]))(
        "hover text for character '%s'",
        (char) => {
            const result = hover.providePhredInfo(char);
            expect(result).toContain(`Quality Character`);
            expect(result).toContain(char);
            expect(result).toMatch(/Confidence Level: (🥉|🥈|🥇) (Low|Mid|High)/);
        }
    );
});
        
describe("ProvidePhredInfo for High Phred Range", () => {
    it("tests all high outputs", () => {
    for(let i = 30; i < 40; i++){
        const char = hover.int_to_ASCII(i+33);
        const result = hover.providePhredInfo(char);
        expect(result).toContain(`Quality Character`);
        expect(result).toContain(char);
        expect(result).toMatch(/Confidence Level: 🥇 High/);
        }
    });
});

describe("ProvidePhredInfo for Mid Phred Range", () => {
    it("tests all mid outputs", () => {
    for(let i = 20; i < 30; i++){
        const char = hover.int_to_ASCII(i+33);
        const result = hover.providePhredInfo(char);
        expect(result).toContain(`Quality Character`);
        expect(result).toContain(char);
        expect(result).toMatch(/Confidence Level: 🥈 Mid/);
        }
    });
});

describe("ProvidePhredInfo for Low Phred Range", () => {
    it("tests all mid outputs", () => {
    for(let i = 0; i < 20; i++){
        const char = hover.int_to_ASCII(i+33);
        const result = hover.providePhredInfo(char);
        expect(result).toContain(`Quality Character`);
        expect(result).toContain(char);
        expect(result).toMatch(/Confidence Level: 🥉 Low/);
        }
    });
});

describe("PhredHover debug", () => {
    it("prints all hover outputs", () => {
        for (const c of qualityLine) {
            console.log(hover.providePhredInfo(c));
        }
    });
});