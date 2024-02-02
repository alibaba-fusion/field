---
title: 监听字段值变化 - watch value change
order: 13
---

使用 `field.watch` 方法来监听字段值的变化

---

Use `field.watch` to detect changes of the field value

```jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Button, Input, Switch } from '@alifd/next';
import Field from '@alifd/field';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.field = new Field(this);
        this.state = {
            showInput: true,
        };
        this.field.watch(
            ['radio', 'input', 'switch'],
            (name, value, oldValue, triggerType) => {
                // console.log('[Detect change]', name, value, oldValue, triggerType);
                console.group('[Detect Change]');
                console.log('name:', name);
                console.log('value:', oldValue, ' -> ', value);
                console.log('triggerType:', triggerType);
                console.groupEnd('[Detect Change]');

                // 监听switch变化，联动控制input显隐
                if (name === 'switch') {
                    this.setState({
                        showInput: value,
                    });
                }
            }
        );
    }

    render() {
        const init = this.field.init;
        const { showInput } = this.state;

        return (
            <div className="demo">
                <Switch
                    {...init('switch', {
                        valueName: 'checked',
                        initValue: true,
                    })}
                    style={{ marginTop: 10, marginBottom: 10 }}
                />
                <br />
                {showInput && (
                    <Input {...init('input', { initValue: 'input' })} />
                )}
                <br />
                <br />

                <Button
                    type="primary"
                    onClick={() => {
                        console.log(this.field.getValues());
                    }}
                >
                    getValues
                </Button>
                <Button
                    onClick={() => {
                        this.field.setValues({
                            switch: true,
                            input: '123',
                        });
                    }}
                >
                    setValues
                </Button>
                <Button
                    onClick={() => {
                        this.field.reset();
                    }}
                >
                    reset
                </Button>
            </div>
        );
    }
}

ReactDOM.render(<App />, mountNode);
```

```css
.demo .next-btn {
    margin-right: 5px;
}
```
