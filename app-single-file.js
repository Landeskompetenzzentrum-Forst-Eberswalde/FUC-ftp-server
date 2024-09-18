const SyncFiles = require('./src/sync-files.js').default;
const CleanCsvToJson = require('./src/clean-csv.js').default;
const { ThingsBoardIo } = require("./src/request-thingsboard.js");

const syncFiles = new SyncFiles(process.env.FTP_HOST, process.env.FTP_PORT, process.env.FTP_USERNAME, process.env.FTP_PASSWORD);
const cleanCsvToJson = new CleanCsvToJson();
const thingsBoardIo = new ThingsBoardIo('tmp-output', true);

async function main(fileName){
    
    cleanCsvToJson.start([fileName]).then((convertedFiles) => {
        console.log("List of converted files:", convertedFiles);
        thingsBoardIo.start(convertedFiles).then((uploadedFiles) => {
            console.log('List of Files uploaded:', uploadedFiles);
        }).catch((error) => {
            console.log('Error sending data to ThingsBoard:', error);
        });
    }).catch((error) => {
        console.log('Error converting data:', error);
    });
   
}
main('2024-08-31_02h03_Kienhorst_Bestand.csv');
console.log('Run app.js');