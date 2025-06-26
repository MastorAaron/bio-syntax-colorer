"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspace = void 0;
exports.workspace = {
    getConfiguration: jest.fn(() => ({
        get: jest.fn(() => ({})),
        update: jest.fn()
    }))
};
