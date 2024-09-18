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
                reject(error);
            }
            resolve();
        });
    }
    async postSensorDataToThingsboard(data, key) {
        return new Promise(async (resolve, reject) => {
            const url = `${process.env.THINGSBOARD_PROTOCOL}://${process.env.THINGSBOARD_HOST}:${process.env.THINGSBOARD_PORT}/api/v1/${key}/telemetry`;
            
            axios.post(url, data)
            .then(function (response) {
                if (response.status != 200) {
                    console.log('Error sending data to ThingsBoard:', url);
                    reject();
                    return;
                }else{
                    console.log('Data sent to ThingsBoard:', url);
                }
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
    async removeFile(file) {
        return new Promise(async (resolve, reject) => {
            const filePath = path.join(__dirname, '..', this.directory, file);

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log('Error removing file', err);
                    reject();
                    return;
                }
                resolve();
            });
        });
    }
    async start(listOfFiles = []) {
        const filesSent = [];
        const keys = [];
        return new Promise(async (resolve, reject) => {

            const listOfFiles = await this.readOutputDirectory(); // ALL FILES

            for (const filePath of listOfFiles) {
                const file = filePath.split('/').pop();
                let fileNameArray = file.split('_').splice(2);
                const found = thingsBoardKeys.find((element) => element.contains == fileNameArray.join('_'));

                if(!found){
                    keys.push({
                        //key: file.split('_')[0],
                        "contains": fileNameArray.join('_')
                    });
                    continue;
                }

                for (const key of thingsBoardKeys) {
                    if (key.hasOwnProperty('key') && file.includes(key.contains)) {
                        await this.sendJsonToThingsBoard(file, key.key).then(() => {
                            filesSent.push(file);
                            this.removeFile(file);
                        }).catch((error) => {
                            reject(error);
                        });
                    }
                }
            }
            if(keys.length > 0){
                console.log('Keys not found:', keys);
            }
            resolve(filesSent);
        });
    }
}
  
exports.ThingsBoardIo = ThingsBoardIo;


//curl -v -X POST http://localhost:8080/api/v1/WCNNbOSldc99DpPUaEcg/telemetry --header Content-Type:application/json --data "{temperature:25}"