# @tillhub/tableify

Creates html table with customizable headers, classes and cell contents.

[![NPM](https://img.shields.io/npm/v/@tillhub/tableify.svg)](https://www.npmjs.com/package/@tillhub/tableify) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @tillhub/tableify
```

## Usage

Tableify takes two arguments: items and options.

| Argument | Type             | Example                                       | Required |
|----------|------------------|-----------------------------------------------|----------|
| items    | Array of objects | [{ name: 'a' }, { name: 'b' }, { name: 'c' }] | true     |
| options  | Object           | { showHeaders: false }                        | false    |




```js
const tableify = require('@tillhub/tableify')

const items = [
  {
    name: 'Lipstick',
    vat_rate: 19,
    net: 6.58,
    currency: 'EUR'
  },
  {
    name: 'Shoelaces',
    vat_rate: 19,
    net: 7.34,
    currency: 'EUR'
  },
  {
    name: 'Apple',
    vat_rate: 7,
    net: 0.43
  },
  {
    name: 'Pears',
    vat_rate: 7,
    net: 0.77
  }
]

const options = {
  headers: [
    'name',
    'net',
    { field: 'vat_rate', show: true },
    { field: 'currency', show: false }
  ],
  headerCellClass: function(row, col) {
    if (col === 'vat_rate') return 'green'
  },
  bodyCellClass: function(row, col, content) {
    if (content === 'Apple') return 'apple'
    if (col === 'name') return 'red'
  },
  headerCellContent: function(row, col) {
    if (map[col]) {
      return map[col].custom || map[col].default
    }
  },
  bodyCellContent: function(row, col, content) {
    if (row.currency) {
      if (col === 'net') {
        return content.toLocaleString('de-DE', {
          style: 'currency',
          currency: row.currency
        })
      }
    }
  },
  hideRow: function(row) {
    if (row.name === 'Pears') return true
  }
}

console.log(tableify(items, options))

/* RESULT

<table>
  <thead>
    <tr>
      <th>Product</th>
      <th>net</th>
      <th class="green">VAT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="red">Lipstick</td>
      <td>€6.58</td>
      <td>19</td>
    </tr>
    <tr>
      <td class="red">Shoelaces</td>
      <td>€7.34</td>
      <td>19</td>
    </tr>
    <tr>
      <td class="apple">Apple</td>
      <td>0.43</td>
      <td>7</td>
    </tr>
  </tbody>
</table>

*/
```

### Options

There are multiple alternatives for the options object.

| Name              | Description                                                                              | Type                               | Default                           |
|-------------------|------------------------------------------------------------------------------------------|------------------------------------|-----------------------------------|
| headers           | Array of strings with headers. If omitted, tableify will get all keys from item objects. | Array of strings                   | unique keys from all item objects |
| headerCellClass   | function that returns custom class names for a cell in the table header                  | Function(row, col)/String          | --                                |
| bodyCellClass     | function that returns custom class names for a cell in the table body                    | Function(row, col, content)/String | --                                |
| headerCellContent | function that returns custom content for a cell in table header                          | Function(row, col)/String          | --                                |
| bodyCellContent   | function that returns custom content for a cell in table body                            | Function(row, col, content)/String | --                                |
| hideRow           | function that returns a boolean; if true, it will skip the row                           | Function(row)/Boolean              | --                                |
| showHeaders       | boolean that hides/shows the complete header section                                     | Boolean                            | true                              |

## License

MIT © [qtotuan](https://github.com/qtotuan)
