require('dotenv').config();
const algosdk = require("algosdk");
const { readLocalState, readGlobalState, algod, submitToNetwork } = require("./algorand");

(async () => {
  const algodClient = algod();

  // get player
  const player = algosdk.mnemonicToSecretKey(process.env.ACC1_MNEMONIC);

  // get app ID
  const appIndex = Number(process.env.APP_ID);

  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // call the created application
  const appArgs = [new Uint8Array(Buffer.from("Attack"))];
  const callTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: player.addr,
    suggestedParams,
    appIndex,
    appArgs
  });

  const signedCalledTxn = callTxn.signTxn(player.sk);
  await submitToNetwork(algodClient, signedCalledTxn);

  // read local state of player
  console.log(await readLocalState(algodClient, player.addr, appIndex));

  // read global state of contract
  console.log(await readGlobalState(algodClient, appIndex));
})();