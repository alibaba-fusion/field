---
title: 自动卸载同名组件 - same name
order: 6
debug: true
---

2 个组件相同 name，删除其中一个的时候数据要保留.

---

2 Component with same name, while delete one should keep the data.

````jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Input, Button } from '@alifd/next';
import Field from '@alifd/field';

class Demo extends React.Component {
    state = {
        show: true,
        show2: true,
    }
    field = new Field(this);

    render() {
        return (
            <div>
                {this.state.show ? <Input.TextArea {...this.field.init('name', {initValue: 'same name'})}  /> : null}
                <Button
                    onClick={() => this.setState({ show: !this.state.show })}
                    warning
                    style={{marginLeft: 4}}
                >
                    delete
                </Button>
                <br/><br/>
                {this.state.show2 ? <Input {...this.field.init('name', {initValue: 'same name'})}  /> : null}
                <Button
                    onClick={() => this.setState({ show2: !this.state.show2 })}
                    warning
                    style={{marginLeft: 4}}
                >
                    delete
                </Button>

                <br/><br/>
                <Button
                    onClick={() => {
                        console.log('value always exist', this.field.getValues());
                    }}
                >
                    print
                </Button>

            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
````