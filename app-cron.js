const SyncFiles = require('./src/sync-files.js').default;
const CleanCsvToJson = require('./src/clean-csv.js').default;
const { ThingsBoardIo } = require("./src/request-thingsboard.js");

const syncFiles = new SyncFiles(process.env.FTP_HOST, process.env.FTP_PORT, process.env.FTP_USERNAME, process.env.FTP_PASSWORD);
const cleanCsvToJson = new CleanCsvToJson();
const thingsBoardIo = new ThingsBoardIo('tmp-output', true);

async function main(){
    console.log('Starting main function: app-cron.js');
    syncFiles.getFtpConnection().then((readFiles) => {
        console.log("List of files:", readFiles);
        return cleanCsvToJson.start(readFiles);
    }).then((convertedFiles) => {
        console.log("List of converted files:", convertedFiles);
    }).catch((err) => {
        console.log("Error getting FTP connection", err);
    }).finally(() => {
        thingsBoardIo.start().then((uploadedFiles) => {
            // Output list of uploaded files to ThingsBoard and Date and Time
            console.log("List of uploaded files:", uploadedFiles, new Date());
        }).catch((error) => {
            console.log('Error sending data to ThingsBoard:', error);
        });
    });
}


// https://www.npmjs.com/package/cron
var CronJob = require('cron').CronJob;
const job = new CronJob(
	'*/60 * * * *', // cronTime: every 10 minutes // https://crontab.guru/every-10-minutes // 0 5 * * *
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
_init();
console.log('Run app-cron.js');