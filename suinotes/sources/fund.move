module suinotes::fund {
    use sui::types;
    	use sui::coin::{Coin};


    const ENotOneTimeWitness: u64 = 0x80000001;

    public struct Fund<phantom T> has key {
        id: UID,
        counter: u64,
        //coins: Coin<snttoken::snt::SNT>,
        coins: vector<Coin<snttoken::snt::SNT>>,
    }

    public fun create_fund<T: drop>(
        witness: T,
        ctx: &mut TxContext
    ) {
        assert!(types::is_one_time_witness(&witness), ENotOneTimeWitness);
        transfer::share_object(Fund<T> {
            id: object::new(ctx),
            counter: 0,
            coins: vector<Coin<snttoken::snt::SNT>>[],
        });
    }

    public fun increment_fund<T: drop>(
        f: &mut Fund<T>,
        _ctx: &TxContext
    ) {
        f.counter = f.counter + 1;
    }

    public fun receive_coin<T: drop>(
        f: &mut Fund<T>,
        payment: Coin<snttoken::snt::SNT>,
        _ctx: &TxContext
    ) {
        f.coins.push_back(payment);
    }

    public fun withdraw_coin<T: drop>(
        f: &mut Fund<T>,
        ctx: &TxContext
    ) {
        //f.counter = f.counter + 1;
        
        let c = f.coins.pop_back();
        // c
        transfer::public_transfer(c, ctx.sender())
    }
}
