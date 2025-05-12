module pump_fun::pump_for_fun {
    use std::string::{Self, String};
    use std::option;
    use std::signer;
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::fungible_asset::{Self, Metadata, MintRef, TransferRef, BurnRef};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::timestamp;
    // use pyth::pyth;
    // use pyth::i64;
    // use aptos_std::math64::pow;
    // use pyth::price::{Self, Price};
    // use pyth::price_identifier;

    // Constants
    const DECIMAL: u8 = 8;
    const MAX_SUPPLY: u64 = 1_000_000_000;
    const FEE: u64 = 10_000_000; // 0.1 APT
    const INITIAL_TOKEN_PER_MOVE: u64 = 500_000_000;
    const MOVE_DECIMALS: u8 = 8;
    const MOVE_MULTIPLIER: u64 = 100_000_000; // 10^8 for APT decimals
    const OCTAS_PER_MOVE: u64 = 100000000;

    // Error codes
    const INSUFFICIENT_LIQUIDITY: u64 = 1;
    const INVALID_AMOUNT: u64 = 2;
    const ERR_NOT_OWNER: u64 = 3;
    const ERR_ZERO_AMOUNT: u64 = 4;
    const ERR_MAX_SUPPLY_EXCEEDED: u64 = 5;
    const ERR_NOT_ADMIN: u64 = 6;
    const ERR_TOKEN_EXISTS: u64 = 7;
    const ERR_ACCOUNT_NOT_REGISTERED: u64 = 8;
    const ERR_INVALID_PRICE: u64 = 9;

    /// Global configuration for the pump_fun module
    struct AppConfig has key {
        fees: u64,
        admin: address,
        history: vector<History>,
        tokens: vector<Token>,
        token_addresses: vector<address>, // Tracks all token addresses
    }

    /// Represents a token with metadata and transaction history
    struct Token has key, store, copy {
        id: u64, // Unique identifier for the token
        name: String,
        symbol: String,
        icon_uri: String,
        project_url: String,
        history: vector<History>,
        timestamp: u64,
        token_addr: address, // Address of the token object
    }

    /// Transaction history entry
    struct History has key, store, copy {
        move_amount: u64,
        token_amount: u64,
        buyer: address,
        seller: address,
        timestamp: u64,
        amount_in_usd: u64,
        amount_out_usd: u64,
    }

    /// Controller for fungible asset operations
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct FAController has key {
        dev_address: address,
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
    }

    /// Liquidity pool for token-APT trading pair
    struct LiquidityPool has key {
        token_reserve: u64,
        move_reserve: u64,
        token_address: Object<Metadata>,
        owner: address,
        signer_cap: SignerCapability,
    }

    /// Initialize the module with admin configuration
    fun init_module(sender: &signer) {
        let admin_addr = signer::address_of(sender);
        move_to(sender, AppConfig {
            fees: FEE,
            admin: admin_addr,
            history: vector::empty<History>(),
            tokens: vector::empty<Token>(),
            token_addresses: vector::empty<address>(),
        });
    }

    /// Record transaction history with USD values using Pyth oracle
    fun record_history(
        token_addr: address,
        move_amount: u64,
        token_amount: u64,
        buyer: address,
        seller: address
    ) acquires Token, AppConfig {
        // Update the Token resource at token_addr
        let token = borrow_global_mut<Token>(token_addr);
        let token_id = token.id;

        // Get APT/USD price from Pyth oracle
        // let price_id = price_identifier::from_byte_vec(b"0xee0c08f6b500a5933e95f75169dcd8910d9ff8d4acc6d07c9f577113a2387b9c");
        // let price_info = pyth::get_price(price_id);

        // let price_positive = i64::get_magnitude_if_positive(&price::get_price(&price_info)); // This will fail if the price is negative
        // let expo_magnitude = i64::get_magnitude_if_negative(&price::get_expo(&price_info)); // This will fail if the exponent is positive

        let price_in_move_coin =  (OCTAS_PER_MOVE * 1); // 1 MOVE in USD

        assert!(price_in_move_coin > 0, ERR_INVALID_PRICE);

        // Calculate USD values (price is in 10^-8 USD per APT)

        let amount_in_usd = if (move_amount > 0) {
            (move_amount * price_in_move_coin) / MOVE_MULTIPLIER // Convert to USD
        } else {
            0
        };
        let amount_out_usd = if (token_amount > 0) {
            (token_amount * price_in_move_coin) / MOVE_MULTIPLIER // Convert to USD
        } else {
            0
        };

        let history_entry = History {
            move_amount,
            token_amount,
            buyer,
            seller,
            timestamp: timestamp::now_microseconds(),
            amount_in_usd,
            amount_out_usd,
        };
        vector::push_back(&mut token.history, history_entry);

        // Update the Token in AppConfig's tokens vector
        let app_config = borrow_global_mut<AppConfig>(@pump_fun);
        let len = vector::length(&app_config.tokens);
        let token = vector::borrow_mut<Token>(&mut app_config.tokens, token_id);
        vector::push_back(&mut token.history, history_entry);
    }

    /// Create a new token with initial liquidity
    public entry fun create_token(
        sender: &signer,
        name: string::String,
        symbol: string::String,
        icon_uri: string::String,
        project_url: string::String,
        initial_move_amount: u64
    ) acquires AppConfig, FAController {
        assert!(initial_move_amount > 0, ERR_ZERO_AMOUNT);

        // Charge creation fee
        let app_config = borrow_global_mut<AppConfig>(@pump_fun);
        let admin_addr = app_config.admin;
        let sender_addr = signer::address_of(sender);
        assert!(coin::is_account_registered<AptosCoin>(sender_addr), ERR_ACCOUNT_NOT_REGISTERED);
        let fee_coins = coin::withdraw<AptosCoin>(sender, app_config.fees);
        coin::deposit<AptosCoin>(admin_addr, fee_coins);

        // Create token object
        let constructor_ref = object::create_named_object(sender, *string::bytes(&name));
        let object_signer = object::generate_signer(&constructor_ref);
        let token_addr = signer::address_of(&object_signer);

        // Prevent duplicate tokens
        assert!(!vector::contains(&app_config.token_addresses, &token_addr), ERR_TOKEN_EXISTS);
        vector::push_back(&mut app_config.token_addresses, token_addr);

        // Initialize fungible asset
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            option::some((MAX_SUPPLY as u128)),
            name,
            symbol,
            DECIMAL,
            icon_uri,
            project_url
        );

        let fa_obj = object::object_from_constructor_ref<Metadata>(&constructor_ref);

        // Initialize token data
        let token_id = vector::length(&app_config.tokens); // Use the index as the ID
        let token = Token {
            id: token_id,
            name,
            symbol,
            icon_uri,
            project_url,
            history: vector::empty<History>(),
            timestamp: timestamp::now_microseconds(),
            token_addr,
        };
        move_to(&object_signer, token);

        // Add token to AppConfig's tokens vector
        vector::push_back(&mut app_config.tokens, token);

        // Set up token controller
        move_to(&object_signer, FAController {
            dev_address: sender_addr,
            mint_ref: fungible_asset::generate_mint_ref(&constructor_ref),
            burn_ref: fungible_asset::generate_burn_ref(&constructor_ref),
            transfer_ref: fungible_asset::generate_transfer_ref(&constructor_ref),
        });

        let creator_amount = MAX_SUPPLY / 20;
        mint_tokens(sender, fa_obj, creator_amount);

        // Calculate token amount for liquidity pool
        let pool_token_amount = (initial_move_amount as u128) * (INITIAL_TOKEN_PER_MOVE as u128) / (MOVE_MULTIPLIER as u128);
        assert!(((creator_amount as u128) + pool_token_amount) <= (MAX_SUPPLY as u128), ERR_MAX_SUPPLY_EXCEEDED);

        // Initialize liquidity pool
        initialize_liquidity_pool(sender, fa_obj, initial_move_amount, (pool_token_amount as u64));
    }

    /// Buy tokens using APT
    public entry fun buy_token(
        sender: &signer,
        token: Object<Metadata>,
        move_amount: u64
    ) acquires LiquidityPool, Token, AppConfig {
        assert!(move_amount > 0, ERR_ZERO_AMOUNT);

        let pool_addr = object::object_address(&token);
        let lp = borrow_global_mut<LiquidityPool>(pool_addr);

        // Calculate token output
        let token_out = get_output_amount(move_amount, lp.move_reserve, lp.token_reserve);
        assert!(token_out > 0, INSUFFICIENT_LIQUIDITY);

        // Transfer APT to pool
        let sender_addr = signer::address_of(sender);
        assert!(coin::is_account_registered<AptosCoin>(sender_addr), ERR_ACCOUNT_NOT_REGISTERED);
        let move_coins = coin::withdraw<AptosCoin>(sender, move_amount);
        coin::deposit(pool_addr, move_coins);

        // Transfer tokens from pool to buyer
        let pool_signer = account::create_signer_with_capability(&lp.signer_cap);
        primary_fungible_store::transfer(
            &pool_signer,
            lp.token_address,
            sender_addr,
            token_out
        );

        // Update pool reserves
        lp.move_reserve = lp.move_reserve + move_amount;
        lp.token_reserve = lp.token_reserve - token_out;

        // Record transaction history
        record_history(
            pool_addr,
            move_amount,
            token_out,
            sender_addr,
            pool_addr // Pool acts as seller
        );
    }

    /// Mint tokens to an account
    fun mint_tokens(
        account: &signer,
        token: Object<Metadata>,
        amount: u64,
    ) acquires FAController {
        let token_addr = object::object_address(&token);
        let controller = borrow_global<FAController>(token_addr);
        let fa = fungible_asset::mint(&controller.mint_ref, amount);
        primary_fungible_store::deposit(signer::address_of(account), fa);
    }

    /// Initialize a liquidity pool for a token
    fun initialize_liquidity_pool(
        sender: &signer,
        token: Object<Metadata>,
        move_amount: u64,
        token_amount: u64
    ) acquires FAController {
        let (pool_signer, signer_cap) = account::create_resource_account(sender, b"Liquidity_Pool");
        let pool_addr = signer::address_of(&pool_signer);

        if (!coin::is_account_registered<AptosCoin>(pool_addr)) {
            coin::register<AptosCoin>(&pool_signer);
        };

        mint_tokens(&pool_signer, token, token_amount);
        let move_coins = coin::withdraw<AptosCoin>(sender, move_amount);
        coin::deposit(pool_addr, move_coins);

        move_to(&pool_signer, LiquidityPool {
            token_reserve: token_amount,
            move_reserve: move_amount,
            token_address: token,
            owner: signer::address_of(sender),
            signer_cap,
        });
    }

    /// Swap APT for tokens
    public entry fun swap_move_to_token(
        sender: &signer,
        pool: Object<Metadata>,
        move_amount: u64
    ) acquires LiquidityPool, Token, AppConfig {
        assert!(move_amount > 0, ERR_ZERO_AMOUNT);
        let pool_addr = object::object_address(&pool);
        let lp = borrow_global_mut<LiquidityPool>(pool_addr);

        let token_out = get_output_amount(move_amount, lp.move_reserve, lp.token_reserve);
        assert!(token_out > 0, INSUFFICIENT_LIQUIDITY);

        let sender_addr = signer::address_of(sender);
        assert!(coin::is_account_registered<AptosCoin>(sender_addr), ERR_ACCOUNT_NOT_REGISTERED);
        let move_coins = coin::withdraw<AptosCoin>(sender, move_amount);
        coin::deposit(pool_addr, move_coins);

        let pool_signer = account::create_signer_with_capability(&lp.signer_cap);
        primary_fungible_store::transfer(
            &pool_signer,
            lp.token_address,
            sender_addr,
            token_out
        );
        lp.move_reserve = lp.move_reserve + move_amount;
        lp.token_reserve = lp.token_reserve - token_out;

        // Record transaction history
        record_history(
            pool_addr,
            move_amount,
            token_out,
            sender_addr,
            pool_addr // Pool acts as seller
        );
    }

    /// Swap tokens for APT
    public entry fun swap_token_to_move(
        sender: &signer,
        pool: Object<Metadata>,
        token_amount: u64,
    ) acquires LiquidityPool, Token, AppConfig {
        assert!(token_amount > 0, ERR_ZERO_AMOUNT);
        let pool_addr = object::object_address(&pool);
        let lp = borrow_global_mut<LiquidityPool>(pool_addr);

        let move_out = get_output_amount(token_amount, lp.token_reserve, lp.move_reserve);
        assert!(move_out > 0, INSUFFICIENT_LIQUIDITY);

        let sender_addr = signer::address_of(sender);
        primary_fungible_store::transfer(sender, lp.token_address, pool_addr, token_amount);
        let pool_signer = account::create_signer_with_capability(&lp.signer_cap);
        coin::transfer<AptosCoin>(&pool_signer, sender_addr, move_out);

        lp.token_reserve = lp.token_reserve + token_amount;
        lp.move_reserve = lp.move_reserve - move_out;

        // Record transaction history
        record_history(
            pool_addr,
            move_out,
            token_amount,
            pool_addr, // Pool acts as buyer
            sender_addr
        );
    }

    /// Update token metadata (admin only)
    public entry fun update_token_metadata(
        sender: &signer,
        token: Object<Metadata>,
        new_icon_uri: String,
        new_project_url: String
    ) acquires AppConfig, Token {
        let app_config = borrow_global<AppConfig>(@pump_fun);
        let sender_addr = signer::address_of(sender);
        assert!(sender_addr == app_config.admin, ERR_NOT_ADMIN);

        let token_addr = object::object_address(&token);
        let token = borrow_global_mut<Token>(token_addr);
        token.icon_uri = new_icon_uri;
        token.project_url = new_project_url;

        // Update the Token in AppConfig's tokens vector
        let app_config = borrow_global_mut<AppConfig>(@pump_fun);
        let i = 0;
        let len = vector::length(&app_config.tokens);
        while (i < len) {
            let t = vector::borrow_mut(&mut app_config.tokens, i);
            if (t.id == token.id) {
                t.icon_uri = new_icon_uri;
                t.project_url = new_project_url;
                break
            };
            i = i + 1;
        };
    }

    /// Update creation fee (admin only)
    public entry fun update_fee(
        sender: &signer,
        new_fee: u64
    ) acquires AppConfig {
        let app_config = borrow_global_mut<AppConfig>(@pump_fun);
        let sender_addr = signer::address_of(sender);
        assert!(sender_addr == app_config.admin, ERR_NOT_ADMIN);
        app_config.fees = new_fee;
    }

    /// Calculate output amount for a swap
    fun get_output_amount(
        input_amount: u64,
        input_reserve: u64,
        output_reserve: u64
    ): u64 {
        let input_amount_with_fee = (input_amount as u128) * 997; // 0.3% fee
        let numerator = input_amount_with_fee * (output_reserve as u128);
        let denominator = (input_reserve as u128) * 1000 + input_amount_with_fee;
        ((numerator / denominator) as u64)
    }

    /// View function to get token output amount
    #[view]
    public fun get_token_output_amount(
        move_amount: u64,
        pool: Object<Metadata>
    ): u64 acquires LiquidityPool {
        let pool_addr = object::object_address(&pool);
        let lp = borrow_global<LiquidityPool>(pool_addr);
        get_output_amount(move_amount, lp.move_reserve, lp.token_reserve)
    }

    /// View function to get APT output amount
    #[view]
    public fun get_move_output_amount(
        token_amount: u64,
        pool: Object<Metadata>
    ): u64 acquires LiquidityPool {
        let pool_addr = object::object_address(&pool);
        let lp = borrow_global<LiquidityPool>(pool_addr);
        get_output_amount(token_amount, lp.token_reserve, lp.move_reserve)
    }

    /// View function to get pool reserves
    #[view]
    public fun get_pool_info(pool: Object<Metadata>): (u64, u64) acquires LiquidityPool {
        let pool_addr = object::object_address(&pool);
        let lp = borrow_global<LiquidityPool>(pool_addr);
        (lp.token_reserve, lp.move_reserve)
    }

    /// View function to get token transaction history
    #[view]
    public fun get_token_history(pool: Object<Metadata>): vector<History> acquires Token {
        let pool_addr = object::object_address(&pool);
        let token = borrow_global<Token>(pool_addr);
        token.history
    }

    /// View function to get all token addresses
    #[view]
    public fun get_all_tokens(): vector<address> acquires AppConfig {
        let app_config = borrow_global<AppConfig>(@pump_fun);
        app_config.token_addresses
    }

    /// View function to get token metadata
    #[view]
    public fun get_token_metadata(token_addr: address): Token acquires Token {
        let token = borrow_global<Token>(token_addr);
        *token
    }
}