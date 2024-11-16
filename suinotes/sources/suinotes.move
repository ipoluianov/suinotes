module counter::counter {
	use std::string::{String};
	use sui::coin::{Self, Coin};

    //const SNT_COIN_TYPE: vector<u8> = b"0xd99244891ef02247209ac2cbba0198c7524c5d7c32ce37a987190da6371ce402::snt::SNT";
    const REQUIRED_AMOUNT: u64 = 100;

    const RECIPIENT_ADDRESS: address = @0x9868f9d4e3dfca8a894400630943ed621031a05e4913e60ee9c5c3ffd0ebd7c5;

	public struct Counter has key, store {
		id: UID,
		text: String
	}

	public fun create(payment: Coin<snttoken::snt::SNT>, ctx: &mut TxContext) {
        let balance = coin::value(&payment);
        assert!(balance >= REQUIRED_AMOUNT);
        
		//coin::drop(payment);

		let item = Counter {
			id: object::new(ctx),
			text: b"text".to_string()
		};

		transfer::public_transfer(payment, RECIPIENT_ADDRESS);
		transfer::transfer(item, ctx.sender())
		
	}

	public fun create1(payment: Coin<snttoken::snt::SNT>, _ctx: &mut TxContext) {
        let balance = coin::value(&payment);
        assert!(balance >= REQUIRED_AMOUNT);
		transfer::public_transfer(payment, RECIPIENT_ADDRESS);
	}

	public entry fun set_value(counter: &mut Counter, value: String, _ctx: &TxContext) {
		counter.text = value
	}
}
