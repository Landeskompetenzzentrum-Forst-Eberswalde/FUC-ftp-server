var CronJob = require('cron').CronJob;
const ftpClient = require('ftp');
const { Client } = require("basic-ftp") 
var fs = require('fs');

const ftp = new ftpClient();

const client = new Client();
client.ftp.verbose = true

client.trackProgress(info => {
    console.log("File", info.name)
    console.log("Type", info.type)
    console.log("Transferred", info.bytes)
    console.log("Transferred Overall", info.bytesOverall)
})

async function getFtpConnection() {

	ftp.on('ready', function() {
		console.log("Connected to FTP server", process.env.FTP_HOST, process.env.FTP_PORT, process.env.FTP_USERNAME, process.env.FTP_PASSWORD);
		ftp.list('/', async function(err, list) {
			if (err) {
				console.log("Error listing files", err);
				ftp.end();
				return;
			};
			for (var i = 0; i < list.length; i++) {
				await loopList('/', list[i]);
			}
			console.log('FERTIG');
			ftp.end();
		});
	});
	ftp.on('error', function(err) {
		console.log("Error connecting to FTP server", process.env.FTP_HOST, process.env.FTP_PORT, process.env.FTP_USERNAME, process.env.FTP_PASSWORD, err);
	});
	ftp.connect({
		host: process.env.FTP_HOST,
		port: process.env.FTP_PORT,
		user: process.env.FTP_USERNAME,
		password: process.env.FTP_PASSWORD
	});
}

async function loopList(parentDirectory, directory) {
	return new Promise(async (resolve, reject) => {


		if (directory.type === 'd') {
			ftp.list(directory.name, async function(err, list) {
				if (err) {
					console.log("Error listing files", err);
					ftp.end();
					reject();
					return;
				};
				for (var i = 0; i < list.length; i++) {
					await loopList(parentDirectory + directory.name, list[i]);
				}
				resolve();
			});
		}else if (directory.type === '-' && directory.name.endsWith('.csv')) {
			await readFile(parentDirectory, directory.name);
			resolve();
		}else{
			resolve();
		}
	});
}

async function readFile(parentDirectory, fileName){
	console.log("Reading file", parentDirectory+'/'+fileName);
	const newFileName = parentDirectory+'/'+fileName;

	return new Promise((resolve, reject) => {
		ftp.get(newFileName, function(err, stream) {
			if (err) {
				console.log("Error getting file", err);
				return;
			};
			stream.once('close', function() { 
				//ftp.end();
				resolve();
			 });
			stream.pipe(fs.createWriteStream('tmp-input/' + fileName));
		});
	});
	/*return new Promise((resolve, reject) => {
		ftp.get(fileName, function(err, stream) {
			if (err) {
				console.log("Error getting file", err);
				return reject(err);
			};
			console.log("Got file", fileName);

			stream.once('close', function() { ftp.end(); });
			stream.pipe(fs.createWriteStream('documents/2024-06-27_07h59_Beerenbusch_Bestand.csv'));

			//stream.once('close', function() { ftp.end(); });
			//stream.pipe(fs.createWriteStream(`${__dirname}/${fileName}_local.csv`));
			resolve();
		});
	});*/
}

const job = new CronJob(
	'*/60 * * * * *', // cronTime
	getFtpConnection, // onTick
	null, // onComplete
	false, // start
	'Europe/Berlin' // timeZone
);

getFtpConnection()

//job.start();
