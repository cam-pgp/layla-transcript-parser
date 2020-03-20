'use strict';

const fs = require('fs');
const {promisify} = require('util');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const _ = require('lodash');
const moment = require('moment');
const currentData = moment().format('YYYYMMDD_HHmmss');
const args = process.argv.slice(2);

if (!args.length > 0) {
    console.log('source directory is required');
    process.exit(1);
}

const inputName = args[0];
const directorySource = './source/' + inputName;
const outputName = './dist/' + inputName + '.csv';
// const fileOut = args[1];
const ws = fs.createWriteStream(outputName);

console.log("reading '" + directorySource + "'...");

function processCsv(path) {
    return new Promise((resolve, reject) => {
        let data = [];
        fs.createReadStream(path)
            .pipe(csv())
            .on('data', (row) => {
                // let res = JSON.parse(row['Message JSON']);
                let payload = JSON.parse(row['Message JSON']);
                if (payload.payloadJson && payload.payloadJson.intents) {
                    let dataItem = {
                        date      : row[Object.keys(row)[0]],
                        input     : payload.payloadJson.input.text,
                        output    : payload.text,
                        confidence: payload.payloadJson.intents[0].confidence,
                        user      : payload.userId
                    };

                    data.push(dataItem);
                }
            })
            .on('end', () => {
                resolve(data)
            });
    })
}

function init(dir) {
    let files = fs.readdirSync(dir);
    let db = [];
    let count = 0;

    async function process(name) {
        let data = await processCsv(dir + '/' + name);
        count++;

        db = _.concat(db, data);
    }

    Promise.all(_.map(files, filename => process(filename))).then(res => {
        console.log("writing '" + outputName + "'...");
        fastcsv.write(db)
            .pipe(ws);
    });
}

init(directorySource);
