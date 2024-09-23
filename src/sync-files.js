const ftpClient = require('ftp');
//const { Client } = require("basic-ftp") 
var fs = require('fs');

const ftp = new ftpClient();


exports.default = class SyncFiles {
    constructor( ftpHost, ftpPort, ftpUsername, ftpPassword) {
        this.ftp = new ftpClient();

        this.ftpHost = ftpHost;
        this.ftpPort = ftpPort;
        this.ftpUsername = ftpUsername;
        this.ftpPassword = ftpPassword;

        this.dir = 'tmp-input';
        if (!fs.existsSync(this.dir)){
            fs.mkdirSync(this.dir, { recursive: true });
        }

        console.log("init SyncFiles", this.ftpHost, this.ftpPort, this.ftpUsername, this.ftpPassword);

        this.downloadedFiles = [];

        //const client = new Client();
        //client.ftp.verbose = true
//
        //client.trackProgress(info => {
        //    console.log("File", info.name)
        //    console.log("Type", info.type)
        //    console.log("Transferred", info.bytes)
        //    console.log("Transferred Overall", info.bytesOverall)
        //})
    }

    async getFtpConnection() {
        const that = this;
        return new Promise((resolve, reject) => {

            this.ftp.on('ready', function() {
                console.log("Connected to FTP server:", that.ftpHost, that.ftpPort, that.ftpUsername);
                that.ftp.list('/', async function(err, list) {
                    if (err) {
                        console.log("Error listing files", err);
                        that.ftp.end();
                        reject(err);
                        return;
                    };
                    for (var i = 0; i < list.length; i++) {
                        await that.loopList('/', list[i]);
                    }
                    that.ftp.end();
                    resolve(that.downloadedFiles);
                });
            });
            this.ftp.on('error', function(err) {
                console.log("Error connecting to FTP server:", err);
                this.ftp.end();
                reject(err);
            });
            this.ftp.connect({
                host: this.ftpHost,
                port: this.ftpPort,
                user: this.ftpUsername,
                password: this.ftpPassword
            });
        });
    }

    async loopList(parentDirectory, directory) {
        const that = this;
        return new Promise(async (resolve, reject) => {
    
            if (directory.type === 'd') {
                this.ftp.list(directory.name, async function(err, list) {
                    if (err || !list) {
                        console.log("Error listing files", err);
                        that.ftp.end();
                        reject();
                        return;
                    };
                    for (var i = 0; i < list.length; i++) {
                        await that.loopList(parentDirectory + directory.name, list[i]);
                    }
                    resolve();
                });
            }else if (directory.type === '-' && directory.name.endsWith('.csv')) {
                const downloadedFile = await this.readFile(parentDirectory, directory.name);
                if ( downloadedFile ) this.downloadedFiles.push(downloadedFile);
                resolve();
            }else{
                resolve();
            }
        });
    }

    async readFile(parentDirectory, fileName){
        const that = this;
        const newFileName = parentDirectory+'/'+fileName;
    
        return new Promise((resolve, reject) => {

            if (fs.existsSync(this.dir + '/' + fileName)) {
                //console.log("File already exists", this.dir + '/' + fileName);
                resolve(null);
                return;
            }

            console.log("Reading file", parentDirectory+'/'+fileName);

            this.ftp.get(newFileName, function(err, stream) {
                if (err) {
                    console.log("Error getting file", err);
                    return;
                };
                stream.once('close', function() { 
                    resolve(that.dir + '/' + fileName);
                 });
                stream.pipe(fs.createWriteStream(that.dir + '/' + fileName));
            });
        });
    }
}