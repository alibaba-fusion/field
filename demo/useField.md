---
title: Hooks
order: 12
---

`getUseField` requires `useState` and `useMemo` implementation from React or Rax. Extend the `Field` Component and add a `useField` static method.

`
static useField(...args) {
    return this.getUseField(useState)(...args);
}
`

````jsx
import ReactDOM from 'react-dom';
import React, { useState, useMemo } from 'react';
import { Input, Button } from '@alifd/next';
import Field from '@alifd/field';


class myField extends Field {
    static useField(...args) {
        return this.getUseField({useState, useMemo})(...args);
    }
}

 
function NewApp() {
    const field = myField.useField();

    const { init, setValue, reset } = field;

    function onGetValue() {
        console.log(field.getValue('input'));
    }

    function onSetValue() {
        field.setValue('input', 'xyz');
    }

    return (
        <div className="demo">
            <Input {...init('input', {initValue: 'test'})} />
            <Button onClick={onSetValue}> setValue </Button>
            <Button onClick={onGetValue}> getValue </Button>
            <br/><br/>
        </div>);
 }
 
 
ReactDOM.render(<NewApp/>, mountNode);
 
 ````
