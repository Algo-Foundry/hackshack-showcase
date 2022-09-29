from pyteal import *

def game():
    '''
    Initialize monster with specified health
    '''
    monsterHealth = Btoi(Txn.application_args[0])
    handle_creation = Seq([
        App.globalPut(Bytes("Health"), monsterHealth),
        App.globalPut(Bytes("MaxDamage"), Int(0)),
        Return(Int(1))
    ])

    '''
    Initialize player's damage dealt to the monster
    '''
    handle_optin = Seq([
        App.localPut(Txn.sender(), Bytes("Damage"), Int(0)),
        Return(Int(1))
    ])

    '''
    Attacks the monster
    '''
    currentMonsterHealth = App.globalGet(Bytes("Health"))
    playerDamage = Int(2) # deal 2 damage
    playerCurrentDamage = App.localGet(Txn.sender(), Bytes("Damage")) # returns 0 if state is not found
    playerTotalDamage = playerCurrentDamage + playerDamage
    currentMvpDamage = App.globalGet(Bytes("MaxDamage")) # highest amount of damage dealt to monster    
    
    update_player_total_damage = Seq([
        App.localPut(Txn.sender(), Bytes("Damage"), playerTotalDamage),
    ])

    update_monster_health = If(
        playerDamage > currentMonsterHealth, 
        App.globalPut(Bytes("Health"), Int(0)), # monster is dead
        App.globalPut(Bytes("Health"), currentMonsterHealth - playerDamage) # reduce monster health
    )

    update_mvp = If(
        playerTotalDamage > currentMvpDamage,
        Seq([
            App.globalPut(Bytes("Mvp"), Txn.sender()),
            App.globalPut(Bytes("MaxDamage"), playerTotalDamage)
        ])
    )

    attack_monster = Seq([
        update_mvp,
        update_player_total_damage,
        update_monster_health,
        Return(Int(1))
    ])

    '''
    Reward player
    '''
    mvp = App.globalGet(Bytes("Mvp"))
    reward_player = Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: Txn.accounts[1],
            TxnField.amount: Int(1000000),
        }),
        InnerTxnBuilder.Submit(),
        Return(Int(1))
    ])

    handle_noop = Seq( 
        Cond(
            [Txn.application_args[0] == Bytes("Attack"), attack_monster],
            [Txn.application_args[0] == Bytes("Reward"), reward_player]
        )
    )

    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))

    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

    return program

if __name__ == "__main__":
    print(compileTeal(game(), mode=Mode.Application, version=6))