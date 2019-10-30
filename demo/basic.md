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
    field = new Field(this, {
        parseName: true
    });

    onGetValue() {
        console.log(this.field.getValues());
    }

    render() {
        const { init, reset, resetToDefault } = this.field;

        return (<div className="demo">
            <h3>Object transfer</h3>
            obj.b: <Input {...init('obj.arrd[0]', {initValue: undefined})} /> &nbsp;
            obj.c: <Input {...init('obj.arrd[1]', {initValue: undefined})} />

            result:
            <pre>{JSON.stringify(this.field.getValues(), null, 2)}</pre>

            <br/><br/>

            <Button type="primary" onClick={this.onGetValue.bind(this)}>getValues</Button>
            <Button onClick={() => reset()}>reset</Button>
            <Button onClick={() => resetToDefault()}>resetToDefault</Button>
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
