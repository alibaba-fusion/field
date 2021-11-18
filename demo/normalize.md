---
title: 自定义返回值 - custom value
order: 2
---

当组件返回的数据和最终期望提交的格式不一致的时候，可以使用 `getValueFormatter` 和 `setValueFormatter` 两个函数做转换。

比如 switch 组件期望上报 0/1, date-picker 组件期望上报 YYYY-MM-DD 这种字符串格式

---

custom get `value` by api `getValueFormatter`
custom set `value` by api `setValueFormatter`


````jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Button, DatePicker, Switch } from '@alifd/next';
import Field from '@alifd/field';
import moment from 'moment';

class App extends React.Component {

    field = new Field(this);

    render() {
        const init = this.field.init;

        return (<div>
            <Switch {...init('switch', { 
                getValueFormatter: (value, ...args) => { return value === true? 1:0 },
                setValueFormatter: (value, inputValues) => { return value===1? true: false }
                })}/>
            <br/><br/>
            <DatePicker {...init('time', { 
                getValueFormatter: (value, ...args) => { return value.format('YYYY-MM-DD'); },
                setValueFormatter: (value, inputValues) => { return moment(value, 'YYYY-MM-DD'); }
                })} />
            <br/><br/>
            <Button type="primary" onClick={() => {
                console.log(this.field.getValues());
            }}>getValues</Button>
        </div>);
    }
}


ReactDOM.render(<App/>, mountNode);
````
