#!/usr/bin/env node

const program = require('commander');
import { promisify } from 'util';
import * as fs from 'fs';
import * as _ from 'lodash';
import os from 'os';

import { exec } from 'child_process';

program.version('0.0.1')
    .option('-f, --folder [folder]', 'search for and open the requested folder in VSCode. Options will be provided if multiple files are found')
    .option('-h --hidden', 'include hidden files and folders')
    .option('-s --search [search]', 'the folder to search in, this path needs to be the full path')
    .parse(process.argv)

if (!program.folder) {
    console.log('the --folder or -f param is required');
    process.exit();
}

if (program.search && program.search.indexOf('~/') >= 0) {
    program.search = `${os.homedir()}/${program.search.replace('~/', '')}` 
}

console.warn('folder', program.folder, 'search' ,program.search)


// setup the promisified version of readdir
const readdir = promisify(fs.readdir);

const recurseDirAndFind = async (relativePath: string, search: string): Promise<string> => {
    const folders = await readdir(relativePath);
    const filteredFolders = folders.filter(val => val.indexOf('.') === -1);

    for(const folder of filteredFolders) {
        try {
            // check for the folder
            if (folder === search) {
                return `${relativePath}${folder}/`;
            }
            // get the path
            const path = await recurseDirAndFind(`${relativePath}${folder}/`, search);
            if (path) {
                return path;
            }
        } catch (err) {
            const error = `${folder} is not a directory`
        }
    }

    return '';
}


const pathTracker = recurseDirAndFind(program.search || '/', program.folder).then((val) => { 
    console.log(`Executing: code ${val}`);
    val ? exec(`code ${val}`) : null;
});