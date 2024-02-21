import React, { createRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@alifd/next';
import Field from '../src';
import { Validator } from '../src/types';

describe('rules', () => {
    it('required - validate', () => {
        const field = new Field({});
        const { value, ...inited } = field.init('input', {
            rules: [
                {
                    required: true,
                    message: 'cant be null',
                },
            ],
        });

        cy.mount(<Input {...inited} />);
        cy.get('input').type('1');
        cy.get('input').clear();
        cy.then(() => {
            cy.wrap(field.getError('input')).should('deep.equal', ['cant be null']);
        });

        const { value: _v, ...inited2 } = field.init('input', { rules: [] });
        cy.mount(<Input {...inited2} />);
        const callback = cy.spy();
        field.validateCallback(callback);

        cy.wrap(callback).should('be.calledOnce');
        cy.wrap(callback).should('be.calledWithMatch', null);
    });

    it('required - validatePromise - callback', () => {
        const field = new Field({});
        const { value: _v, ...inited } = field.init('input', {
            rules: [
                {
                    required: true,
                    message: 'cant be null',
                },
            ],
        });

        cy.mount(<Input {...inited} />);
        cy.get('input').type('1');
        cy.get('input').clear();
        cy.then(() => {
            cy.wrap(field.getError('input')).should('deep.equal', ['cant be null']);
        });

        const { value: _v2, ...inited2 } = field.init('input', { rules: [] });
        cy.mount(<Input {...inited2} />);

        const callback = cy.spy();
        field.validatePromise(callback);

        cy.wrap(callback).should('be.calledOnce');
    });

    it('required - validatePromise', () => {
        const field = new Field({});
        const { value, ...inited } = field.init('input', {
            rules: [
                {
                    required: true,
                    message: 'cant be null',
                },
            ],
        });

        cy.mount(<Input {...inited} />);
        cy.get('input').type('a');
        cy.get('input').clear();
        cy.then(() => {
            cy.wrap(field.getError('input')).should('deep.equal', ['cant be null']);
            cy.wrap(field.validatePromise()).should('deep.equal', {
                errors: { input: { errors: ['cant be null'] } },
                values: { input: '' },
            });
        });
    });

    it('triger', () => {
        const field = new Field({});
        const { value, ...inited } = field.init('input', {
            rules: [
                {
                    required: true,
                    trigger: 'onBlur',
                    message: 'cant be null',
                },
            ],
        });

        cy.mount(<Input {...inited} />);
        cy.get('input').trigger('blur');
        cy.then(() => {
            cy.wrap(field.getError('input')).should('deep.equal', ['cant be null']);
        });
    });
    it('validator', () => {
        const field = new Field({});
        const { value, ...inited } = field.init('input', {
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

        cy.mount(<Input {...inited} />);
        cy.get('input').type('a');
        cy.get('input').clear();
        cy.then(() => {
            cy.wrap(field.getError('input')).should('deep.equal', ['不能为空！']);
        });
    });

    it('should reRender while validator callback after 200ms, fix #51', () => {
        class Demo extends React.Component {
            field = new Field(this);
            userExists: Validator = (_rule, value) => {
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
            };

            render() {
                const { getError, init } = this.field;

                return (
                    <div>
                        <Input
                            {...init('userName', {
                                rules: {
                                    validator: this.userExists,
                                },
                            })}
                        />
                        <label>{getError('userName')}</label>
                    </div>
                );
            }
        }

        cy.mount(<Demo />);
        cy.clock();
        cy.get('input').type('frank');
        cy.tick(200);
        cy.get('label').should('have.text', 'Sorry name existed');
    });

    it('should rulesProps immutable', () => {
        const field = new Field({});
        const initRules = {
            required: true,
            message: 'cant be null',
        };
        const { value, ...inited } = field.init('input', {
            rules: initRules,
        });

        cy.mount(<Input {...inited} />);

        const callback = cy.spy();
        field.validateCallback(callback);
        cy.wrap(initRules).should('not.have.property', 'validator');
    });

    it('Should not block validation when component is unmounted while autoUnmount=false.', () => {
        const useField = Field.getUseField({
            useState: React.useState,
            useMemo: React.useMemo,
        });
        type Ref = {
            field: Field;
            setVisible: React.Dispatch<React.SetStateAction<boolean>>;
        };
        const Demo = forwardRef<Ref>((_props, ref) => {
            const [visible, setVisible] = React.useState(true);
            const field = useField({ autoUnmount: false });
            useImperativeHandle(ref, () => ({ setVisible, field }));
            if (!visible) {
                return null;
            }
            return (
                <Input
                    {...field.init('input', {
                        rules: [{ required: true }],
                    })}
                />
            );
        });

        const ref = createRef<Ref>();
        cy.mount(<Demo ref={ref} />).then(async () => {
            cy.wrap(ref.current).should('be.ok');
            const { errors } = await ref.current!.field.validatePromise();
            cy.wrap(errors).should('be.ok');
            ref.current!.setVisible(false);
            const { errors: errors2 } = await ref.current!.field.validatePromise();
            cy.wrap(errors2).should('not.be.ok');
        });
    });
});
