const { CleanCsvToJson } = require('./src/clean-csv');

const cleanCsvToJson = new CleanCsvToJson('tmp-input', 'tmp-output');

async function startConvertion() {
    await cleanCsvToJson.start();
    console.log('FERTIG!');
}
startConvertion();