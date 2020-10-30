---
title: 动态表格 - dynamic
order: 7
---

通过 `deleteArrayValue/addArrayValue` 可以往数组格式的数据里面 删除/添加 数据, 并且自动订正其他 name 的 偏移问题

---

by use `deleteArrayValue/addArrayValue` could delete and add array , and fix keys offset problem

````jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Button, Input, Table } from '@alifd/next';
import Field from '@alifd/field';

const CustomInput = (props) => {
    return <Input {...props} />
}

class Demo extends React.Component {
    constructor(props) {
        super(props);

        this.idx = 3;

        this.field = new Field(this, {
            parseName: true,
            values: {
                name: [0, 1, 2, 3].map(i => {
                    return { id: i, input: i, custom: i };
                })
            }
        });
    }

    getValues = () => {
        const values = this.field.getValues();
        console.log(values);
    }

    addItem(index){
        ++this.idx;
        this.field.addArrayValue('name', index, {id: this.idx, input: this.idx, custom: this.idx});
         console.log(this.field.getNames())
    }

    removeItem(index) {
        this.field.deleteArrayValue('name', index);
        console.log(this.field.getNames())
    }

    input = (value, index) => <Input  {...this.field.init(`name.${index}.input`)} />;
    customInput = (value, index) => <CustomInput  {...this.field.init(`name.${index}.custom`)} />;
    op = (value, index) => {
        return <span>
            <Button type="primary" onClick={this.addItem.bind(this, index + 1)}>add</Button>
            <Button warning onClick={this.removeItem.bind(this, index)} style={{marginLeft: 4}}>delete</Button>
        </span>
    }

    render() {
        const dataSource = this.field.getValue('name');
        return (
            <div>
                <Table dataSource={dataSource}>
                    <Table.Column title="id" dataIndex="id" />
                    <Table.Column title="input" dataIndex="id" cell={this.input} />
                    <Table.Column title="custom" dataIndex="id" cell={this.customInput} />
                    <Table.Column title="operation" cell={this.op} width={150} />
                </Table>
                <pre style={{marginTop: 8}}>{JSON.stringify(dataSource, null, 2)}</pre>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
````
