---
title: 自定义受控字段 - custom valueName
order: 9
---

valueName 的默认值为 value，如果为其他需要用 valueName 指定

---

default valueName is `value`

```jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Button, Checkbox, Radio, Switch } from '@alifd/next';
import Field from '@alifd/field';

class App extends React.Component {
    field = new Field(this);

    render() {
        const init = this.field.init;

        return (
            <div className="demo">
                <Radio
                    {...init('radio', {
                        initValue: false,
                        valueName: 'checked',
                    })}
                >
                    {' '}
                    checked
                </Radio>
                <br />
                <Checkbox
                    {...init('checkbox', {
                        valueName: 'checked',
                        initValue: true,
                    })}
                >
                    defaultChecked
                </Checkbox>
                <br />
                <Switch
                    {...init('switch', {
                        valueName: 'checked',
                        initValue: false,
                    })}
                    style={{ marginTop: 10, marginBottom: 10 }}
                />
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
                            radio: true,
                            switch: true,
                            checkbox: false,
                        });
                    }}
                >
                    {' '}
                    setValues{' '}
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
