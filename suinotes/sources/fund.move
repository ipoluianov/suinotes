module suinotes::fund;
use sui::coin::{Self, Coin};
use sui::balance;
use sui::table::{Table};

public struct Fund has key, store {
	id: UID,
	counter: u64,
    balance: balance::Balance<snttoken::snt::SNT>,
    refByAddress: Table<address, address>
}

public(package) fun create_fund(ctx: &mut TxContext) {
    transfer::share_object(Fund {
        id: object::new(ctx),
        counter: 0,
        balance: balance::zero(),
        refByAddress: sui::table::new<address, address>(ctx)
    });
}

public(package) fun receive_payment(f: &mut Fund, payment: Coin<snttoken::snt::SNT>, _ctx: &TxContext) {
    coin::put(&mut f.balance, payment)
}

public(package) fun increment(f: &mut Fund, _ctx: &TxContext) {
    f.counter = f.counter + 1;
}

#[allow(lint(self_transfer))]
public fun withdraw(f: &mut Fund, ctx: &mut TxContext) {
    let total_balance = f.balance.value();
    let coin = coin::take(&mut f.balance, total_balance, ctx);
    transfer::public_transfer(coin, ctx.sender())
}

public fun declare_ref(f: &mut Fund, ref: address, ctx: &TxContext) {
    f.refByAddress.add(ctx.sender(), ref);
}
