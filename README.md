# extract-css-didi

Extract the same css to common place to reduce the duplicate codes, and reduce package size

Sort css properties to reduce reflow and repaint, for improving the performance of page render

  - Extract the same css from different files and put into a common file
  - Extract the same css from current file and put into the current file
  - Remove some redundant inherited properties

## Installation
```bash
npm install extract-css-didi
```

## Usage
Add script in package.json, as follows:
```js
// package.json
"scripts": {
  "css": "extract-css s"
}
```
Now you can run the script
```bash
npm run css
```

## Configuration
There are some configurations that you can customize if the default configuration doesn't meet your demands.

Create new file named extract.css.json in the root directory of your project, 
```js
// extract.css.json 
// default configurations
{
  "entry":  "src/main.js",
  "destPath": "src/assets/css/common.less",
  "insertInfos": {
    "insertFile": "src/main.js",
    "insertContent": "import './assets/css/common.less'"
  },
  "logOutPut": "logs"
}
```
### Description
 - entry -> [filePath|Array```<filePath>```], the entry of collecting the style files.
 - destPath -> [filePath], the destPath tell extract-css-didi where to put the extracted style.
 - insertInfos -> [Object], contain the infos where to import the **destPath** file.
  - insertFile -> [filePath], which file will import the **destPath** file.
  - insertContent -> [String], the **insertContent** will be put in the **insertFile**, default be appended to the bottom of **insertFile**.
  - insertPosition -> [String], as a position flag, can be used to custom place where **insertContent** inserted.
 - logOutPut -> [dirPath], the directory of logs, when common css is extracted, will generate log file.

 - sortFile -> [filePath], sort css properties for single file. you can excute script as follows to get same effect.
```bash
 extract-css s sort <filePath>
```
 - sortFiles -> [Boolean], sort css properties for all style files. you can excute script as follows to get same effect. 
```bash
 extract-css s sort
```
**NOTE:** When config the **sortFiles** or **sortFile**, the extract-css-didi will not extract common css between the different files.
