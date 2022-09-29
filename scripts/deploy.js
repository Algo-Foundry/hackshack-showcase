require("dotenv").config();
const algosdk = require("algosdk");
const { compileTealProgram, readGlobalState, algod, submitToNetwork } = require("./algorand");

(async () => {
  const algodClient = algod();

  const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

  // set monster health
  const monsterHealth = 5;

  // define application parameters
  const from = creator.addr;
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;
  const approvalProgram = await compileTealProgram(algodClient, "game_approval.teal");
  const clearProgram = await compileTealProgram(algodClient, "game_clearstate.teal");
  const numLocalInts = 1;
  const numLocalByteSlices = 0;
  const numGlobalInts = 2;
  const numGlobalByteSlices = 1;  
  const appArgs = [algosdk.encodeUint64(monsterHealth)];

  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // create the application creation transaction
  const createTxn = algosdk.makeApplicationCreateTxnFromObject({
    from,
    suggestedParams,
    onComplete,
    approvalProgram,
    clearProgram,
    numLocalInts,
    numLocalByteSlices,
    numGlobalInts,
    numGlobalByteSlices,
    appArgs
  });

  // sign txn
  const signedCreateTxn = createTxn.signTxn(creator.sk);
  const confirmedTxn = await submitToNetwork(algodClient, signedCreateTxn);

  const appIndex = confirmedTxn["application-index"];
  console.log("App ID:", appIndex);

  console.log(await readGlobalState(algodClient, appIndex));

  // fund app with some rewards
  const appAddress = algosdk.getApplicationAddress(appIndex);
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to: appAddress,
    amount: 5e6, // 5 Algos
    suggestedParams 
  })

  // sign txn
  const signedPaymentTxn = paymentTxn.signTxn(creator.sk);
  await submitToNetwork(algodClient, signedPaymentTxn);

  // check game contract
  const appAddr = algosdk.getApplicationAddress(appIndex);
  console.log(await algodClient.accountInformation(appAddr).do());
})();