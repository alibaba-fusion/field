import React, { useState, useMemo, Component, RefObject, createRef, forwardRef, useImperativeHandle } from 'react';
import { Input, Form } from '@alifd/next';
import Field from '../src';

const FormItem = Form.Item;

describe('field', () => {
    describe('Field.create', () => {
        it('should create new field', () => {
            const field = Field.create({});

            assert(!!field);
            assert(Field.prototype.isPrototypeOf(field));
        });

        it('should have subclass prototype', () => {
            class myField extends Field {
                constructor(com: unknown, options = {}) {
                    super(com, options);
                }
            }
            const field = myField.create({});

            assert(!!field);
            assert(myField.prototype.isPrototypeOf(field));
        });
    });

    describe('render', () => {
        it('should support Form', () => {
            class Demo extends React.Component {
                field = new Field(this);

                render() {
                    const { init } = this.field;
                    return (
                        <Form field={this.field}>
                            <FormItem>
                                <Input
                                    {...init(
                                        'input',
                                        {
                                            rules: [
                                                {
                                                    required: true,
                                                    message: 'cant be null',
                                                },
                                                {
                                                    pattern: /hi/,
                                                    message: 'cant be null',
                                                },
                                            ],
                                        },
                                        { defaultValue: '3' }
                                    )}
                                />
                            </FormItem>
                        </Form>
                    );
                }
            }
            const ref = createRef<Demo>();
            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(ref.current).should('be.ok');
                const ins = ref.current!;
                cy.wrap(ins.field.getValue('input')).should('eq', '3');
                ins.field.setValue('b', 2);
                cy.wrap(ins.field.getValues()).should('deep.equal', {
                    input: '3',
                    b: 2,
                });
                ins.field.reset();
                cy.wrap(ins.field.getValues()).should('deep.equal', {
                    input: undefined,
                });
            });
        });

        it('should support React.createRef in Form', () => {
            class Demo extends React.Component<{
                onClick: (ref: RefObject<any>) => void;
            }> {
                field = new Field(this);
                ref = React.createRef<any>();
                render() {
                    return (
                        <Form field={this.field}>
                            <FormItem>
                                <Input name="username" ref={this.ref} />
                            </FormItem>
                            <button
                                onClick={() => {
                                    this.props.onClick(this.ref);
                                }}
                            >
                                click
                            </button>
                        </Form>
                    );
                }
            }
            const onClick = cy.spy();
            cy.mount(<Demo onClick={onClick} />);
            cy.get('button').click();
            cy.then(() => {
                cy.wrap(onClick).should('be.calledOnce');
                cy.wrap(onClick.firstCall.args[0]).should('be.a', 'object').and('not.be.null');
            });
        });

        it('should support PureComponent', () => {
            class Demo extends React.PureComponent {
                field = new Field(this, { forceUpdate: true });

                render() {
                    const init = this.field.init;
                    return <Input {...init('input')} />;
                }
            }
            cy.mount(<Demo />);
            cy.get('input').type('test');
            cy.get('input').should('have.attr', 'value', 'test');

            cy.get('input').clear();
            cy.get('input').type('test2');
            cy.get('input').should('have.attr', 'value', 'test2');
        });

        it('should support origin input/checkbox/radio', () => {
            class Demo extends React.Component {
                field = new Field(this);

                render() {
                    const init = this.field.init;
                    return (
                        <Form field={this.field}>
                            <FormItem>
                                <input type="text" {...init('input', { initValue: '3' })} />
                            </FormItem>
                            <FormItem>
                                <input
                                    type="checkbox"
                                    {...init('checkbox', {
                                        rules: [
                                            {
                                                required: true,
                                                message: 'cant be null',
                                            },
                                            {
                                                pattern: /hi/,
                                                message: 'cant be null',
                                            },
                                        ],
                                    })}
                                />
                            </FormItem>
                            <FormItem>
                                <input value="rad" type="radio" {...init('radio', { valueName: 'checked' })} />
                            </FormItem>
                            <button
                                onClick={() => {
                                    assert(this.field.getValue('input') === '3');
                                    this.field.getValues();
                                }}
                            >
                                click
                            </button>
                        </Form>
                    );
                }
            }
            const ref = createRef<Demo>();
            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(ref.current).should('be.ok');
                const { field } = ref.current!;
                cy.get('input[type="text"]').should('have.attr', 'value', '3');
                cy.wrap(field.getValue('input')).should('eq', '3');

                cy.get('input[type="checkbox"]').should('have.attr', 'value');
                cy.wrap(field.getValue('checkbox')).should('eq', undefined);

                cy.get('input[type="radio"]')
                    .should('not.be.checked')
                    .then(() => {
                        cy.wrap(field.getValue('radio')).should('be.undefined');
                    });
                cy.get('input[type="radio"]').click();
                cy.get('input[type="radio"]')
                    .should('be.checked')
                    .then(() => {
                        cy.wrap(field.getValue('radio')).should('eq', 'rad');
                    });
            });
        });
    });
    describe('init', () => {
        it('init(input)', () => {
            const field = new Field({});
            const inited = field.init('input');

            assert(typeof inited.ref === 'function');
            assert(inited.id === 'input');
            assert(inited['data-meta'] === 'Field');
            assert('onChange' in inited);

            field.init('input', {
                rules: [
                    {
                        required: true,
                    },
                ],
            });

            field.init('input');
            assert(field.get('input')?.rules.length === 0);
        });
        it('initValue', () => {
            const field = new Field({});
            const inited = field.init('input', { initValue: 2 });

            assert(inited.value === 2);
            field.init('input', { initValue: 24 });
            assert(inited.value === 2);

            assert(field.init('input2', { initValue: '' }).value === '');
        });
        it('valueName', () => {
            const field = new Field({});
            const inited = field.init('input', {
                initValue: true,
                valueName: 'checked',
            });
            assert(inited.checked === true);
        });

        it('props', () => {
            const field = new Field({});
            const inited = field.init('input', {
                initValue: true,
                valueName: 'checked',
                props: {
                    a: 1,
                    defaultChecked: false,
                },
            });
            assert(inited.a === 1);
            assert(inited.checked === true);
        });

        it('custom Event: onChange', () => {
            const onChange = cy.spy();
            const onFieldChange = cy.spy();
            const field = new Field({}, { onChange });
            const { value, ...inited } = field.init('input', {
                props: {
                    onChange: onFieldChange,
                },
            });

            cy.mount(<Input {...inited} />);
            cy.get('input').type('test');
            cy.wrap(onChange).should('be.calledWith', 'input', 'test');
            cy.wrap(onFieldChange).should('be.calledWithMatch', 'test');
            cy.then(() => {
                assert(field.getValue('input') === 'test');
            });
        });
        it('getValueFromEvent', () => {
            const onChange = cy.spy();
            const field = new Field(
                {},
                {
                    onChange,
                }
            );

            const getValueFromEvent = cy.spy();

            const { value, ...inited } = field.init('input', {
                getValueFromEvent: (a) => {
                    getValueFromEvent(a);
                    return `${a}!`;
                },
            });

            cy.mount(<Input {...inited} />);
            cy.get('input').type('test');

            cy.wrap(onChange).should('be.calledWith', 'input', 'test!');
            cy.wrap(getValueFromEvent).should('be.calledWith', 'test');
            cy.then(() => {
                cy.wrap(field.getValue('input')).should('eq', 'test!');
            });
        });
        it('getValueFormatter & setValueFormatter', () => {
            const field = new Field(
                {},
                {
                    onChange: (name, value) => {
                        assert(value === 'test!');
                    },
                }
            );

            const { value, ...inited } = field.init('input', {
                initValue: 'abcd',
                getValueFormatter: (a) => {
                    return `test!`;
                },
                setValueFormatter: (a) => {
                    return `test!!`;
                },
            });

            cy.mount(<Input {...inited} />);
            cy.get('input').type('test');
            cy.then(() => {
                cy.wrap(field.getValue('input')).should('eq', 'test!');
            });
        });

        it('rules', () => {
            const field = new Field({});
            field.init('input', {
                rules: [
                    {
                        required: true,
                    },
                ],
            });

            assert(field.get('input')?.rules.length === 1);

            field.init('input2', {
                rules: {
                    required: true,
                },
            });

            assert(field.get('input2')?.rules.length === 1);
        });

        it('should support control through `setState`', () => {
            class Demo extends React.Component {
                state = {
                    show: true,
                    inputValue: 'start',
                };
                field = new Field(this);

                render() {
                    const init = this.field.init;
                    return (
                        <Input
                            {...init('input', {
                                props: { value: this.state.inputValue },
                            })}
                        />
                    );
                }
            }
            const ref = createRef<Demo>();
            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(ref.current).should('be.ok');
                const comp = ref.current!;
                cy.wrap(comp.field.getValue('input')).should('eq', 'start');
                comp.setState({ inputValue: 'end' });
                cy.wrap(comp.field.getValue('input')).should('eq', 'end');
            });
        });

        it('should support control through `setState` when `parseName` is true', () => {
            class Demo extends React.Component {
                state = {
                    show: true,
                    inputValue: 'start',
                };
                field = new Field(this, { parseName: true });

                render() {
                    const init = this.field.init;
                    return (
                        <Input
                            {...init('input.a', {
                                props: { value: this.state.inputValue },
                            })}
                        />
                    );
                }
            }
            const ref = createRef<Demo>();
            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(ref.current).should('be.ok');
                const comp = ref.current!;
                cy.wrap(comp.field.getValue('input')).should('deep.equal', {
                    a: 'start',
                });
                comp.setState({ inputValue: 'end' });
                cy.wrap(comp.field.getValue('input')).should('deep.equal', {
                    a: 'end',
                });
            });
        });

        it('should has key by getValues when parseName=true', () => {
            const field = new Field({}, { parseName: true });
            field.init('obj.arrd[0]', { initValue: undefined });
            field.init('obj.arrd[1]', { initValue: undefined });

            const value = field.getValues<{ obj: { arrd: unknown[] } }>();

            assert(Object.keys(value).length === 1);
            assert(Array.isArray(value.obj.arrd));
        });

        // Fix https://github.com/alibaba-fusion/next/issues/4159
        it('should return truly value when parseName=true', () => {
            const field = new Field(
                {},
                {
                    parseName: true,
                    values: { list: [{ text: '1' }] },
                }
            );
            const input1 = field.init('list');
            const input2 = field.init('list[0].text');
            assert.deepEqual(input1.value, [{ text: '1' }]);
            assert.equal(input2.value, '1');
            input2.onChange('2');
            const values = field.getValue('list');
            assert.deepEqual(values, [{ text: '2' }]);
            assert.deepEqual(field.init('list').value, [{ text: '2' }]);
            assert.equal(field.init('list[0].text').value, '2');
        });
    });

    describe('behaviour', () => {
        it('getValue & getValues & setValue & setValues', () => {
            const field = new Field({});
            field.init('input', { initValue: 1 });
            field.init('input2', { initValue: 2 });
            field.init('input3.name', { initValue: 3 });

            field.setValue('input', 2);
            assert(field.getValue('input') === 2);
            assert(field.getValue('input3.name') === 3);
            assert(Object.keys(field.getValues()).length === 3);
            assert(field.getValues().input === 2);

            field.setValues({ input: 3, input2: 4 });

            assert(field.getValue('input') === 3);
            assert(field.getValue('input2') === 4);
        });

        it('should return `undefined` for `getValue` on uninitialized field', () => {
            const field = new Field({});
            assert.equal(field.getValue('input'), undefined);
        });

        it('should return empty object for `getValues` on uninitialized field', () => {
            const field = new Field({});
            assert.equal(Object.keys(field.getValues()).length, 0);
        });

        it('should set value with `setValue` on uninitialized field', () => {
            const field = new Field({});
            field.setValue('input', 1);
            field.init('input');
            assert.equal(field.getValue('input'), 1);
        });

        it('should set value with `setValues` on uninitialized field', () => {
            const field = new Field({});
            field.setValues({ input: 1 });
            field.init('input');
            assert.equal(field.getValue('input'), 1);
        });

        it('should return value from `setValue` when calling `getValue` on uninitialized field', () => {
            const field = new Field({});
            field.setValue('input', 1);
            assert.equal(field.getValue('input'), 1);
        });

        it('should return value from `setValue` when calling `getValues` on uninitialized field', () => {
            const field = new Field({});
            field.setValue('input', 1);
            assert.equal(field.getValues().input, 1);
        });

        it('should return values from `setValue` and init when calling `getValues`', () => {
            const field = new Field({});
            field.setValue('input', 1);
            field.init('input2', { initValue: 2 });
            assert.deepEqual(field.getValues(), { input: 1, input2: 2 });
        });

        it('should return `setValue` value instead of initValue', () => {
            const field = new Field({});
            field.setValue('input', 1);
            field.init('input', { initValue: 2 });
            assert.deepEqual(field.getValues(), { input: 1 });
        });

        it('setError & setErrors & getError & getErrors', () => {
            const field = new Field({});
            field.setError('input', 'error1');

            field.init('input');
            field.init('input2');

            field.setError('input', 'error1');
            assert(field.getError('input')?.[0] === 'error1');
            assert(field.getErrors(['input']).input?.[0] === 'error1');

            field.setError('input2', ['error2']);
            assert(field.getError('input2')?.[0] === 'error2');

            field.setErrors({ input: 'error 1', input2: 'error 2' });
            field.setError('input', '');

            assert(field.getError('input') === null);
            assert(field.getError('input2')?.[0] === 'error 2');

            field.setError('input', <span>hello</span>);
            assert(React.isValidElement(field.getError('input')?.[0]) === true);
        });
        it('getState', () => {
            const field = new Field({});

            field.init('input');

            field.setError('input', 'error1');

            assert(field.getState('input') === 'error');
            assert(field.getState('') === '');
        });

        it('should overwrite setError errors when using rules', () => {
            const field = new Field({});

            const inited = field.init('input', {
                rules: [{ required: true, message: 'cant be null' }],
            });
            cy.mount(<Input {...inited} />).then(async () => {
                field.setError('input', 'my error');
                cy.wrap(field.validatePromise())
                    .should('have.property', 'errors')
                    .and('not.be.null')
                    .and('deep.equal', { input: { errors: ['cant be null'] } });
            });
        });

        describe('reset', () => {
            it('should set value to `undefined` on `reset()` if init with `initValue`', () => {
                const field = new Field({});
                field.init('input', { initValue: '1' });

                field.reset();
                assert(field.getValue('input') === undefined);
            });

            it('should set only named value to `undefined` on `reset()` if init with `initValue`', () => {
                const field = new Field({});
                field.init('input', { initValue: '1' });
                field.init('input2', { initValue: '2' });

                field.reset('input');
                assert.deepEqual(field.getValues(), {
                    input: undefined,
                    input2: '2',
                });
            });

            it('should set value to `initValue` on `resetToDefaults()` if init with `initValue`', () => {
                const field = new Field({});
                field.init('input', { initValue: '4' });
                field.setValue('input', '33');

                field.resetToDefault();
                assert(field.getValue('input') === '4');
            });

            it('should set only named value to `initValue` on `resetToDefaults()` if init with `initValue`', () => {
                const field = new Field({});
                field.init('input', { initValue: '4' });
                field.setValue('input', '33');
                field.init('input2', { initValue: '4' });
                field.setValue('input2', '33');

                field.resetToDefault('input');
                assert.deepEqual(field.getValues(), {
                    input: '4',
                    input2: '33',
                });
            });

            it('should set only named value to `undefined` on `resetToDefaults()` if init without `initValue`', () => {
                const field = new Field({});
                field.init('input');
                field.setValue('input', 'a value');
                field.init('input'); // simulation a rerender

                field.resetToDefault();
                assert.deepEqual(field.getValues(), { input: undefined });
            });
        });

        it('remove', () => {
            const field = new Field({});
            field.init('input', { initValue: 1 });
            field.init('input2', { initValue: 1 });
            field.init('input3', { initValue: 1 });

            field.remove('input');
            assert(field.get('input') === null);
            assert(field.get('input2') !== null);

            field.remove(['input', 'input2']);
            assert(field.get('input') === null);
            assert(field.get('input2') === null);
        });
        describe('spliceArray', () => {
            it('should remove the middle field item', () => {
                const field = new Field({});
                field.init('input.0', { initValue: 0 });
                field.init('input.1', { initValue: 1 });
                field.init('input.2', { initValue: 2 });

                field.spliceArray('input.{index}', 1);

                assert(field.getValue('input.0') === 0);
                assert(field.getValue('input.1') === 2);
                assert(field.getValue('input.2') === undefined);

                field.init('key.0.id', { initValue: 0 });
                field.init('key.1.id', { initValue: 1 });
                field.init('key.2.id', { initValue: 2 });

                field.spliceArray('key.{index}', 1);

                assert(field.getValue('key.0.id') === 0);
                assert(field.getValue('key.1.id') === 2);
                assert(field.getValue('key.2.id') === undefined);
            });

            it('should remove the first 2 field items', () => {
                const field = new Field({});
                field.init('input.0', { initValue: 0 });
                field.init('input.1', { initValue: 1 });
                field.init('input.2', { initValue: 2 });

                field.spliceArray('input.{index}', 1);
                field.spliceArray('input.{index}', 0);
                assert(field.getValue('input.0') === 2);
                assert(field.getValue('input.1') === undefined);
                assert(field.getValue('input.2') === undefined);

                field.init('key.0.id', { initValue: 0 });
                field.init('key.1.id', { initValue: 1 });
                field.init('key.2.id', { initValue: 2 });

                field.spliceArray('key.{index}', 1);
                field.spliceArray('key.{index}', 0);

                assert(field.getValue('key.0.id') === 2);
                assert(field.getValue('key.1.id') === undefined);
                assert(field.getValue('key.2.id') === undefined);
            });

            it('should make no change `keymatch` does not contain `{index}', () => {
                const field = new Field({});
                field.init('input.0', { initValue: 0 });
                field.init('input.1', { initValue: 1 });
                field.init('input.2', { initValue: 2 });

                field.spliceArray('input', 0);
                assert(field.getValue('input.0') === 0);
                assert(field.getValue('input.1') === 1);
                assert(field.getValue('input.2') === 2);
            });

            it('should remove the middle field item when parseName=true', () => {
                const field = new Field({}, { parseName: true });
                field.init('input.0', { initValue: 0 });
                field.init('input.1', { initValue: 1 });
                field.init('input.2', { initValue: 2 });

                field.spliceArray('input.{index}', 1);

                assert(field.getValue('input.0') === 0);
                assert(field.getValue('input.1') === 2);
                assert(field.getValue('input.2') === undefined);
                assert(field.getValue<number[]>('input')!.length === 2);
            });
        });
        describe('addArrayValue && deleteArrayValue', () => {
            function getFieldValue(field: Field, name: string) {
                const value = field.getValue(name);
                const nameField = field.get(name);
                if (nameField) {
                    assert.equal(nameField.value, value);
                }
                return value;
            }

            it('should remove field item with value like [1,2]', () => {
                const field = new Field({}, { parseName: true });
                field.init('key.0', { initValue: 0 });
                field.init('key.1', { initValue: 1 });
                field.init('key.2', { initValue: 2 });
                field.init('key.3', { initValue: 3 });

                field.deleteArrayValue('key', 1);

                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 2);
                assert(getFieldValue(field, 'key.2') === 3);
                assert(getFieldValue(field, 'key.3') === undefined);

                field.deleteArrayValue('key', 1);

                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 3);
                assert(getFieldValue(field, 'key.2') === undefined);

                field.deleteArrayValue('key', 0);

                assert(getFieldValue(field, 'key.0') === 3);
                assert(getFieldValue(field, 'key.1') === undefined);
                assert(getFieldValue(field, 'key.2') === undefined);
                assert(getFieldValue(field, 'key.3') === undefined);

                /// 删除最后一个元素
                const field2 = new Field({}, { parseName: true });

                field2.init('key.0', { initValue: 0 });
                field2.init('key.1', { initValue: 1 });
                field2.init('key.2', { initValue: 2 });
                field2.init('key.3', { initValue: 3 });

                field2.deleteArrayValue('key', 3);

                assert(field2.getValue('key.0') === 0);
                assert(field2.getValue('key.1') === 1);
                assert(field2.getValue('key.2') === 2);
                assert(field2.getValue('key.3') === undefined);

                assert(field2.getNames().length === 3);
            });

            it('should remove field item with value like [{id:1},{id:2}]', () => {
                const field = new Field({}, { parseName: true });
                field.init('key2.0.id', { initValue: 0 });
                field.init('key2.1.id', { initValue: 1 });
                field.init('key2.2.id', { initValue: 2 });
                field.init('key2.3.id', { initValue: 3 });

                field.deleteArrayValue('key2', 1);

                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 2);
                assert(getFieldValue(field, 'key2.2.id') === 3);
                assert(getFieldValue(field, 'key2.3.id') === undefined);

                field.deleteArrayValue('key2', 1);
                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 3);
                assert(getFieldValue(field, 'key2.2.id') === undefined);

                field.deleteArrayValue('key2', 0);
                assert(getFieldValue(field, 'key2.0.id') === 3);
                assert(getFieldValue(field, 'key2.1.id') === undefined);
                assert(getFieldValue(field, 'key2.2.id') === undefined);
                assert(getFieldValue(field, 'key2.3.id') === undefined);
            });

            it('should remove field with name using bracket notation', () => {
                const field = new Field({}, { parseName: true });
                field.init('key2[0].id', { initValue: 0 });
                field.init('key2[1].id', { initValue: 1 });
                field.init('key2[2].id', { initValue: 2 });
                field.init('key2[3].id', { initValue: 3 });

                field.deleteArrayValue('key2', 1);
                assert(getFieldValue(field, 'key2[0].id') === 0);
                assert(getFieldValue(field, 'key2[1].id') === 2);
                assert(getFieldValue(field, 'key2[2].id') === 3);
                assert(getFieldValue(field, 'key2[3].id') === undefined);

                field.deleteArrayValue('key2', 1);
                assert(getFieldValue(field, 'key2[0].id') === 0);
                assert(getFieldValue(field, 'key2[1].id') === 3);
                assert(getFieldValue(field, 'key2[2].id') === undefined);
                assert(getFieldValue(field, 'key2[3].id') === undefined);

                field.deleteArrayValue('key2', 0);
                assert(getFieldValue(field, 'key2[0].id') === 3);
                assert(getFieldValue(field, 'key2[1].id') === undefined);
                assert(getFieldValue(field, 'key2[2].id') === undefined);
                assert(getFieldValue(field, 'key2[3].id') === undefined);
            });

            it('should remove 2 field item with deleteArrayValue(key,index,2)', () => {
                const field = new Field({}, { parseName: true });
                field.init('key.0', { initValue: 0 });
                field.init('key.1', { initValue: 1 });
                field.init('key.2', { initValue: 2 });
                field.init('key.3', { initValue: 3 });

                field.deleteArrayValue('key', 1, 2);

                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 3);
                assert(getFieldValue(field, 'key.2') === undefined);
                assert(getFieldValue(field, 'key.3') === undefined);

                field.init('key2.0.id', { initValue: 0 });
                field.init('key2.1.id', { initValue: 1 });
                field.init('key2.2.id', { initValue: 2 });
                field.init('key2.3.id', { initValue: 3 });

                field.deleteArrayValue('key2', 1, 2);

                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 3);
                assert(getFieldValue(field, 'key2.2.id') === undefined);
                assert(getFieldValue(field, 'key2.3.id') === undefined);
            });
            it('should add item with addArrayValue(key,index,value)', () => {
                const field = new Field({}, { parseName: true });
                field.init('key.0', { initValue: 0 });
                field.init('key.1', { initValue: 1 });
                field.init('key.2', { initValue: 2 });

                field.addArrayValue('key', 1, 100);

                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 100);
                assert(getFieldValue(field, 'key.2') === 1);
                assert(getFieldValue(field, 'key.3') === 2);

                field.init('key2.0.id', { initValue: 0 });
                field.init('key2.1.id', { initValue: 1 });
                field.init('key2.2.id', { initValue: 2 });

                field.addArrayValue('key2', 1, { id: 100 });

                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 100);
                assert(getFieldValue(field, 'key2.2.id') === 1);
                assert(getFieldValue(field, 'key2.3.id') === 2);
            });
            it('should add 2 item with spliceValue(key,index, 0, ...argv)', () => {
                const field = new Field({}, { parseName: true });
                field.init('key.0', { initValue: 0 });
                field.init('key.1', { initValue: 1 });
                field.init('key.2', { initValue: 2 });

                field.addArrayValue('key', 1, 100, 20);

                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 100);
                assert(getFieldValue(field, 'key.2') === 20);
                assert(getFieldValue(field, 'key.3') === 1);
                assert(getFieldValue(field, 'key.4') === 2);

                field.init('key2.0.id', { initValue: 0 });
                field.init('key2.1.id', { initValue: 1 });
                field.init('key2.2.id', { initValue: 2 });

                field.addArrayValue('key2', 1, { id: 100 }, { id: 20 });

                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 100);
                assert(getFieldValue(field, 'key2.2.id') === 20);
                assert(getFieldValue(field, 'key2.3.id') === 1);
                assert(getFieldValue(field, 'key2.4.id') === 2);
            });

            it('should make no change `key` does not exist', () => {
                const field = new Field({}, { parseName: true });
                field.init('key.0', { initValue: 0 });
                field.init('key.1', { initValue: 1 });
                field.init('key.2', { initValue: 2 });

                field.addArrayValue('notexist', 0);
                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 1);
                assert(getFieldValue(field, 'key.2') === 2);

                field.init('key2.0.id', { initValue: 0 });
                field.init('key2.1.id', { initValue: 1 });
                field.init('key2.2.id', { initValue: 2 });

                field.deleteArrayValue('notexist', 1);

                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 1);
                assert(getFieldValue(field, 'key2.2.id') === 2);
            });

            it('should compatible with special characters key', () => {
                const field = new Field({}, { parseName: true });

                field.init('$key.0', { initValue: 0 });
                field.init('$key.1', { initValue: 1 });
                field.init('$key.2', { initValue: 2 });
                field.init('$key.3', { initValue: 3 });

                field.deleteArrayValue('$key', 3);

                assert(getFieldValue(field, '$key.0') === 0);
                assert(getFieldValue(field, '$key.1') === 1);
                assert(getFieldValue(field, '$key.2') === 2);
                assert(getFieldValue(field, '$key.3') === undefined);

                assert(field.getNames().length === 3);
            });
        });
    });

    describe('getUseField', () => {
        const useField = Field.getUseField({ useState, useMemo });
        it('should set field and return value from `getValue`', () => {
            const Demo = forwardRef<Field>((_props, ref) => {
                const field = useField();
                useImperativeHandle(ref, () => field);
                return <Input {...field.init('input', { initValue: 'test' })} />;
            });
            const ref = createRef<Field>();
            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(ref.current).should('be.ok');
                cy.wrap(ref.current!.getValue('input')).should('eq', 'test');
            });
        });

        it('should rerender on `setValue`', () => {
            const Demo = forwardRef<Field>((_props, ref) => {
                const field = useField();
                useImperativeHandle(ref, () => field);
                return (
                    <div>
                        <Input {...field.init('input', { initValue: 'test' })} />
                        <label>{field.getValue('input')}</label>
                    </div>
                );
            });
            const ref = createRef<Field>();
            cy.mount(<Demo ref={ref} />);
            cy.get('label').should('have.text', 'test');
            cy.then(() => {
                const field = ref.current!;
                cy.wrap(field).should('be.ok');
                field.setValue('input', 'abc');
                cy.get('label').should('have.text', 'abc');
            });
        });

        it('should capture field options', () => {
            const Demo = forwardRef<Field>((_props, ref) => {
                const field = useField({ parseName: true });
                useImperativeHandle(ref, () => field);
                return <Input {...field.init('input', { initValue: 'test' })} />;
            });
            const ref = createRef<Field>();
            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(ref.current).should('be.ok');
                cy.wrap(ref.current!.options.parseName).should('be.true');
            });
        });
        it('should get inputValues', () => {
            const field = new Field({});
            const { value, ...inited } = field.init('input');

            cy.mount(<Input {...inited} />);
            cy.get('input').type('1');
            cy.then(() => {
                cy.wrap(field.get('input')?.inputValues).should('have.length', 2);
            });
        });
    });

    describe('validate', () => {
        it('should return no errors', () => {
            const field = new Field({});
            const inited = field.init('input', {
                rules: [{ required: true, message: 'cant be null' }],
            });

            cy.mount(<Input {...inited} />);
            cy.get('input').type('a');
            cy.get('input').clear();
            cy.then(() => {
                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });
                const callback = cy.spy();
                field.validateCallback(['input2'], callback);
                cy.wrap(callback).should('be.calledOnce');
                cy.wrap(callback.firstCall.args[0]).should('be.null');
            });
        });

        it('should show setError on validate', () => {
            const field = new Field({});
            const inited = field.init('input');
            cy.mount(<Input {...inited} />).then(() => {
                field.setError('input', 'my error');
                const callback = cy.spy();
                field.validateCallback('input', callback);
                cy.wrap(callback).should('be.calledOnce');
                cy.wrap(callback.firstCall.args[0]).should('deep.equal', {
                    input: { errors: ['my error'] },
                });
            });
        });

        it('should merge setError and rules on validate', () => {
            const field = new Field({});
            const inited = field.init('input');
            const inited2 = field.init('input2', {
                rules: [{ required: true, message: 'cant be null' }],
            });
            cy.mount(
                <div>
                    <Input {...inited} />
                    <Input {...inited2} />
                </div>
            ).then(() => {
                field.setError('input', 'my error');
                const callback = cy.spy();
                field.validateCallback(callback);
                cy.wrap(callback).should('be.calledOnce');
                cy.wrap(callback.firstCall.args[0]).should('deep.equal', {
                    input: { errors: ['my error'] },
                    input2: { errors: ['cant be null'] },
                });
            });
        });

        it('should return value for passed `inited` field name', () => {
            const field = new Field({});
            const inited = field.init('input', {
                rules: [{ required: true, message: 'cant be null' }],
            });

            cy.mount(<Input {...inited} />);
            cy.get('input').type('a');
            cy.get('input').clear();
            cy.then(() => {
                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });
                const callback = cy.spy();
                field.validateCallback(['input2'], callback);
                cy.wrap(callback).should('be.calledOnce');
                cy.wrap(callback.firstCall.args[1]).should('deep.equal', {
                    input2: 123,
                });
            });
        });

        it('should return all inited values when no names passed', () => {
            const field = new Field({});
            field.init('input', {
                initValue: 1,
                rules: [{ required: true, message: 'cant be null' }],
            });

            field.init('input2', {
                initValue: 123,
                rules: [
                    {
                        required: true,
                        message: 'cant be 0',
                    },
                ],
            });
            const callback = cy.spy();
            field.validateCallback(callback);
            cy.wrap(callback).should('be.calledOnce');
            cy.wrap(callback.firstCall.args[1]).should('deep.equal', {
                input: 1,
                input2: 123,
            });
        });

        it('should return non-inited values when no names passed', () => {
            const field = new Field({});

            field.setValue('input', 1);

            field.init('input2', {
                initValue: 123,
                rules: [
                    {
                        required: true,
                        message: 'cant be 0',
                    },
                ],
            });
            const callback = cy.spy();
            field.validateCallback(callback);
            cy.wrap(callback).should('be.calledOnce');
            cy.wrap(callback.firstCall.args[1]).should('deep.equal', {
                input: 1,
                input2: 123,
            });
        });

        it('should return non-inited values when name passed', () => {
            const field = new Field({});

            field.setValue('input', 1);

            field.init('input2', {
                initValue: 123,
                rules: [
                    {
                        required: true,
                        message: 'cant be 0',
                    },
                ],
            });
            const callback = cy.spy();
            field.validateCallback(['input', 'input2'], callback);
            cy.wrap(callback).should('be.calledOnce');
            cy.wrap(callback.firstCall.args[1]).should('deep.equal', {
                input: 1,
                input2: 123,
            });
        });
    });

    describe('validatePromise', () => {
        describe('pure promise', () => {
            it('should return all errors when no name', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    const { errors } = await field.validatePromise();
                    cy.wrap(errors?.input.errors[0]).should('eq', 'cant be null');
                });
            });

            it('should return errors when name is string', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    const { errors } = await field.validatePromise('input');
                    cy.wrap(errors?.input.errors[0]).should('eq', 'cant be null');
                });
            });

            it('should return errors when array of names passed', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    const { errors } = await field.validatePromise(['input']);
                    cy.wrap(errors?.input.errors[0]).should('eq', 'cant be null');
                });
            });

            it('should return null when no errors', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    field.init('input2', {
                        initValue: 123,
                        rules: [
                            {
                                required: true,
                                message: 'cant be 0',
                            },
                        ],
                    });
                    const { errors } = await field.validatePromise(['input2']);
                    cy.wrap(errors).should('be.null');
                });
            });

            it('should show setError on validate', () => {
                const field = new Field({});
                const inited = field.init('input');
                cy.mount(<Input {...inited} />).then(async () => {
                    field.setError('input', 'my error');
                    const { errors } = await field.validatePromise('input');
                    cy.wrap(errors?.input.errors[0]).should('eq', 'my error');
                });
            });

            it('should merge setError and rules on validate', () => {
                const field = new Field({});
                const inited = field.init('input');
                const inited2 = field.init('input2', {
                    rules: [{ required: true, message: 'cant be null' }],
                });
                cy.mount(
                    <div>
                        <Input {...inited} />
                        <Input {...inited2} />
                    </div>
                ).then(async () => {
                    field.setError('input', 'my error');
                    const { errors } = await field.validatePromise();
                    cy.wrap(errors).should('deep.equal', {
                        input: { errors: ['my error'] },
                        input2: { errors: ['cant be null'] },
                    });
                });
            });

            it('should return value for passed `inited` field name', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    field.init('input2', {
                        initValue: 123,
                        rules: [
                            {
                                required: true,
                                message: 'cant be 0',
                            },
                        ],
                    });
                    const { values } = await field.validatePromise(['input2']);
                    cy.wrap(values).should('deep.equal', { input2: 123 });
                });
            });

            it('should return all inited values when no names passed', async () => {
                const field = new Field({});
                field.init('input', {
                    initValue: 1,
                    rules: [{ required: true, message: 'cant be null' }],
                });

                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });

                const { values } = await field.validatePromise();
                assert.deepEqual(values, { input: 1, input2: 123 });
            });

            it('should return non-inited values when no names passed', async () => {
                const field = new Field({});

                field.setValue('input', 1);

                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });

                const { values } = await field.validatePromise();
                assert.deepEqual(values, { input: 1, input2: 123 });
            });

            it('should return non-inited values when name passed', async () => {
                const field = new Field({});

                field.setValue('input', 1);

                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });

                const { values } = await field.validatePromise(['input', 'input2']);
                assert.deepEqual(values, { input: 1, input2: 123 });
            });
        });

        describe('callback', () => {
            it('should return all errors when no name', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    const formatter = cy.spy();
                    const { errors } = await field.validatePromise(async ({ errors }) => {
                        formatter(errors);
                        return { errors: 'error result' };
                    });
                    cy.wrap(errors).should('eq', 'error result');
                    cy.wrap(formatter).should('be.calledOnceWith', {
                        input: { errors: ['cant be null'] },
                    });
                });
            });

            it('should return errors when name is string', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    const formatter = cy.spy();
                    const { errors } = await field.validatePromise('input', async ({ errors }) => {
                        formatter(errors);
                        return { errors: 'error result' };
                    });
                    cy.wrap(formatter).should('be.calledOnceWith', {
                        input: { errors: ['cant be null'] },
                    });
                    cy.wrap(errors).should('eq', 'error result');
                });
            });

            it('should return errors when array of names passed', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });
                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    const formatter = cy.spy();
                    const { errors } = await field.validatePromise(['input'], async ({ errors }) => {
                        formatter(errors);
                        return { errors: 'error result' };
                    });
                    cy.wrap(formatter).should('be.calledOnceWith', {
                        input: { errors: ['cant be null'] },
                    });
                    cy.wrap(errors).should('eq', 'error result');
                });
            });

            it('should return null when no errors', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });
                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    field.init('input2', {
                        initValue: 123,
                        rules: [
                            {
                                required: true,
                                message: 'cant be 0',
                            },
                        ],
                    });
                    const callback = cy.spy();
                    const { errors } = await field.validatePromise(['input2'], async ({ errors }) => {
                        callback(errors);
                        return { errors: 'error result' };
                    });
                    cy.wrap(callback).should('be.calledOnceWith', null);
                    cy.wrap(errors).should('eq', 'error result');
                });
            });

            it('should show setError on validate', () => {
                const field = new Field({});
                const inited = field.init('input');
                cy.mount(<Input {...inited} />);
                cy.then(async () => {
                    field.setError('input', 'my error');
                    const callback = cy.spy();
                    const { errors } = await field.validatePromise('input', async ({ errors }) => {
                        callback(errors);
                        return { errors: 'error result' };
                    });
                    cy.wrap(callback).should('be.calledOnceWith', {
                        input: { errors: ['my error'] },
                    });
                    cy.wrap(errors).should('eq', 'error result');
                });
            });

            it('should merge setError and rules on validate', () => {
                const field = new Field({});
                const inited = field.init('input');
                const inited2 = field.init('input2', {
                    rules: [{ required: true, message: 'cant be null' }],
                });
                cy.mount(
                    <div>
                        <Input {...inited} />
                        <Input {...inited2} />
                    </div>
                ).then(async () => {
                    field.setError('input', 'my error');
                    const callback = cy.spy();
                    const { errors } = await field.validatePromise(async ({ errors }) => {
                        callback(errors);
                        return { errors: 'error result' };
                    });
                    cy.wrap(callback).should('be.calledOnceWith', {
                        input: { errors: ['my error'] },
                        input2: { errors: ['cant be null'] },
                    });
                    cy.wrap(errors).should('eq', 'error result');
                });
            });

            it('should return value for passed `inited` field name', () => {
                const field = new Field({});
                const { value, ...inited } = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                cy.mount(<Input {...inited} />);
                cy.get('input').type('a');
                cy.get('input').clear();
                cy.then(async () => {
                    field.init('input2', {
                        initValue: 123,
                        rules: [
                            {
                                required: true,
                                message: 'cant be 0',
                            },
                        ],
                    });

                    const { values } = await field.validatePromise(['input2'], ({ values }) => {
                        return Promise.resolve({ values });
                    });
                    cy.wrap(values).should('deep.equal', { input2: 123 });
                });
            });

            it('should return all inited values when no names passed', async () => {
                const field = new Field({});
                field.init('input', {
                    initValue: 1,
                    rules: [{ required: true, message: 'cant be null' }],
                });

                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });

                const { values } = await field.validatePromise(({ values }) => {
                    return Promise.resolve({ values });
                });

                assert.deepEqual(values, { input: 1, input2: 123 });
            });

            it('should return non-inited values when no names passed', async () => {
                const field = new Field({});

                field.setValue('input', 1);

                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });

                const { values } = await field.validatePromise(({ values }) => {
                    return Promise.resolve({ values });
                });

                assert.deepEqual(values, { input: 1, input2: 123 });
            });

            it('should return non-inited values when name passed', async () => {
                const field = new Field({});

                field.setValue('input', 1);

                field.init('input2', {
                    initValue: 123,
                    rules: [
                        {
                            required: true,
                            message: 'cant be 0',
                        },
                    ],
                });

                const { values } = await field.validatePromise(['input', 'input2'], ({ values }) => {
                    return Promise.resolve({ values });
                });

                assert.deepEqual(values, { input: 1, input2: 123 });
            });
        });
    });

    describe('watch', () => {
        it('should trigger callback when init', () => {
            const field = new Field({});
            const callback = cy.spy();
            field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            field.init('age', { initValue: 18 });
            cy.wrap(callback).should('be.calledTwice');
            cy.wrap(callback.firstCall).should('be.calledWith', 'name', 'field', undefined, 'init');
            cy.wrap(callback.secondCall).should('be.calledWith', 'age', 18, undefined, 'init');
        });
        it('should not trigger callback when cross same init value', () => {
            const field = new Field({}, { values: { name: 'field' } });
            const callback = cy.spy();
            field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            field.init('age', { initValue: 18 });
            cy.wrap(callback).should('be.calledOnceWith', 'age', 18, undefined, 'init');
        });
        it('should can unwatch', () => {
            const field = new Field({});
            const callback = cy.spy();
            const unwatch = field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            cy.wrap(callback).should('be.calledOnceWith', 'name', 'field', undefined, 'init');
            unwatch();
            field.init('age', { initValue: 18 });
            cy.wrap(callback).should('be.calledOnce');
        });
        it('should trigger callback when change', () => {
            const field = new Field({});
            const { onChange } = field.init('name', { initValue: 'field' });
            const callback = cy.spy();
            field.watch(['name'], callback);
            onChange('field2');
            cy.wrap(callback).should('be.calledOnceWith', 'name', 'field2', 'field', 'change');
        });
        it('should trigger callback when unmount', () => {
            const callback = cy.spy();
            class Demo extends Component {
                field = new Field(this);
                state = {
                    visible: true,
                };
                constructor(props: any) {
                    super(props);
                    this.field.watch(['name'], callback);
                }

                render() {
                    if (!this.state.visible) {
                        return null;
                    }
                    return <input {...this.field.init('name', { initValue: 'field' })} />;
                }
            }

            const ref = createRef<Demo>();

            cy.mount(<Demo ref={ref} />).then(() => {
                cy.wrap(callback.firstCall).should('be.calledWith', 'name', 'field', undefined, 'init');
                cy.wrap(ref.current).should('be.ok');
                const ins = ref.current!;

                ins.setState({ visible: false });
                cy.wrap(callback.secondCall).should('be.calledWith', 'name', undefined, 'field', 'unmount');

                ins.setState({ visible: true });
                cy.wrap(callback.thirdCall).should('be.calledWith', 'name', 'field', undefined, 'init');
            });
        });
        it('should trigger callback when reset', () => {
            const field = new Field({});
            field.init('name', { initValue: 'field' });
            const callback = cy.spy();
            field.watch(['name'], callback);
            field.reset('name');
            cy.wrap(callback).should('be.calledOnceWith', 'name', undefined, 'field', 'reset');
        });
        it('should trigger callback when setValue', () => {
            const field = new Field({});
            const callback = cy.spy();
            field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            field.init('age', { initValue: 18 });
            cy.wrap(callback.firstCall).should('be.calledWith', 'name', 'field', undefined, 'init');
            cy.wrap(callback.secondCall).should('be.calledWith', 'age', 18, undefined, 'init');
            field.setValue('name', 'field2');
            cy.wrap(callback.thirdCall).should('be.calledWith', 'name', 'field2', 'field', 'setValue');
            field.setValue('age', 19);
            cy.wrap(callback.getCall(3)).should('be.calledWith', 'age', 19, 18, 'setValue');
            field.setValues({ name: 'field3', age: 20 });
            cy.wrap(callback.getCall(4)).should('be.calledWith', 'name', 'field3', 'field2', 'setValue');
            cy.wrap(callback.getCall(5)).should('be.calledWith', 'age', 20, 19, 'setValue');
        });

        it('should trigger callback when change array value', () => {
            const field = new Field(
                {},
                {
                    values: {
                        arr: [0, 1, 2, 3],
                    },
                    parseName: true,
                }
            );
            const callback = cy.spy();
            field.init('arr.0');
            field.watch(['arr.0'], callback);
            field.addArrayValue('arr', 0, 15, 16);
            // 此时字段 arr.0 已经变为 arr.2，需要重新 init arr.0
            field.init('arr.0');
            assert.deepEqual([15, 16, 0, 1, 2, 3], field.getValue('arr'));
            assert.equal(callback.getCalls().length, 1);
            cy.wrap(callback.firstCall).should('be.calledWith', 'arr.0', 15, 0, 'setValue');

            // 删除不会移除对应的 field item
            field.deleteArrayValue('arr', 0, 2);
            assert.deepEqual([0, 1, 2, 3], field.getValue('arr'));
            assert.equal(callback.getCalls().length, 2);
            cy.wrap(callback.secondCall).should('be.calledWith', 'arr.0', 0, 15, 'setValue');

            // 调用 spliceArray 需要补充 field items
            field.getValue<number[]>('arr')!.forEach((v, i) => {
                field.init(`arr.${i}`);
            });
            field.spliceArray('arr.{index}', 0);
            assert.deepEqual([1, 2, 3], field.getValue('arr'));
            assert.equal(callback.getCalls().length, 3);
            cy.wrap(callback.getCall(2)).should('be.calledWith', 'arr.0', 1, 0, 'setValue');
        });
    });
});
