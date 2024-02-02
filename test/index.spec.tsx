/* eslint-disable react/no-multi-comp */
import React, { useState, useMemo, Component } from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import assert from 'power-assert';
import sinon from 'sinon';
import { Input, Form } from '@alifd/next';
import PropTypes from 'prop-types';
import Field from '../src';

Enzyme.configure({ adapter: new Adapter() });

const FormItem = Form.Item;

/* eslint-disable react/jsx-filename-extension */
/*global describe it afterEach */
describe('field', () => {
    describe('Field.create', function() {
        it('should create new field', function() {
            const field = Field.create(this);

            assert(!!field);
            assert(Field.prototype.isPrototypeOf(field));
        });

        it('should have subclass prototype', function() {
            class myField extends Field {
                constructor(com, options = {}) {
                    super(com, options);
                }
            }
            const field = myField.create(this);

            assert(!!field);
            assert(myField.prototype.isPrototypeOf(field));
        });
    });

    describe('render', () => {
        it('should support Form', function(done) {
            class Demo extends React.Component {
                constructor(props) {
                    super(props);
                    this.field = new Field(this);
                }

                render() {
                    const init = this.field.init;
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
                            <button
                                onClick={() => {
                                    assert(this.field.getValue('input') === '3');
                                    this.field.setValue('b', 2);
                                    this.field.reset();
                                }}
                            >
                                click
                            </button>
                        </Form>
                    );
                }
            }
            const wrapper = mount(<Demo />);
            wrapper.find('button').simulate('click');

            done();
        });

        it('should support React.createRef in Form', function(done) {
            class Demo extends React.Component {
                constructor(props) {
                    super(props);
                    this.field = new Field(this);
                    this.ref = React.createRef();
                }
                render() {
                    return (
                        <Form field={this.field}>
                            <FormItem>
                                <Input name="username" ref={this.ref} />
                            </FormItem>
                            <button
                                onClick={() => {
                                    assert(typeof this.ref === 'object');
                                    assert(this.ref.current !== null);
                                    done();
                                }}
                            >
                                click
                            </button>
                        </Form>
                    );
                }
            }
            const wrapper = mount(<Demo />);
            wrapper.find('button').simulate('click');
        });

        it('should support PureComponent', function(done) {
            class Demo extends React.PureComponent {
                constructor(props) {
                    super(props);
                    this.field = new Field(this, { forceUpdate: true });
                }

                render() {
                    const init = this.field.init;
                    return <Input {...init('input')} />;
                }
            }
            const wrapper = mount(<Demo />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: 'test',
                },
            });
            assert(wrapper.find('input').prop('value') === 'test');

            // PureComponent will not render by second update use this.setState();
            // so you should use this.fourceUpdate
            wrapper.find('input').simulate('change', {
                target: {
                    value: 'test2',
                },
            });
            assert(wrapper.find('input').prop('value') === 'test2');
            done();
        });

        it('should support origin input/checkbox/radio', function(done) {
            class Demo extends React.Component {
                constructor(props) {
                    super(props);
                    this.field = new Field(this);
                }

                render() {
                    const init = this.field.init;
                    return (
                        <Form field={this.field}>
                            <FormItem>
                                <input {...init('input', { initValue: '3' })} />
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
                                <input type="radio" {...init('radio', { valueName: 'checked' })} />
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
            const wrapper = mount(<Demo />);
            wrapper.find('button').simulate('click');
            wrapper.find('input[type="checkbox"]').simulate('change');
            wrapper.find('input[type="radio"]').simulate('change');

            done();
        });
    });
    describe('init', () => {
        let wrapper;
        afterEach(() => {
            if (wrapper) {
                wrapper.unmount();
                wrapper = null;
            }
        });

        it('init(input)', function(done) {
            const field = new Field(this);
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
            assert(field._get('input').rules.length === 0);

            done();
        });
        it('initValue', function(done) {
            const field = new Field(this);
            const inited = field.init('input', { initValue: 2 });

            assert(inited.value === 2);
            field.init('input', { initValue: 24 });
            assert(inited.value === 2);

            assert(field.init('input2', { initValue: '' }).value === '');

            done();
        });
        it('valueName', function(done) {
            const field = new Field(this);
            const inited = field.init('input', {
                initValue: true,
                valueName: 'checked',
            });
            assert(inited.checked === true);

            done();
        });

        it('props', function(done) {
            const field = new Field(this);
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

            done();
        });

        it('custom Event: onChange', function(done) {
            const onChange = sinon.spy();
            const field = new Field(this, { onChange });
            const inited = field.init('input', {
                props: {
                    onChange,
                },
            });

            const wrapper = mount(<Input {...inited} />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: 'test',
                },
            });
            assert(field.getValue('input') === 'test');
            assert(onChange.callCount === 2);

            const field2 = new Field(this, {
                onChange: (name, value) => {
                    assert(value === 'test');
                },
            });
            const wrapper2 = mount(
                <Input
                    {...field2.init('input', {
                        props: {
                            onChange(value) {
                                assert(value === 'test');
                            },
                        },
                    })}
                />
            );
            wrapper2.find('input').simulate('change', {
                target: {
                    value: 'test',
                },
            });
            assert(field2.getValue('input') === 'test');

            done();
        });
        it('getValueFromEvent', function(done) {
            const field = new Field(this, {
                onChange: (name, value) => {
                    assert(value === 'test!');
                },
            });

            const inited = field.init('input', {
                getValueFromEvent: a => {
                    assert(a === 'test');
                    return `${a}!`;
                },
            });

            const wrapper = mount(<Input {...inited} />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: 'test',
                },
            });

            assert(field.getValue('input') === 'test!');

            done();
        });
        it('getValueFormatter & setValueFormatter', function(done) {
            const field = new Field(this, {
                onChange: (name, value) => {
                    assert(value === 'test!');
                },
            });

            const inited = field.init('input', {
                initValue: 'abcd',
                getValueFormatter: a => {
                    assert(a === 'test');
                    return `test!`;
                },
                setValueFormatter: a => {
                    assert(a === 'abcd');
                    return `test!!`;
                },
            });

            const wrapper = mount(<Input {...inited} />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: 'test',
                },
            });

            assert(field.getValue('input') === 'test!');

            done();
        });

        it('rules', function(done) {
            const field = new Field(this);
            field.init('input', {
                rules: [
                    {
                        required: true,
                    },
                ],
            });

            assert(field._get('input').rules.length === 1);

            field.init('input2', {
                rules: {
                    required: true,
                },
            });

            assert(field._get('input2').rules.length === 1);

            done();
        });

        it('should support control through `setState`', function(done) {
            class Demo extends React.Component {
                state = {
                    show: true,
                    inputValue: 'start',
                };
                field = new Field(this);

                render() {
                    const init = this.field.init;
                    return (
                        <div>
                            <Input {...init('input', { props: { value: this.state.inputValue } })} />{' '}
                            <button
                                id="set"
                                onClick={() => {
                                    assert(this.field.getValue('input') === 'start');
                                    this.setState({
                                        inputValue: 'end',
                                    });
                                }}
                            >
                                click
                            </button>
                            <button
                                id="get"
                                onClick={() => {
                                    assert(this.field.getValue('input') === 'end');
                                    done();
                                }}
                            >
                                click
                            </button>
                        </div>
                    );
                }
            }

            wrapper = mount(<Demo />);
            wrapper.find('#set').simulate('click');
            wrapper.find('#get').simulate('click');
        });

        it('should support control through `setState` when `parseName` is true', function(done) {
            class Demo extends React.Component {
                state = {
                    show: true,
                    inputValue: 'start',
                };
                field = new Field(this, { parseName: true });

                render() {
                    const init = this.field.init;
                    return (
                        <div>
                            <Input {...init('input', { props: { value: this.state.inputValue } })} />{' '}
                            <button
                                id="set"
                                onClick={() => {
                                    assert(this.field.getValue('input') === 'start');
                                    this.setState({
                                        inputValue: 'end',
                                    });
                                }}
                            >
                                click
                            </button>
                            <button
                                id="get"
                                onClick={() => {
                                    assert(this.field.getValue('input') === 'end');
                                    done();
                                }}
                            >
                                click
                            </button>
                        </div>
                    );
                }
            }

            wrapper = mount(<Demo />);
            wrapper.find('#set').simulate('click');
            wrapper.find('#get').simulate('click');
        });

        it('should has key by getValues when parseName=true', () => {
            const field = new Field(this, { parseName: true });
            field.init('obj.arrd[0]', { initValue: undefined });
            field.init('obj.arrd[1]', { initValue: undefined });

            const value = field.getValues();

            assert(Object.keys(value).length === 1);
            assert(Array.isArray(value.obj.arrd));
        });

        // Fix https://github.com/alibaba-fusion/next/issues/4159
        it('should return truly value when parseName=true', () => {
            const field = new Field(this, { parseName: true, values: { list: [{ text: '1' }] } });
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
        it('getValue & getValues & setValue & setValues', function(done) {
            const field = new Field(this);
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

            done();
        });

        it('should return `undefined` for `getValue` on uninitialized field', function() {
            const field = new Field(this);
            assert.equal(field.getValue('input'), undefined);
        });

        it('should return empty object for `getValues` on uninitialized field', function() {
            const field = new Field(this);
            assert.equal(Object.keys(field.getValues()).length, 0);
        });

        it('should set value with `setValue` on uninitialized field', function() {
            const field = new Field(this);
            field.setValue('input', 1);
            field.init('input');
            assert.equal(field.getValue('input'), 1);
        });

        it('should set value with `setValues` on uninitialized field', function() {
            const field = new Field(this);
            field.setValues({ input: 1 });
            field.init('input');
            assert.equal(field.getValue('input'), 1);
        });

        it('should return value from `setValue` when calling `getValue` on uninitialized field', function() {
            const field = new Field(this);
            field.setValue('input', 1);
            assert.equal(field.getValue('input'), 1);
        });

        it('should return value from `setValue` when calling `getValues` on uninitialized field', function() {
            const field = new Field(this);
            field.setValue('input', 1);
            assert.equal(field.getValues().input, 1);
        });

        it('should return values from `setValue` and init when calling `getValues`', function() {
            const field = new Field(this);
            field.setValue('input', 1);
            field.init('input2', { initValue: 2 });
            assert.deepEqual(field.getValues(), { input: 1, input2: 2 });
        });

        it('should return `setValue` value instead of initValue', function() {
            const field = new Field(this);
            field.setValue('input', 1);
            field.init('input', { initValue: 2 });
            assert.deepEqual(field.getValues(), { input: 1 });
        });

        it('setError & setErrors & getError & getErrors', function(done) {
            const field = new Field(this);
            field.setError('input', 'error1');

            field.init('input');
            field.init('input2');

            field.setError('input', 'error1');
            assert(field.getError('input')[0] === 'error1');
            assert(field.getErrors(['input']).input[0] === 'error1');

            field.setError('input2', ['error2']);
            assert(field.getError('input2')[0] === 'error2');

            field.setErrors({ input: 'error 1', input2: 'error 2' });
            field.setError('input', '');

            assert(field.getError('input') === null);
            assert(field.getError('input2')[0] === 'error 2');

            field.setError('input', <span>hello</span>);
            assert(React.isValidElement(field.getError('input')[0]) === true);

            done();
        });
        it('getState', function(done) {
            const field = new Field(this);

            field.init('input');

            field.setError('input', 'error1');

            assert(field.getState('input') === 'error');
            assert(field.getState('') === '');

            done();
        });

        it('should overwrite setError errors when using rules', function(done) {
            const field = new Field(this);

            const inited = field.init('input', {
                rules: [{ required: true, message: 'cant be null' }],
            });
            const wrapper = mount(<Input {...inited} />);

            field.setError('input', 'my error');
            field.validateCallback(err => {
                assert(err.input.errors.length === 1);
                assert(err.input.errors[0] === 'cant be null');

                wrapper.unmount();
                done();
            });
        });

        describe('reset', function() {
            it('should set value to `undefined` on `reset()` if init with `initValue`', function() {
                const field = new Field(this);
                field.init('input', { initValue: '1' });

                field.reset();
                assert(field.getValue('input') === undefined);
            });

            it('should set only named value to `undefined` on `reset()` if init with `initValue`', function() {
                const field = new Field(this);
                field.init('input', { initValue: '1' });
                field.init('input2', { initValue: '2' });

                field.reset('input');
                assert.deepEqual(field.getValues(), { input: undefined, input2: '2' });
            });

            it('should set value to `initValue` on `resetToDefaults()` if init with `initValue`', function() {
                const field = new Field(this);
                field.init('input', { initValue: '4' });
                field.setValue('input', '33');

                field.resetToDefault();
                assert(field.getValue('input') === '4');
            });

            it('should set only named value to `initValue` on `resetToDefaults()` if init with `initValue`', function() {
                const field = new Field(this);
                field.init('input', { initValue: '4' });
                field.setValue('input', '33');
                field.init('input2', { initValue: '4' });
                field.setValue('input2', '33');

                field.resetToDefault('input');
                assert.deepEqual(field.getValues(), { input: '4', input2: '33' });
            });

            it('should set only named value to `undefined` on `resetToDefaults()` if init without `initValue`', function() {
                const field = new Field(this);
                field.init('input');
                field.setValue('input', 'a value');
                field.init('input'); // simulation a rerender

                field.resetToDefault();
                assert.deepEqual(field.getValues(), { input: undefined });
            });
        });

        it('remove', function(done) {
            const field = new Field(this);
            field.init('input', { initValue: 1 });
            field.init('input2', { initValue: 1 });
            field.init('input3', { initValue: 1 });

            field.remove('input');
            assert(field._get('input') === null);
            assert(field._get('input2') !== null);

            field.remove(['input', 'input2']);
            assert(field._get('input') === null);
            assert(field._get('input2') === null);

            done();
        });
        describe('spliceArray', function() {
            it('should remove the middle field item', () => {
                const field = new Field(this);
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
                const field = new Field(this);
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
                const field = new Field(this);
                field.init('input.0', { initValue: 0 });
                field.init('input.1', { initValue: 1 });
                field.init('input.2', { initValue: 2 });

                field.spliceArray('input', 0);
                assert(field.getValue('input.0') === 0);
                assert(field.getValue('input.1') === 1);
                assert(field.getValue('input.2') === 2);
            });

            it('should remove the middle field item when parseName=true', () => {
                const field = new Field(this, { parseName: true });
                field.init('input.0', { initValue: 0 });
                field.init('input.1', { initValue: 1 });
                field.init('input.2', { initValue: 2 });

                field.spliceArray('input.{index}', 1);

                assert(field.getValue('input.0') === 0);
                assert(field.getValue('input.1') === 2);
                assert(field.getValue('input.2') === undefined);
                assert(field.getValue('input').length === 2);
            });
        });
        describe('addArrayValue && deleteArrayValue', function() {
            function getFieldValue(field, name) {
                const value = field.getValue(name);
                const nameField = field.get(name);
                if (nameField && nameField.value !== value) {
                    throw new Error('getValue not equals field.value');
                }
                return value;
            }

            it('should remove field item with value like [1,2]', () => {
                const field = new Field(this, { parseName: true });
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
                const field2 = new Field(this, { parseName: true });

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
                const field = new Field(this, { parseName: true });
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
                const field = new Field(this, { parseName: true });
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
                const field = new Field(this, { parseName: true });
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
                const field = new Field(this, { parseName: true });
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
                const field = new Field(this, { parseName: true });
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
                const field = new Field(this, { parseName: true });
                field.init('key.0', { initValue: 0 });
                field.init('key.1', { initValue: 1 });
                field.init('key.2', { initValue: 2 });

                field._spliceArrayValue('notexist', 0, 0);
                assert(getFieldValue(field, 'key.0') === 0);
                assert(getFieldValue(field, 'key.1') === 1);
                assert(getFieldValue(field, 'key.2') === 2);

                field.init('key2.0.id', { initValue: 0 });
                field.init('key2.1.id', { initValue: 1 });
                field.init('key2.2.id', { initValue: 2 });

                field._spliceArrayValue('notexist', 1, 0);

                assert(getFieldValue(field, 'key2.0.id') === 0);
                assert(getFieldValue(field, 'key2.1.id') === 1);
                assert(getFieldValue(field, 'key2.2.id') === 2);
            });

            it('should compatible with special characters key', () => {
                const field = new Field(this, { parseName: true });

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
        it('should set field and return value from `getValue`', done => {
            class myField extends Field {
                static useField(...args) {
                    return this.getUseField({ useState, useMemo })(...args);
                }
            }

            function Demo() {
                const field = myField.useField();

                const { init, getValue } = field;

                function onGetValue() {
                    assert.equal(getValue('input'), 'test');
                    done();
                }

                return (
                    <div className="demo">
                        <Input {...init('input', { initValue: 'test' })} />
                        <button id="getValue" onClick={onGetValue}>
                            {' '}
                            getValue{' '}
                        </button>
                        <br />
                        <br />
                    </div>
                );
            }

            const wrapper = mount(<Demo />);
            wrapper.find('#getValue').simulate('click');
        });

        it('should rerender on `setValue`', done => {
            class myField extends Field {
                static useField(...args) {
                    return this.getUseField({ useState, useMemo })(...args);
                }
            }

            function Demo() {
                const field = myField.useField();

                const { init, setValue } = field;

                function onSetValue() {
                    setValue('input', 'abc');
                }

                // initial render will be undefined
                // second render is after `setValue` call
                if (field.getValue('input') === 'abc') {
                    assert(true);
                    done();
                }

                return (
                    <div className="demo">
                        <Input {...init('input', { initValue: 'test' })} />
                        <button id="setValue" onClick={onSetValue}>
                            {' '}
                            setValue{' '}
                        </button>
                        <br />
                        <br />
                    </div>
                );
            }

            const wrapper = mount(<Demo />);
            wrapper.find('#setValue').simulate('click');
        });

        it('should capture field options', () => {
            class myField extends Field {
                static useField(...args) {
                    return this.getUseField({ useState, useMemo })(...args);
                }
            }

            function Demo() {
                const field = myField.useField({ parseName: true });

                const { init } = field;

                assert(field.options.parseName);

                return (
                    <div className="demo">
                        <Input {...init('input', { initValue: 'test' })} />
                        <br />
                        <br />
                    </div>
                );
            }

            mount(<Demo />);
        });
        it('should get inputValues', function() {
            const field = new Field(this);
            const inited = field.init('input');

            const wrapper = mount(<Input {...inited} />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: '1',
                },
            });

            assert(field.get('input').inputValues.length === 2);
        });
    });

    describe('validate', function() {
        it('should return no errors', function(done) {
            const field = new Field(this);
            const inited = field.init('input', {
                rules: [{ required: true, message: 'cant be null' }],
            });

            const wrapper = mount(<Input {...inited} />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: '',
                },
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
            field.validateCallback(['input2'], error => {
                assert.strictEqual(error, null);
                done();
            });
        });

        it('should show setError on validate', function(done) {
            const field = new Field(this);
            const inited = field.init('input');
            const wrapper = mount(<Input {...inited} />);

            field.setError('input', 'my error');
            field.validateCallback('input', err => {
                assert(err.input.errors[0] === 'my error');
                wrapper.unmount();
                done();
            });
        });

        it('should merge setError and rules on validate', function(done) {
            const field = new Field(this);
            const inited = field.init('input');
            const inited2 = field.init('input2', {
                rules: [{ required: true, message: 'cant be null' }],
            });
            const wrapper = mount(<Input {...inited} />);
            const wrapper2 = mount(<Input {...inited2} />);

            field.setError('input', 'my error');
            field.validateCallback(err => {
                assert(err.input.errors[0] === 'my error');
                assert(err.input2.errors[0] === 'cant be null');

                wrapper.unmount();
                wrapper2.unmount();
                done();
            });
        });

        it('should return value for passed `inited` field name', function(done) {
            const field = new Field(this);
            const inited = field.init('input', {
                rules: [{ required: true, message: 'cant be null' }],
            });

            const wrapper = mount(<Input {...inited} />);
            wrapper.find('input').simulate('change', {
                target: {
                    value: '',
                },
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
            field.validateCallback(['input2'], (error, values) => {
                assert.deepEqual(values, { input2: 123 });
                done();
            });
        });

        it('should return all inited values when no names passed', function(done) {
            const field = new Field(this);
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
            field.validateCallback((error, values) => {
                assert.deepEqual(values, { input: 1, input2: 123 });
                done();
            });
        });

        it('should return non-inited values when no names passed', function(done) {
            const field = new Field(this);

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
            field.validateCallback((error, values) => {
                assert.deepEqual(values, { input: 1, input2: 123 });
                done();
            });
        });

        it('should return non-inited values when name passed', function(done) {
            const field = new Field(this);

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
            field.validateCallback(['input', 'input2'], (error, values) => {
                assert.deepEqual(values, { input: 1, input2: 123 });
                done();
            });
        });
    });

    describe('validatePromise', function() {
        describe('pure promise', () => {
            it('should return all errors when no name', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
                });

                const { errors } = await field.validatePromise();
                assert(errors.input.errors[0] === 'cant be null');
            });

            it('should return errors when name is string', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
                });

                const { errors } = await field.validatePromise('input');
                assert(errors.input.errors[0] === 'cant be null');
            });

            it('should return errors when array of names passed', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
                });

                const { errors } = await field.validatePromise(['input']);
                assert(errors.input.errors[0] === 'cant be null');
            });

            it('should return null when no errors', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
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

                const { errors } = await field.validatePromise(['input2']);
                assert.equal(errors, null);
            });

            it('should show setError on validate', async function() {
                const field = new Field(this);
                const inited = field.init('input');
                const wrapper = mount(<Input {...inited} />);

                field.setError('input', 'my error');
                const { errors } = await field.validatePromise('input');
                assert(errors.input.errors[0] === 'my error');
                wrapper.unmount();
            });

            it('should merge setError and rules on validate', async function() {
                const field = new Field(this);
                const inited = field.init('input');
                const inited2 = field.init('input2', {
                    rules: [{ required: true, message: 'cant be null' }],
                });
                const wrapper = mount(<Input {...inited} />);
                const wrapper2 = mount(<Input {...inited2} />);

                field.setError('input', 'my error');

                const { errors } = await field.validatePromise();
                assert(errors.input.errors[0] === 'my error');
                assert(errors.input2.errors[0] === 'cant be null');

                wrapper.unmount();
                wrapper2.unmount();
            });

            it('should return value for passed `inited` field name', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
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
                const { values } = await field.validatePromise(['input2']);
                assert.deepEqual(values, { input2: 123 });
            });

            it('should return all inited values when no names passed', async function() {
                const field = new Field(this);
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

            it('should return non-inited values when no names passed', async function() {
                const field = new Field(this);

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

            it('should return non-inited values when name passed', async function() {
                const field = new Field(this);

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
            it('should return all errors when no name', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
                });

                const { errors } = await field.validatePromise(async ({ errors }) => {
                    assert(errors.input.errors[0] === 'cant be null');
                    return { errors: 'error result' };
                });

                assert(errors === 'error result');
            });

            it('should return errors when name is string', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
                });

                const { errors } = await field.validatePromise('input', async ({ errors }) => {
                    assert(errors.input.errors[0] === 'cant be null');
                    return { errors: 'error result' };
                });

                assert(errors === 'error result');
            });

            it('should return errors when array of names passed', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
                });

                const { errors } = await field.validatePromise(['input'], async ({ errors }) => {
                    assert(errors.input.errors[0] === 'cant be null');
                    return { errors: 'error result' };
                });

                assert(errors === 'error result');
            });

            it('should return null when no errors', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
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

                const { errors } = await field.validatePromise(['input2'], async ({ errors }) => {
                    assert.equal(errors, null);
                    return { errors: 'error result' };
                });

                assert(errors === 'error result');
            });

            it('should show setError on validate', async function() {
                const field = new Field(this);
                const inited = field.init('input');
                const wrapper = mount(<Input {...inited} />);

                field.setError('input', 'my error');

                const { errors } = await field.validatePromise('input', async ({ errors }) => {
                    assert(errors.input.errors[0] === 'my error');
                    return { errors: 'error result' };
                });

                assert(errors === 'error result');
                wrapper.unmount();
            });

            it('should merge setError and rules on validate', async function() {
                const field = new Field(this);
                const inited = field.init('input');
                const inited2 = field.init('input2', {
                    rules: [{ required: true, message: 'cant be null' }],
                });
                const wrapper = mount(<Input {...inited} />);
                const wrapper2 = mount(<Input {...inited2} />);

                field.setError('input', 'my error');

                const { errors } = await field.validatePromise(async ({ errors }) => {
                    assert(errors.input.errors[0] === 'my error');
                    assert(errors.input2.errors[0] === 'cant be null');
                    return { errors: 'error result' };
                });

                assert(errors === 'error result');

                wrapper.unmount();
                wrapper2.unmount();
            });

            it('should return value for passed `inited` field name', async function() {
                const field = new Field(this);
                const inited = field.init('input', {
                    rules: [{ required: true, message: 'cant be null' }],
                });

                const wrapper = mount(<Input {...inited} />);
                wrapper.find('input').simulate('change', {
                    target: {
                        value: '',
                    },
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

                const { values } = await field.validatePromise(['input2'], ({ values }) => {
                    return Promise.resolve({ values });
                });

                assert.deepEqual(values, { input2: 123 });
            });

            it('should return all inited values when no names passed', async function() {
                const field = new Field(this);
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

            it('should return non-inited values when no names passed', async function() {
                const field = new Field(this);

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

            it('should return non-inited values when name passed', async function() {
                const field = new Field(this);

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
            const field = new Field(this);
            const callback = sinon.spy();
            field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            field.init('age', { initValue: 18 });
            const calls = callback.getCalls();
            assert(calls.length === 2);
            assert(calls[0].calledWith('name', 'field', undefined, 'init'));
            assert(calls[1].calledWith('age', 18, undefined, 'init'));
        });
        it('should not trigger callback when cross same init value', () => {
            const field = new Field(this, { values: { name: 'field' } });
            const callback = sinon.spy();
            field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            field.init('age', { initValue: 18 });
            assert(callback.calledOnceWith('age', 18, undefined, 'init'));
        });
        it('should can unwatch', () => {
            const field = new Field(this);
            const callback = sinon.spy();
            const unwatch = field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            assert(callback.calledOnceWith('name', 'field', undefined, 'init'));
            unwatch();
            field.init('age', { initValue: 18 });
            assert(callback.calledOnce);
        });
        it('should trigger callback when change', () => {
            const field = new Field(this);
            const { onChange } = field.init('name', { initValue: 'field' });
            const callback = sinon.spy();
            field.watch(['name'], callback);
            onChange('field2');
            assert(callback.calledOnceWith('name', 'field2', 'field', 'change'));
        });
        it('should trigger callback when unmount', () => {
            const callback = sinon.spy();
            class Demo extends Component {
                static propTypes = {
                    visible: PropTypes.bool,
                };
                constructor(props) {
                    super(props);
                    this.field = new Field(this);
                    this.field.watch(['name'], callback);
                }
                render() {
                    if (!this.props.visible) {
                        return null;
                    }
                    return <input {...this.field.init('name', { initValue: 'field' })} />;
                }
            }

            const wrapper = mount(<Demo visible />);
            assert(callback.calledOnceWith('name', 'field', undefined, 'init'));
            wrapper.setProps({ visible: false });
            assert(callback.calledTwice);
            assert(callback.calledWith('name', undefined, 'field', 'unmount'));
            wrapper.setProps({ visible: true });
            assert(callback.calledThrice);
            assert(callback.getCall(2).calledWith('name', 'field', undefined, 'init'));
        });
        it('should trigger callback when reset', () => {
            const field = new Field(this);
            field.init('name', { initValue: 'field' });
            const callback = sinon.spy();
            field.watch(['name'], callback);
            field.reset('name');
            assert(callback.calledOnceWith('name', undefined, 'field', 'reset'));
        });
        it('should trigger callback when setValue', () => {
            const field = new Field(this);
            const callback = sinon.spy();
            field.watch(['name', 'age'], callback);
            field.init('name', { initValue: 'field' });
            field.init('age', { initValue: 18 });
            assert(callback.getCall(0).calledWith('name', 'field', undefined, 'init'));
            assert(callback.getCall(1).calledWith('age', 18, undefined, 'init'));
            field.setValue('name', 'field2');
            assert(callback.getCall(2).calledWith('name', 'field2', 'field', 'setValue'));
            field.setValue('age', 19);
            assert(callback.getCall(3).calledWith('age', 19, 18, 'setValue'));
            field.setValues({ name: 'field3', age: 20 });
            assert(callback.getCall(4).calledWith('name', 'field3', 'field2', 'setValue'));
            assert(callback.getCall(5).calledWith('age', 20, 19, 'setValue'));
        });

        it('should trigger callback when change array value', () => {
            const field = new Field(this, {
                values: {
                    arr: [0, 1, 2, 3],
                },
                parseName: true,
            });
            const callback = sinon.spy();
            field.init('arr.0');
            field.watch(['arr.0'], callback);
            field.addArrayValue('arr', 0, 15, 16);
            // 此时字段 arr.0 已经变为 arr.2，需要重新init arr.0
            field.init('arr.0');
            assert.deepEqual([15, 16, 0, 1, 2, 3], field.getValue('arr'));
            assert.equal(callback.getCalls().length, 1);
            assert(callback.getCall(0).calledWith('arr.0', 15, 0, 'setValue'));

            // 删除不会移除对应的 field item
            field.deleteArrayValue('arr', 0, 2);
            assert.deepEqual([0, 1, 2, 3], field.getValue('arr'));
            assert.equal(callback.getCalls().length, 2);
            assert(callback.getCall(1).calledWith('arr.0', 0, 15, 'setValue'));

            // 调用spliceArray需要补充 field items
            field.getValue('arr').forEach((v, i) => {
                field.init(`arr.${i}`);
            });
            field.spliceArray('arr.{index}', 0, 1);
            assert.deepEqual([1, 2, 3], field.getValue('arr'));
            assert.equal(callback.getCalls().length, 3);
            assert(callback.getCall(2).calledWith('arr.0', 1, 0, 'setValue'));
        });
    });
});
