module counter::snt {
    use sui::coin::{Self};
    
    public struct SNT has drop {
    }
    
    fun init(witness: SNT, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency<SNT>(witness, 9, b"SNT", b"Sui Notes", b"Sui Notes Token", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        coin::mint_and_transfer<SNT>(&mut treasury, 1000000000000000000, tx_context::sender(ctx), ctx);
        transfer::public_transfer<coin::TreasuryCap<SNT>>(treasury, tx_context::sender(ctx));
    }
}
