export const workspace = {
    getConfiguration: jest.fn(() => ({
        get: jest.fn(() => ({})),
        update: jest.fn()
    }))
};