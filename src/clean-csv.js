const fs = require('fs');
const path = require('path');

const csvtojsonV2=require("csvtojson");


class CleanCsvToJson {
    constructor(inputDirectory, outputDirectory) {
        this.inputDirectory = inputDirectory || 'tmp-input';
        this.outputDirectory = outputDirectory || 'tmp-output';

        this.createDirectoryIfNotExists(this.inputDirectory);
        this.createDirectoryIfNotExists(this.outputDirectory);
    }

    async createDirectoryIfNotExists(directory) {
        return new Promise(async (resolve, reject) => {
            const directoryPath = path.join(__dirname, '..', directory);
            fs.mkdir(directoryPath, { recursive: true }, (err) => {
                if (err) {
                    console.log('Error creating directory', err);
                    reject();
                    return;
                }
                resolve();
            });
        });
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
    
    async convertCsvToJson(file) {
        return new Promise(async (resolve, reject) => {
            const csvFilePath=path.join(__dirname, '..', this.inputDirectory, file);
            const jsonFilePath=path.join(__dirname, '..', this.outputDirectory, file.replace('.csv', '.json'));
            console.log('Converting file:', process.env.CSV_DELIMITER);
            csvtojsonV2({
                delimiter: process.env.CSV_DELIMITER || ','
            })
            .fromFile(csvFilePath)
            .then((jsonObj)=>{
                if(process.env.CSV_DMITEC === 'true'){
                    jsonObj = this.removeSecondLine(jsonObj);
                    jsonObj = this.changeCommaToDot(jsonObj);
                    jsonObj = this.changeDateFormat(jsonObj);
                }

                jsonObj = this.toThingsboardArray(jsonObj);

                fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObj, null, 4));
                console.log('File converted:', jsonFilePath);
                resolve();
            });
        });
    }
    async start() {
        return new Promise(async (resolve, reject) => {
            const files = await this.getFilesFromLocalDirectory(this.inputDirectory);
            for (let i = 0; i < files.length; i++) {
                await this.convertCsvToJson(files[i]);
            }
            resolve();
        });
    }

    // Convert csv to Thingsboard array
    toThingsboardArray(jsonObj) {
        return jsonObj.map((item) => {
            return {
                ts: item.ts,
                values: item
            };
        });
    }

    // Remove the second line of the csv file
    removeSecondLine(jsonObj) {
        return jsonObj.slice(1);
    }

    // Change digits separated by comma to dot
    changeCommaToDot(jsonObj) {
        return jsonObj.map((item) => {
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    item[key] = item[key].replace(',', '.');
                }
            }
            return item;
        });
    }

    /* Change date format from dd.mm.yyyy hh:mm:ss to timestamp */
    changeDateFormat(jsonObj) {
        const key = 'Datum';
        return jsonObj.map((item) => {
            if (item.hasOwnProperty(key)) {
                const dateTime = item[key].split(' ');
                const date = dateTime[0].split('.');
                item['ts'] = Date.parse(`${date[2]}-${date[1]}-${date[0]} ${dateTime[1]}`)
            }
            return item;
        });
    }
}
  
exports.CleanCsvToJson = CleanCsvToJson;
