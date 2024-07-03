const { ThingsBoardIo } = require("./src/request-thingsboard.js");

const thingsBoardIo = new ThingsBoardIo('tmp-output');

async function startSending() {
    thingsBoardIo.start().then(() => {
        console.log('FERTIG!');
    }).catch((error) => {
        console.log('Error sending data to ThingsBoard:', error);
    });
}
startSending();