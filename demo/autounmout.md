---
title: 自动卸载 - auto unmount
order: 6
---

autoUnmount 默认为 true，当组件被 unmount 的时候会自动删除数据. autoUnmount 设置为 false 后，会一直保存数据.

---

autoUnmount is true by default, and data will be deleted automatically. Field will keep data while autoUnmount is set to false.

```jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Input, Button } from '@alifd/next';
import Field from '@alifd/field';

class Demo extends React.Component {
    state = {
        show: true,
        show2: true,
    };
    field = new Field(this);
    field2 = new Field(this, { autoUnmount: false });

    render() {
        return (
            <div>
                {this.state.show ? (
                    <Input
                        {...this.field.init('name', {
                            initValue: 'autoUnmount = true',
                        })}
                    />
                ) : null}
                <Button
                    onClick={() => {
                        console.log(
                            'value auto delete',
                            this.field.getValues()
                        );
                    }}
                    style={{ marginLeft: 4 }}
                >
                    print
                </Button>
                <Button
                    onClick={() => this.setState({ show: false })}
                    warning
                    style={{ marginLeft: 4 }}
                >
                    delete
                </Button>
                <br />
                <br />
                {this.state.show2 ? (
                    <Input
                        {...this.field2.init('name2', {
                            initValue: 'autoUnmount = false',
                        })}
                    />
                ) : null}
                <Button
                    onClick={() => {
                        console.log(
                            'value always exist',
                            this.field2.getValues()
                        );
                    }}
                    style={{ marginLeft: 4 }}
                >
                    print
                </Button>
                <Button
                    onClick={() => this.setState({ show2: false })}
                    warning
                    style={{ marginLeft: 4 }}
                >
                    delete
                </Button>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
```
