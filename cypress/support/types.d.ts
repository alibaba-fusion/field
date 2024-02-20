/// <reference types="cypress"/>

declare namespace Chai {
    export interface Assert {
        deepEqual(actual: unknown, expected: unknown, message?: string): void;
    }
}
