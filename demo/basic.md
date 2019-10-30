---
title: 基本 - basic
order: 0
---

`getValue` `setValue` `reset` 的使用

---

usage of `getValue` `setValue` `reset`


````jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Input, Button } from '@alifd/next';
import Field from '@alifd/field';



class App extends React.Component {
    field = new Field(this, {values: { input: 0}});

    onGetValue() {
        console.log(this.field.getValue('input'));
    }

    render() {
        const { init, setValue, reset } = this.field;

        return (<div className="demo">
            <Input {...init('input')} />
            <br/><br/>
            <Button type="primary" onClick={this.onGetValue.bind(this)}>getValue</Button>
            <Button type="primary" onClick={() => setValue('input', 'set me by click')}>setValue</Button>
            <Button onClick={() => reset()}>reset</Button>
        </div>);
    }
}


ReactDOM.render(<App/>, mountNode);

````

````css
.demo .next-btn {
    margin-right: 5px;
}
````
