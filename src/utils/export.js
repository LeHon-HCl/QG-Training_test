function exportToCSV(data, columns) {
  if (!data.length) return ''

  // 生成表头
  const header = columns.map(col => `"${col.label}"}`).join(',')

  // 生成数据行
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.value]
      if (value === null || value === undefined) value = ''
      //处理包含逗号或引号的字段
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""')
      }
      return `"${value}"`
    }).join(',')
  })

  return [header, ...rows].join('\n')
}

module.exports = {
  exportToCSV,
}