const SyncFiles = require('./src/sync-files.js').default;
const CleanCsvToJson = require('./src/clean-csv.js').default;
const { ThingsBoardIo } = require("./src/request-thingsboard.js");

const syncFiles = new SyncFiles(process.env.FTP_HOST, process.env.FTP_PORT, process.env.FTP_USERNAME, process.env.FTP_PASSWORD);
const cleanCsvToJson = new CleanCsvToJson();
const thingsBoardIo = new ThingsBoardIo('tmp-output', true);

async function main(){
    console.log('Starting main function');
    syncFiles.getFtpConnection().then((readFiles) => {
        console.log("List of files:", readFiles);
        cleanCsvToJson.start(readFiles).then((convertedFiles) => {
            console.log("List of converted files:", convertedFiles);
            thingsBoardIo.start(convertedFiles).then((uploadedFiles) => {
                console.log('List of Files uploaded:', uploadedFiles);
            }).catch((error) => {
                console.log('Error sending data to ThingsBoard:', error);
            });
        }).catch((error) => {
            console.log('Error converting data:', error);
        });
    }).catch((err) => {
        console.log("Error getting FTP connection", err);
    });
}


// https://www.npmjs.com/package/cron
var CronJob = require('cron').CronJob;
const job = new CronJob(
	'*/10 * * * *', // cronTime: every 10 minutes // https://crontab.guru/every-10-minutes // 0 5 * * *
	main, // onTick
	null, // onComplete
	true, // start
	'Europe/Berlin' // timeZone
);

async function _init(){
    await new Promise(resolve => setTimeout(resolve, 10000));

    main();
}

job.start();
console.log('Run app-cron.js');