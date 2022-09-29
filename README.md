# hackshack-showcase
This repo contains a game contract which creates a monster with 5 health points when deployed. Players can opt into this contract and perform attacks on it. The player that does the most damage is awarded 1 Algo by the creator.

## Setup instructions

### 1. Install packages
```
npm install
```

### 2. Update environement variables
1. Copy `.env.example` to `.env`.
2. Import accounts for this demo. Update `MNEMONIC_CREATOR` and `ACC1_MNEMONIC` with your own accounts.

## Contract deployment
1. Use the makefile to compile the smart contracts from PyTeal to TEAL
```
make game
```
2. Deploy the contract
```
node scripts/deploy.js
```
3. Update `APP_ID` variable in `.env` file 

## Calling the smart contract

### Opt-In
Complete the code in `scripts/optIn.js` to allow players to participate in the game.

### Attack
Complete the code in `scripts/attack.js` to allow players to attack the monster.

### Reward
Complete the code in `scripts/reward.js` so that the smart contract can dispense reward to the player that does the most damage.
