module counter::counter {
	use std::string::{String};

	public struct Counter has key {
		id: UID,
		text: String
	}

	public fun create(ctx: &mut TxContext) {
		transfer::transfer(Counter {
			id: object::new(ctx),
			text: b"text".to_string()
		}, ctx.sender())
	}

	public entry fun set_value(counter: &mut Counter, value: String, _ctx: &TxContext) {
		counter.text = value
	}
}
