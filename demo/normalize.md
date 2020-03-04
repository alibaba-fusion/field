---
title: 自定义返回值 - custom value
order: 2
---

通过 `getValueFormatter` 自定义从组件获取什么 `value` 
通过 `setValueFormatter` 自定义转换组件需要的 `value` 

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
                getValueFormatter: (value) => {return value === true? 1:0},
                setValueFormatter: (value) => {return value===1? true: false}
                })}/>
            <br/><br/>
            <DatePicker {...init('time', { 
                getValueFormatter: (value) => value.format('YYYY-MM-DD'),
                setValueFormatter: (value) => moment(value, 'YYYY-MM-DD')
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
