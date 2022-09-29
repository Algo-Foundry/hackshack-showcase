require('dotenv').config();
const algosdk = require("algosdk");
const { compileTealProgram, readGlobalState, algod, submitToNetwork } = require("./algorand");

(async () => {
  const algodClient = algod();

  // get creator
  const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

  // get app ID
  const appIndex = Number(process.env.APP_ID);

  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // get MVP address
  const gs = await readGlobalState(algodClient, appIndex);
  const mvpKV = gs.find(item => item.key === "Mvp");
  const mvpAddress = algosdk.encodeAddress(Buffer.from(mvpKV.value, 'base64'));
  
  // read local state of player
  const accInfoA = await algodClient.accountInformation(mvpAddress).do();
  const mvpAmountBefore = accInfoA.amount;

  // call the created application
  const appArgs = [new Uint8Array(Buffer.from("Reward"))];
  const accounts = [mvpAddress];
  const callTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: creator.addr,
    suggestedParams,
    appIndex,
    appArgs,
    accounts 
  });

  const signedCalledTxn = callTxn.signTxn(creator.sk);
  await submitToNetwork(algodClient, signedCalledTxn);

  // read local state of player
  const accInfoB = await algodClient.accountInformation(mvpAddress).do();
  const mvpAmountAfter = accInfoB.amount;

  console.log("diff: ", mvpAmountAfter - mvpAmountBefore);
})();