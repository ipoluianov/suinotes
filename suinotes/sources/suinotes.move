module suinotes::suinotes;

use std::string::{String};
use sui::coin::{Self, Coin};
use sui::package;
use sui::display;
use suinotes::fund;

const REQUIRED_AMOUNT: u64 = 2000000000;

public struct Note has key, store {
	id: UID,
	header: String,
	text: String
}

public struct SUINOTES has drop {}
fun init(otw: SUINOTES, ctx: &mut TxContext) {
	let keys = vector[
		b"name".to_string(),
		b"link".to_string(),
		b"image_url".to_string(),
		b"description".to_string(),
		b"project_url".to_string(),
		b"creator".to_string(),
	];

    let values = vector[
        b"{header}".to_string(),
        b"https://u00.io/".to_string(),
        b"https://u00.io/public/icons/logo64.png".to_string(),
        b"U00 description".to_string(),
        b"https://u00.io/".to_string(),
        b"U00 Creator".to_string(),
    ];

	let publisher = package::claim(otw, ctx);
	let mut display = display::new_with_fields<Note>(
        &publisher, keys, values, ctx
    );
	display.update_version();
	transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());

	// Create default fund
	fund::create_fund(ctx);
}

#[allow(lint(self_transfer))]
public fun create_note(f: &mut fund::Fund, ref: address, payment: Coin<snttoken::snt::SNT>, ctx: &mut TxContext) {
	let balance = coin::value(&payment);
	assert!(balance >= REQUIRED_AMOUNT);
	
	let item = Note {
		id: object::new(ctx),
		header: ref.to_string(),
		text: b"text".to_string()
	};
	fund::receive_payment(f, payment, ctx);
	transfer::transfer(item, ctx.sender())
}

public entry fun set_value(f: &mut fund::Fund, counter: &mut Note, value: String, _ctx: &TxContext) {
	counter.text = value;
	fund::increment(f, _ctx);
}
