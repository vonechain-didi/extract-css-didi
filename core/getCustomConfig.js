const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const customConfig = function(){
  const configFile = path.join(process.cwd(), 'extract.css.json')
  try {
    fs.accessSync(configFile, fs.constants.F_OK)
    return fse.readJSONSync(configFile)
  } catch {
    return {}
  }
}

module.exports = customConfig