import React, { isValidElement, cloneElement, ReactElement } from 'react';
import { assert } from 'chai';
import {
    getErrorStrs,
    hasIn,
    getIn,
    setIn,
    deleteIn,
    cloneToRuleArr,
    splitNameToPath,
    isOverwritten,
} from '../src/utils';

function processErrorMessage(element: ReactElement) {
    if (element && isValidElement(element)) {
        return cloneElement(element, { key: 'error' });
    }
    return element;
}

describe('Field Utils', () => {
    describe('getErrorStrs', () => {
        it('should return `undefined` when given no errors', () => {
            assert(getErrorStrs() === undefined);
        });

        it('should return array of strings when given error objects', () => {
            const errors = [{ message: 'error 1' }, { message: 'error 2' }];
            assert.deepEqual(getErrorStrs(errors), ['error 1', 'error 2']);
        });

        it('should return array of strings when given string errors', () => {
            const errors = ['error 1', 'error 2'];
            assert.deepEqual(getErrorStrs(errors), ['error 1', 'error 2']);
        });

        it('should return array of React elements with `error` key when no key set using custom `processErrorMessage` function', () => {
            const errors = [{ message: <span>message 1</span> }];
            const result = getErrorStrs(errors, processErrorMessage);
            assert.equal(result[0].key, 'error');
        });

        it('should accept React Elements in `message` key using custom `processErrorMessage` function', () => {
            const errors = [{ message: <span>message 1</span> }, { message: <span>message 2</span> }];
            const result = getErrorStrs(errors, processErrorMessage);
            assert.deepEqual(result[0].props.children, 'message 1');
            assert.deepEqual(result[1].props.children, 'message 2');
        });

        it('should accept React Elements using custom `processErrorMessage` function', () => {
            const errors = [<span key="1">message 1</span>, <span key="2">message 2</span>];
            const result = getErrorStrs(errors, processErrorMessage);
            assert.deepEqual(result[0].props.children, 'message 1');
            assert.deepEqual(result[1].props.children, 'message 2');
        });
    });

    describe('splitNameToPath', () => {
        it('basic usage', () => {
            assert.deepEqual(splitNameToPath('a'), ['a']);
            assert.deepEqual(splitNameToPath('a.b'), ['a', 'b']);
        });
        it('with array', () => {
            assert.deepEqual(splitNameToPath('a[0]'), ['a', '0']);
            assert.deepEqual(splitNameToPath('a[0].b'), ['a', '0', 'b']);
            assert.deepEqual(splitNameToPath('a.b[0]'), ['a', 'b', '0']);
        });
        it('should return blank string when is not valid string', () => {
            assert(splitNameToPath(undefined) === '');
            assert(splitNameToPath(null) === '');
            assert(splitNameToPath('') === '');
            assert(splitNameToPath({}) === '');
            assert(splitNameToPath([]) === '');
        });
    });

    describe('hasIn', () => {
        it('should return false when state is nil', () => {
            assert(!hasIn(undefined, 'a.b'));
            assert(!hasIn(null, 'a.b'));
        });
        it('should return false when name is blank or nil', () => {
            assert(!hasIn({ a: 1 }, ''));
            assert(!hasIn({ a: 1 }, undefined));
            assert(!hasIn({ a: 1 }, null));
        });
        it('should return true when has property', () => {
            assert(hasIn({ a: { b: 1 } }, 'a.b'));
        });
        it('should return false when has no property', () => {
            assert(!hasIn({ a: { b: 1 } }, 'a.b.c'));
            assert(!hasIn({ a: { b: 1 } }, 'a.c'));
            assert(!hasIn({ a: { b: 1 } }, 'a[0]'));
        });
    });

    describe('getIn', () => {
        it('should return state when state is falsy', () => {
            assert(getIn(undefined, 'a') === undefined);
        });

        it('should return undefind when no name', () => {
            assert(getIn({ a: 1 }, '') === undefined);
        });

        it('should return undefind when value for name', () => {
            assert(getIn({ a: 1 }, 'b') === undefined);
        });

        it('should get top level element', () => {
            assert(getIn({ a: 1 }, 'a') === 1);
        });

        it('should get deep level element', () => {
            assert(getIn({ a: { b: { c: 1 } } }, 'a.b.c') === 1);
        });

        it('should get array element with dot notation', () => {
            assert(getIn({ a: [1, 2] }, 'a.1') === 2);
        });

        it('should get array element with bracket notation', () => {
            assert(getIn({ a: [1, 2] }, 'a[1]') === 2);
        });

        it('should get element that is deep array combination', () => {
            assert(getIn({ a: [1, { b: { c: 2 } }] }, 'a[1].b.c') === 2);
        });

        it('should return undefined when name is not exists', () => {
            // a is not a object
            assert(getIn({ a: 1 }, 'a.a') === undefined);
            // has not property
            assert(getIn({ a: {} }, 'b.c') === undefined);
            // is array without the index
            assert(getIn({ a: [] }, 'a[0]') === undefined);
        });
    });

    describe('setIn', () => {
        it('should initialize state with object when it is falsy and path is NaN', () => {
            assert(setIn(undefined, 'a', 5).a === 5);
        });

        it('should initialize state with array when it is falsy and path is NaN', () => {
            assert(setIn(undefined, '1', 5)[1] === 5);
        });

        it('should initialize state with whole path', () => {
            assert(setIn(undefined, 'a.b.c', 5).a.b.c === 5);
        });

        it('should not modify state when setting new value', () => {
            const state = { a: { b: { c: 1 } } };
            setIn(state, 'a.b.c', 5);
            assert(state.a.b.c === 1);
        });

        it('should duplicate state with new value', () => {
            const state = { a: { b: { c: 1 } } };
            const newState = setIn(state, 'a.b.c', 5);
            assert(newState.a.b.c === 5);
        });

        it('should handle array dot notation', () => {
            const state = { a: { b: [1, 2] } };
            const newState = setIn(state, 'a.b.1', 5);
            assert(newState.a.b[1] === 5);
        });

        it('should handle array bracket notation', () => {
            const state = { a: { b: [1, 2] } };
            const newState = setIn(state, 'a.b[1]', 5);
            assert(newState.a.b[1] === 5);
        });

        it('should add to existing nested object', () => {
            const state = { a: { b: 1 } };
            const newState = setIn(state, 'a.c.d', 5);
            assert(newState.a.c.d === 5);
        });

        it('should add to empty object', () => {
            const newState = setIn({}, 'a.b.c', 5);
            assert(newState.a.b.c === 5);
        });
    });

    describe('deleteIn', () => {
        it('should do nothing when name is not present', () => {
            assert.deepEqual(deleteIn({ a: { b: 1 } }, 'x'), { a: { b: 1 } });
        });

        it('should do nothing given empty object', () => {
            assert.deepEqual(deleteIn({}, 'x'), {});
        });

        it('should delete nested element, but leave object', () => {
            assert.deepEqual(deleteIn({ a: { b: 1 } }, 'a.b'), { a: {} });
        });

        it('should delete top level element, but leave object', () => {
            assert.deepEqual(deleteIn({ a: { b: 1 } }, 'a'), {});
        });

        it('should delete array element, but not change later indices', () => {
            assert.deepEqual(deleteIn({ a: { b: [1, 2, 3] } }, 'a.b.0'), {
                a: { b: [undefined, 2, 3] },
            });
        });
    });

    describe('cloneToRuleArr', () => {
        it('should return [] when rules is not empty', () => {
            assert.deepEqual(cloneToRuleArr(), []);
            assert.deepEqual(cloneToRuleArr(undefined), []);
            assert.deepEqual(cloneToRuleArr(null), []);
        });

        it('should always return array', () => {
            assert.deepEqual(cloneToRuleArr({ required: true }), [{ required: true }]);
            assert.deepEqual(cloneToRuleArr([{ required: true }]), [{ required: true }]);
        });

        it('should return cloned rule array', () => {
            const rule: Record<string, unknown> = { required: true };
            const cloned = cloneToRuleArr(rule);
            cloned[0].validate = () => {};
            assert(!('validate' in rule));
        });
    });

    describe('isOverwritten', () => {
        it('should return true while name is in values', () => {
            assert.equal(isOverwritten({ a: { b: 1 } }, 'a.b'), true);
            assert.equal(isOverwritten({ a: { b: {} } }, 'a.b'), true);
            assert.equal(isOverwritten({ a: { b: ['b0'] } }, 'a.b[0]'), true);
        });
        it('should return true while miss the array index', () => {
            assert.equal(isOverwritten({ a: { b: ['b0', 'b1'] } }, 'a.b[5]'), true);
            assert.equal(isOverwritten({ a: { b: ['b0', 'b1'] } }, 'a.b.5'), true);
        });
        it('should return false while name is not in values', () => {
            assert.equal(isOverwritten({ a: { b: 1 } }, 'a.c'), false);
            assert.equal(isOverwritten({ a: { b: 1 } }, 'g'), false);
        });

        it('should return true while some paths of name is overwritten by values', () => {
            assert.equal(isOverwritten({ a: { b: 1 } }, 'a.b.c'), true);
        });
        it('should return false while parameters is illegal', () => {
            assert.equal(isOverwritten(null, 'a.b'), false);
            assert.equal(isOverwritten(undefined, 'a.b'), false);
            assert.equal(isOverwritten(0, 'a.b'), false);
            assert.equal(isOverwritten('xxx', 'a.b'), false);
            assert.equal(isOverwritten({ a: { b: 1 } }, undefined), false);
            assert.equal(isOverwritten({ a: { b: 1 } }, null), false);
            assert.equal(isOverwritten({ a: { b: 1 } }, 0), false);
            assert.equal(isOverwritten({ a: { b: 1 } }, 1), false);
            assert.equal(isOverwritten({ a: { b: 1 } }, {}), false);
        });
    });
});
