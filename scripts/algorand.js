require('dotenv').config();
const path = require('path');
const fs = require('fs');
const algosdk = require('algosdk');

const algod = () => {
  return new algosdk.Algodv2(
    process.env.ALGOD_TOKEN,
    process.env.ALGOD_SERVER,
    process.env.ALGOD_PORT
  );
}

const compileTealProgram = async (algod, filename) => {
  // Read file for Teal code
  const filePath = path.join(__dirname, "../assets/" + filename);
  const data = fs.readFileSync(filePath);

  // use algod to compile the program
  const compiledProgram = await algod.compile(data).do();
  return new Uint8Array(Buffer.from(compiledProgram.result, "base64"));
}

const submitToNetwork = async (algod, signedTxn) => {
  // send txn
  let tx = await algod.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algod, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

const readGlobalState = async (algod, appId) => {
  const app = await algod.getApplicationByID(appId).do();
  
  // global state is a key value array
  const globalState = app.params["global-state"];
  const formattedGlobalState = globalState.map(item => {
    // decode from base64 and utf8
    const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));

    let formattedValue;
    if (item.value.type === 1) {
      if (formattedKey === "voted") {
        formattedValue = decodeURIComponent(Buffer.from(item.value.bytes, "base64"));
      } else {
        formattedValue = item.value.bytes;
      }
    } else {
      formattedValue = item.value.uint;
    }
    
    return {
      key: formattedKey,
      value: formattedValue
    }
  });

  return formattedGlobalState;
}

const readLocalState = async (algod, accAddr, appID) => {
  const acc = await algod.accountInformation(accAddr).do();
  const localStates = acc["apps-local-state"];

  const appLocalState = localStates.find(ls => {
      return ls.id === appID;
  })
  
  let formattedLocalState;
  if (appLocalState !== undefined) {
      formattedLocalState = appLocalState["key-value"].map(item => {
          // decode from base64 encoded bytes
          const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));
  
          let formattedValue;
          if (item.value.type === 1) {
              //value is base64 encoded bytes, convert it back to string
              formattedValue = decodeURIComponent(Buffer.from(item.value.bytes, "base64"));
          } else {
              formattedValue = item.value.uint;
          }
          
          return {
              key: formattedKey,
              value: formattedValue
          }
      });
  }

  return formattedLocalState;
}

module.exports = {
  algod,
  compileTealProgram,
  submitToNetwork,
  readGlobalState,
  readLocalState
};