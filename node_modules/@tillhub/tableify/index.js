const safeGet = require('just-safe-get')

function tableify(items, options) {
  if (!items) return undefined

  let html = '<table>'
  let headers = []

  if (!safeGet(options, 'headers') || !Array.isArray(options.headers)) {
    // get unique keys of all objects
    headers = new Set()
    items.forEach(item => {
      if (typeof item === 'object') {
        Object.keys(item).forEach(key => headers.add(key))
      }
    })
    headers = Array.from(headers)
  } else {
    headers = JSON.parse(JSON.stringify(options.headers))
  }

  if (
    !options ||
    !options.hasOwnProperty('showHeaders') ||
    options.showHeaders
  ) {
    html += '<thead><tr>'

    const headerHtml = headers
      .map(header => {
        if (
          typeof header === 'object' &&
          header.hasOwnProperty('show') &&
          !header.show
        )
          return ''

        let cell = '<th'
        const currentHeader = typeof header === 'object' ? header.field : header

        if (safeGet(options, 'headerCellClass')) {
          const customClass = options.headerCellClass(headers, currentHeader)
          if (typeof customClass === 'string') cell += ` class="${customClass}"`
        }

        cell += '>'

        let content = header
        if (safeGet(options, 'headerCellContent')) {
          const customContent = options.headerCellContent(
            headers,
            currentHeader
          )
          if (typeof customContent === 'string') content = customContent
        }

        return cell + content + '</th>'
      })
      .join('')

    html += headerHtml + '</tr></thead>'
  }

  const tableBody = items
    .map(item => {
      if (safeGet(options, 'hideRow') && options.hideRow(item)) return '' // skip row

      const row = headers
        .map(header => {
          if (
            typeof header === 'object' &&
            header.hasOwnProperty('show') &&
            !header.show
          )
            return ''

          let cell = '<td'
          const currentHeader =
            typeof header === 'object' ? header.field : header

          if (safeGet(options, 'bodyCellClass')) {
            const customClass = options.bodyCellClass(
              item,
              currentHeader,
              item[currentHeader]
            )
            if (typeof customClass === 'string')
              cell += ` class="${customClass}"`
          }

          cell += '>'

          let content = item[currentHeader] || ''
          if (safeGet(options, 'bodyCellContent')) {
            const customContent = options.bodyCellContent(
              item,
              currentHeader,
              item[currentHeader]
            )
            if (typeof customContent === 'string') content = customContent
          }

          return cell + content + '</td>'
        })
        .join('')
      return `<tr>${row}</tr>`
    })
    .join('')

  html += '<tbody>' + tableBody + '</tbody></table>'
  return html
}

module.exports = tableify
