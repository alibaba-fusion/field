/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import assert from 'power-assert';
import sinon from 'sinon';
import { Input } from '@alifd/next';
import Field from '../src';

Enzyme.configure({ adapter: new Adapter() });

/* global describe it */
describe('rules', () => {
    it('required - validate', function(done) {
        const field = new Field(this);
        const inited = field.init('input', {
            rules: [
                {
                    required: true,
                    message: 'cant be null',
                },
            ],
        });

        const wrapper = mount(<Input {...inited} />);
        wrapper.find('input').simulate('change', {
            target: {
                value: '',
            },
        });

        assert(field.getError('input')[0] === 'cant be null');

        // validator can't callback when option.rules is an empty Array
        mount(<Input {...field.init('input', { rules: [] })} />);

        const callback = sinon.spy();
        field.validateCallback(callback);

        assert(callback.calledOnce === true);

        done();
    });

    it('required - validatePromise - callback', function(done) {
        const field = new Field(this);
        const inited = field.init('input', {
            rules: [
                {
                    required: true,
                    message: 'cant be null',
                },
            ],
        });

        const wrapper = mount(<Input {...inited} />);
        wrapper.find('input').simulate('change', {
            target: {
                value: '',
            },
        });

        assert(field.getError('input')[0] === 'cant be null');

        // validator can't callback when option.rules is an empty Array
        mount(<Input {...field.init('input', { rules: [] })} />);

        const callback = sinon.spy();
        field.validatePromise(callback);

        assert(callback.calledOnce === true);

        done();
    });

    it('required - validatePromise', function(done) {
        const field = new Field(this);
        const inited = field.init('input', {
            rules: [
                {
                    required: true,
                    message: 'cant be null',
                },
            ],
        });

        const wrapper = mount(<Input {...inited} />);
        wrapper.find('input').simulate('change', {
            target: {
                value: '',
            },
        });

        assert(field.getError('input')[0] === 'cant be null');

        // validator can't callback when option.rules is an empty Array
        mount(<Input {...field.init('input', { rules: [] })} />);

        field.validatePromise()
            .then(() => {
                done();
            })

    });

    it('triger', function(done) {
        const field = new Field(this);
        const inited = field.init('input', {
            rules: [
                {
                    required: true,
                    trigger: 'onBlur',
                    message: 'cant be null',
                },
            ],
        });

        const wrapper = mount(<Input {...inited} />);
        wrapper.find('input').simulate('blur');

        assert(field.getError('input')[0] === 'cant be null');

        const inited2 = field.init('input2', {
            rules: [
                {
                    required: true,
                    trigger: ['onBlur'],
                    message: 'cannot be null',
                },
            ],
        });

        const wrapper2 = mount(<Input {...inited2} />);
        wrapper2.find('input').simulate('blur');

        assert(field.getError('input2')[0] === 'cannot be null');

        done();
    });
    it('validator', function(done) {
        const field = new Field(this);
        const inited = field.init('input', {
            rules: [
                {
                    validator: (rule, value, callback) => {
                        if (!value) {
                            callback('不能为空！');
                        } else {
                            callback();
                        }
                    },
                },
            ],
        });

        const wrapper = mount(<Input {...inited} />);
        wrapper.find('input').simulate('change', {
            target: {
                value: '',
            },
        });

        assert(field.getError('input')[0] === '不能为空！');
        done();
    });

    it('should reRender while validator callback after 200ms, fix #51', function(done) {
        class Demo extends React.Component {
            field = new Field(this);
            userExists(rule, value) {
              return new Promise((resolve, reject) => {
                if (!value) {
                  resolve();
                } else {
                  setTimeout(() => {
                    if (value === 'frank') {
                      reject([new Error('Sorry name existed')]);
                    } else {
                      resolve();
                    }
                  }, 100);
                }
              });
            }


            render() {
              const { getState, getError, init } = this.field;

              return (
                <div>
                  <input {...init('userName', { rules: { validator: this.userExists.bind(this) } })} />
                  <label>{getError('userName')}</label>
                </div>
              );
            }
        }

        const wrapper = mount(<Demo />);
        wrapper.find('input').simulate('change', { target: { value: 'frank' } });

        setTimeout(() => {
            assert(wrapper.find('label').text() === 'Sorry name existed');
            done();
        }, 200);
    });

    it('should rulesProps immutable', function(done) {
        const field = new Field(this);
        const initRules= {
            required: true,
            message: 'cant be null',
        };
        const inited = field.init('input', {
            rules: initRules,
        });

        mount(<Input {...inited} />);

        const callback = sinon.spy();
        field.validateCallback(callback);
        assert(initRules.validator === undefined);
        done();
    });

});
