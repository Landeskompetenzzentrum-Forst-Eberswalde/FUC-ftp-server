const fs = require('fs');
const path = require('path');
const axios = require('axios');

const thingsBoardKeys = require('../config/mapping-keys.json')



class ThingsBoardIo {
    constructor(directory) {
        this.directory = directory || 'tmp-output';
    }

    async getFilesFromLocalDirectory(directory) {
        return new Promise(async (resolve, reject) => {
            const directoryPath = path.join(__dirname, '..', directory);
            fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    console.log('Error getting files from directory', err);
                    reject();
                    return;
                }
                resolve(files);
            });
        });
    }
    async sendJsonToThingsBoard(file, key) {
        return new Promise(async (resolve, reject) => {
            const jsonFilePath=path.join(__dirname, '..', this.directory, file);
            const data = fs.readFileSync(jsonFilePath);
            try {
                await this.postSensorDataToThingsboard(JSON.parse(data), key);
            } catch (error) {
                console.log('Error sending data to ThingsBoard:', error);
            }
            resolve();
        });
    }
    async postSensorDataToThingsboard(data, key) {
        return new Promise(async (resolve, reject) => {
            const url = `${process.env.THINGSBOARD_PROTOCOL}://${process.env.THINGSBOARD_HOST}:${process.env.THINGSBOARD_PORT}/api/v1/${key}/telemetry`;
            
            console.log(url);
            
            axios.post(url, data)
            .then(function (response) {
                console.log(response);
                resolve();
            })
            .catch(function (error) {
                console.log('ERROR:', error);
                reject();
            });
        });
    }
    async readOutputDirectory() {
        return new Promise(async (resolve, reject) => {
            const files = await this.getFilesFromLocalDirectory(this.directory);
            resolve(files);
        });
    }
    async start() {
        return new Promise(async (resolve, reject) => {
            const files = await this.readOutputDirectory();
            for (const file of files) {
                for (const key of thingsBoardKeys) {
                    if (file.includes(key.contains)) {
                        await this.sendJsonToThingsBoard(file, key.key).then(() => {
                            console.log('File sent:', file);
                        }).catch((error) => {
                            console.log('Error sending file:', file, error);
                        });
                    }
                }
            }
            resolve();
        });
    }
}
  
exports.ThingsBoardIo = ThingsBoardIo;


//curl -v -X POST http://localhost:8080/api/v1/WCNNbOSldc99DpPUaEcg/telemetry --header Content-Type:application/json --data "{temperature:25}"