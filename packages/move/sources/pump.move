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

    // Constants
    const DECIMAL: u8 = 8; // Token decimals (10^8 smallest units per token)
    const MAX_SUPPLY: u64 = 1_000_000_000; // 1 billion whole tokens
    const FEE: u64 = 4_000_000; // 0.04 APT (4,000,000 octas)
    const MOVE_DECIMALS: u8 = 8; // APT decimals
    const MOVE_MULTIPLIER: u64 = 100_000_000; // 10^8 for APT decimals
    const OCTAS_PER_MOVE: u64 = 100_000_000; // 10^8 octas per APT

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
    const ERR_TOKEN_NOT_FOUND: u64 = 10;
    const ERR_POOL_NOT_FOUND: u64 = 11;

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
        pool_addr: address
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

    /// Check if a liquidity pool exists for a token
    fun pool_exists(pool_addr: address): bool {
        exists<LiquidityPool>(pool_addr)
    }

    /// Record transaction history with USD values
    fun record_history(
        token_addr: address,
        move_amount: u64,
        token_amount: u64,
        buyer: address,
        seller: address
    ) acquires Token, AppConfig {
        let token = borrow_global_mut<Token>(token_addr);
        let token_id = token.id;

        // TODO: Replace with real price oracle (e.g., Pyth) for accurate USD conversion
        let price_in_move_coin = 1; // Placeholder: 1 APT = 1 USD
        assert!(price_in_move_coin > 0, ERR_INVALID_PRICE);

        let amount_in_usd = if (move_amount > 0) {
            (move_amount * price_in_move_coin)
        } else {
            0
        };
        let amount_out_usd = if (token_amount > 0) {
            (token_amount * price_in_move_coin)
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

        let app_config = borrow_global_mut<AppConfig>(@pump_fun);
        let token = vector::borrow_mut(&mut app_config.tokens, token_id);
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
    ) acquires AppConfig, FAController, Token {
        assert!(initial_move_amount > 0, ERR_ZERO_AMOUNT);

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

        vector::push_back(&mut app_config.token_addresses, token_addr);

        // Create fungible asset with max supply of 1 billion tokens (10^17 smallest units)
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            option::some(((MAX_SUPPLY as u128) * (MOVE_MULTIPLIER as u128))),
            name,
            symbol,
            DECIMAL,
            icon_uri,
            project_url
        );

        let fa_obj = object::object_from_constructor_ref<Metadata>(&constructor_ref);

        // Store token metadata
        let token_id = vector::length(&app_config.tokens);
        let token = Token {
            id: token_id,
            name,
            symbol,
            icon_uri,
            project_url,
            history: vector::empty<History>(),
            timestamp: timestamp::now_microseconds(),
            token_addr,
            pool_addr: @0x0
        };
        move_to(&object_signer, token);
        vector::push_back(&mut app_config.tokens, token);

        // Store fungible asset controller
        move_to(&object_signer, FAController {
            dev_address: sender_addr,
            mint_ref: fungible_asset::generate_mint_ref(&constructor_ref),
            burn_ref: fungible_asset::generate_burn_ref(&constructor_ref),
            transfer_ref: fungible_asset::generate_transfer_ref(&constructor_ref),
        });

        // Mint 50 million tokens to creator (50_000_000 * 10^8 = 5_000_000_000_000_000 smallest units)
        let creator_amount = (MAX_SUPPLY * MOVE_MULTIPLIER) / 20;
        mint_tokens(sender, fa_obj, creator_amount);

        // Mint 950 million tokens to liquidity pool (950_000_000 * 10^8 = 95_000_000_000_000_000 smallest units)
        let pool_token_amount = ((((MAX_SUPPLY * MOVE_MULTIPLIER) - creator_amount)) as u128);
        assert!(((creator_amount as u128) + pool_token_amount) <= ((MAX_SUPPLY * MOVE_MULTIPLIER) as u128), ERR_MAX_SUPPLY_EXCEEDED);

        // Initialize liquidity pool
        initialize_liquidity_pool(fa_obj, initial_move_amount, (pool_token_amount as u64), object_signer, sender);
    }

    /// Buy tokens using APT
    public entry fun buy_token(
        sender: &signer,
        token_addr: address,
        move_amount: u64
    ) acquires LiquidityPool, Token, AppConfig {
        assert!(move_amount > 0, ERR_ZERO_AMOUNT);
        let token = borrow_global<Token>(token_addr); // Verify token exists
        let pool_addr = account::create_resource_address(&token.token_addr, b"Liquidity_Pool");
        assert!(pool_exists(pool_addr), ERR_POOL_NOT_FOUND);
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

        record_history(
            token_addr,
            move_amount,
            token_out,
            sender_addr,
            pool_addr
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
        token: Object<Metadata>,
        move_amount: u64,
        token_amount: u64,
        token_signer: signer,
        sender: &signer
    ) acquires FAController, Token {
        let (pool_signer, signer_cap) = account::create_resource_account(&token_signer, b"Liquidity_Pool");
        let pool_addr = signer::address_of(&pool_signer);

        let token_address = signer::address_of(&token_signer);

        let token_data = borrow_global_mut<Token>(token_address);
        token_data.pool_addr = pool_addr;
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
            owner: signer::address_of(&token_signer),
            signer_cap,
        });
    }

    /// Swap APT for tokens
    public entry fun swap_move_to_token(
        sender: &signer,
        token_addr: address,
        move_amount: u64
    ) acquires LiquidityPool, Token, AppConfig {
        assert!(move_amount > 0, ERR_ZERO_AMOUNT);
        let token = borrow_global<Token>(token_addr); // Verify token exists
        let pool_addr = token.pool_addr;
        assert!(pool_exists(pool_addr), ERR_POOL_NOT_FOUND);
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

        record_history(
            token_addr,
            move_amount,
            token_out,
            sender_addr,
            pool_addr
        );
    }

    /// Swap tokens for APT
    public entry fun swap_token_to_move(
        sender: &signer,
        token_addr: address,
        token_amount: u64
    ) acquires LiquidityPool, Token, AppConfig {
        assert!(token_amount > 0, ERR_ZERO_AMOUNT);
        let token = borrow_global<Token>(token_addr); // Verify token exists
        let pool_addr = token.pool_addr;
        assert!(pool_exists(pool_addr), ERR_POOL_NOT_FOUND);
        let lp = borrow_global_mut<LiquidityPool>(pool_addr);

        let move_out = get_output_amount(token_amount, lp.token_reserve, lp.move_reserve);
        assert!(move_out > 0, INSUFFICIENT_LIQUIDITY);

        let sender_addr = signer::address_of(sender);
        primary_fungible_store::transfer(sender, lp.token_address, pool_addr, token_amount);
        let pool_signer = account::create_signer_with_capability(&lp.signer_cap);
        coin::transfer<AptosCoin>(&pool_signer, sender_addr, move_out);

        lp.token_reserve = lp.token_reserve + token_amount;
        lp.move_reserve = lp.move_reserve - move_out;

        record_history(
            token_addr,
            move_out,
            token_amount,
            pool_addr,
            sender_addr
        );
    }

    /// Update token metadata (admin only)
    public entry fun update_token_metadata(
        sender: &signer,
        token_addr: address,
        new_icon_uri: String,
        new_project_url: String
    ) acquires AppConfig, Token {
        let app_config = borrow_global<AppConfig>(@pump_fun);
        let sender_addr = signer::address_of(sender);
        assert!(sender_addr == app_config.admin, ERR_NOT_ADMIN);

        let token = borrow_global_mut<Token>(token_addr);
        token.icon_uri = new_icon_uri;
        token.project_url = new_project_url;

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

    /// Calculate output amount for a swap (0.3% fee)
    fun get_output_amount(
        input_amount: u64,
        input_reserve: u64,
        output_reserve: u64
    ): u64 {
        // Note: Casting to u64 may truncate fractional amounts
        let input_amount_with_fee = (input_amount as u128) * 997; // 0.3% fee
        let numerator = input_amount_with_fee * (output_reserve as u128);
        let denominator = ((input_reserve as u128) * 1000 ) + input_amount_with_fee;
        ((numerator / denominator) as u64)
    }

    /// View function to get token output amount
    #[view]
    public fun get_token_output_amount(
        move_amount: u64,
        token_addr: address
    ): u64 acquires LiquidityPool, Token {
        let token = borrow_global<Token>(token_addr); // Verify token exists
        let pool_addr = token.pool_addr;
        assert!(pool_exists(pool_addr), ERR_POOL_NOT_FOUND);
        let lp = borrow_global<LiquidityPool>(pool_addr);
        get_output_amount(move_amount, lp.move_reserve, lp.token_reserve)
    }

    /// View function to get APT output amount
    #[view]
    public fun get_move_output_amount(
        token_amount: u64,
        token_addr: address
    ): u64 acquires LiquidityPool, Token {
        let token = borrow_global<Token>(token_addr); // Verify token exists
        let pool_addr = token.pool_addr;
        assert!(pool_exists(pool_addr), ERR_POOL_NOT_FOUND);
        let lp = borrow_global<LiquidityPool>(pool_addr);
        get_output_amount(token_amount, lp.token_reserve, lp.move_reserve)
    }

    /// View function to get pool reserves
    #[view]
    public fun get_pool_info(token_addr: address): (u64, u64) acquires LiquidityPool, Token {
        let token = borrow_global<Token>(token_addr); // Verify token exists
        let pool_addr = token.pool_addr;
        assert!(pool_exists(pool_addr), ERR_POOL_NOT_FOUND);
        let lp = borrow_global<LiquidityPool>(pool_addr);
        (lp.token_reserve, lp.move_reserve)
    }

    /// View function to get token transaction history
    #[view]
    public fun get_token_history(token_addr: address): vector<History> acquires Token {
        let token = borrow_global<Token>(token_addr);
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
    public fun getMetadata(token_addr: address): Object<Metadata> acquires Token {
        let token = borrow_global<Token>(token_addr); // Verify token exists
        object::address_to_object<Metadata>(token_addr)
    }
}