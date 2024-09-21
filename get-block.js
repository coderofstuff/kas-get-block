globalThis.WebSocket = require('websocket').w3cwebsocket; // W3C WebSocket module shim

const kaspa = require('./kaspa');
const { RpcClient, Encoding } = kaspa;
const { scriptPublicKeyToAddress } = require('./kaspa-util');

let rpc = new RpcClient({
    url: '127.0.0.1',
    encoding: Encoding.Borsh,
    networkId: 'mainnet',
});

kaspa.initConsolePanicHook();

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function strToHex(str) {
    return new Uint8Array(str.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }));
}

function spkToAddress(spk) {
    try {
        return scriptPublicKeyToAddress(strToHex(spk), 'kaspa');
    } catch (e) {
        return spk.toString();
    }
}

async function run() {
    await rpc.connect();

    let hash = process.argv[2];
    console.info('hash', hash);

    if (!hash) {
        console.info('USAGE: node get-block.js <block_hash>');
    }

    try {  
            const {block} = await rpc.getBlock({hash, includeTransactions: true});

            const coinbaseTx = block.transactions.find(tx => !tx.inputs || tx.inputs.length === 0);
            const scriptPKLength = Number("0x" + coinbaseTx.payload.substring(18 * 2, 19 * 2));
            const spk = coinbaseTx.payload.substring(19 * 2, 19 * 2 + scriptPKLength * 2);
            const minerData = hex2a(coinbaseTx.payload.substring(19 * 2 + scriptPKLength * 2));
            const address = spkToAddress(spk);

            console.info('Miner Data:', minerData, address);
            
    } finally {
        await rpc.disconnect();
    }
}

run();