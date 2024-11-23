module suinotes::suinotes {
	use std::string::{String};
	use sui::coin::{Self, Coin};
	use suinotes::fund;

    //const SNT_COIN_TYPE: vector<u8> = b"0xd99244891ef02247209ac2cbba0198c7524c5d7c32ce37a987190da6371ce402::snt::SNT";
    const REQUIRED_AMOUNT: u64 = 2000000000;

    // const RECIPIENT_ADDRESS: address = @0x9868f9d4e3dfca8a894400630943ed621031a05e4913e60ee9c5c3ffd0ebd7c5;

	public struct Note has key, store {
		id: UID,
		header: String,
		text: String
	}

	public struct SUINOTES has drop {}

	fun init(otw: SUINOTES, ctx: &mut TxContext) {
		fund::create_fund(otw, ctx)
}

	public fun create(f: &mut fund::Fund<SUINOTES>, payment: Coin<snttoken::snt::SNT>, ctx: &mut TxContext) {
        let balance = coin::value(&payment);
        assert!(balance >= REQUIRED_AMOUNT);
        
		let item = Note {
			id: object::new(ctx),
			header: b"header".to_string(),
			text: b"text".to_string()
		};

		fund::receive_coin(f, payment, ctx);
		transfer::transfer(item, ctx.sender())
	}

	/*public fun create1(www: SUINOTES, payment: Coin<snttoken::snt::SNT>, _ctx: &mut TxContext) {
        let balance = coin::value(&payment);
        assert!(balance >= REQUIRED_AMOUNT);
		transfer::public_transfer(payment, RECIPIENT_ADDRESS);
	}*/

	public fun test1(otw: SUINOTES, ctx: &mut TxContext) {
		fund::create_fund(otw, ctx)
	}

	public entry fun set_value(f: &mut fund::Fund<SUINOTES>, counter: &mut Note, value: String, _ctx: &TxContext) {
		counter.text = value;
		fund::increment_fund(f, _ctx)
	}
}
