jest.mock('vscode', () => ({
    window: { showInformationMessage: jest.fn() },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
                textMateRules: []
            }),
           update: jest.fn()
        })
    },
    languages: { registerHoverProvider: jest.fn() },
    Position: jest.fn(),
    Range: jest.fn()
}));

import { vscUtils } from '../src/vscUtils';
import type { ColorRule } from '../src/definitions';
import { boolUtils } from '../src/booleans';
