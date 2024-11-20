#[allow(lint(self_transfer))]
module suinotes::suinotes {
	use std::string::{String};
	use sui::coin::{Self, Coin};

    const REQUIRED_AMOUNT: u64 = 2000000000;
    const RECIPIENT_ADDRESS: address = @0x9868f9d4e3dfca8a894400630943ed621031a05e4913e60ee9c5c3ffd0ebd7c5;

	public struct Note has key, store {
		id: UID,
		header: String,
		text: String
	}

	fun init(_ctx: &mut TxContext) {}

	public entry fun create(payment: Coin<snttoken::snt::SNT>, ctx: &mut TxContext) {
        let balance = coin::value(&payment);
        assert!(balance >= REQUIRED_AMOUNT);
        
		let item = Note {
			id: object::new(ctx),
			header: b"header".to_string(),
			text: b"text".to_string()
		};

		transfer::public_transfer(payment, RECIPIENT_ADDRESS);
		transfer::transfer(item, ctx.sender())
	}

	public entry fun set_value(payment: Coin<snttoken::snt::SNT>, counter: &mut Note, value: String, _ctx: &TxContext) {
		counter.text = value;
		transfer::public_transfer(payment, RECIPIENT_ADDRESS);
	}
}
