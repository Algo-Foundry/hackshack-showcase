require("dotenv").config();
const algosdk = require("algosdk");
const { readLocalState, algod, submitToNetwork } = require("./algorand");

(async () => {
  const algodClient = algod();

  // get player
  const player = algosdk.mnemonicToSecretKey(process.env.ACC1_MNEMONIC);

  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // get app ID
  const appIndex = Number(process.env.APP_ID);

  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    from: player.addr,
    appIndex,
    suggestedParams
  });

  // sign txn
  const signedOptInTxn = optInTxn.signTxn(player.sk);
  await submitToNetwork(algodClient, signedOptInTxn);

  // read local state of player
  console.log(await readLocalState(algodClient, player.addr, appIndex));
})();