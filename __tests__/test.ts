jest.mock('vscode', () => ({
    window: { showInformationMessage: jest.fn() },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
                textMateRules: []
            }),
            update: jest.fn()
        })
    }
}));

export function add(a : number,b : number): number {
    return a + b;
}

test( "adds 1 + 2 to equal 3", () => {
    expect(add(1,2)).toBe(3);       
});

// describe("", () => {
//     beforeEach(() => {
//     });     

//     test("SHOULDN'T recognize version tag", () => {
//         expect().toBe();
//     });
// });   