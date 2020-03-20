const csv = require('csv-parser');
const fs = require('fs');

module.exports = function(file) {
    let res = [];
    fs.createReadStream(file)
        .pipe(csv())
        .on('data', (row) => {
            // let res = JSON.parse(row['Message JSON']);
            res.push(row);
        })
        .on('end', () => {

        });
};

