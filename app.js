'use strict';

let express              = require('express'), // app server
    bodyParser           = require('body-parser'), // parser for post requests
    app                  = express(),

    fs = require('fs');
const {promisify} = require('util');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const _ = require('lodash');
const ws = fs.createWriteStream("out.csv");
const loader = require('csv-load-sync');

app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// CORS Access testing
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

function processCsv(path) {
    return new Promise((resolve, reject) =>
    {
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
                        confidence: payload.payloadJson.intents[0].confidence
                    };

                    data.push(dataItem);
                }
            })
            .on('end', () => {
                resolve(data)
            });
    })
}

const readDir = promisify(fs.readdir);

// Endpoint to be call from the client side
app.get('/', function (req, res) {

    let raw = fs.readFileSync('db.json', 'utf8');
    fastcsv.write(JSON.parse(raw))
        .pipe(ws);

    return res.json(JSON.parse(raw));
});

app.get('/run', function (req, res) {
    let path = 'december';
    let files = fs.readdirSync(path);
    let db = [];
    let count = 0;
    async function process(name) {
        let data = await processCsv(path + '/' + name);
        count++;

        db = _.concat(db, data);
    }


    Promise.all(_.map(files, filename => process(filename))).then(res => {
        // console.log('done');
        fs.writeFileSync('db.json', JSON.stringify(db));
        console.log('complete.');
    });
    // fs.writeFileSync('db.json', JSON.stringify(db));
    return res.json({ok: 'done'})
    // laylaParser('december/0db93747-8112-491f-8f4a-042b8a92bacc.csv');
});

module.exports = app;
