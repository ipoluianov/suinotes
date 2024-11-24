module suinotes::fund;
use sui::coin::{Coin};

public struct Fund has key, store {
	id: UID,
	counter: u64,
	coins: vector<Coin<snttoken::snt::SNT>>,
}

public fun create_fund(ctx: &mut TxContext) {
    transfer::share_object(Fund {
        id: object::new(ctx),
        counter: 0,
        coins: vector<Coin<snttoken::snt::SNT>>[],
    });
}

public(package) fun receive_payment(f: &mut Fund, payment: Coin<snttoken::snt::SNT>, _ctx: &TxContext) {
    f.coins.push_back(payment);
}

public(package) fun increment(f: &mut Fund, _ctx: &TxContext) {
    f.counter = f.counter + 1;
}

public fun withdraw(f: &mut Fund, ctx: &TxContext) {
    let c = f.coins.pop_back();
    transfer::public_transfer(c, ctx.sender())
}
