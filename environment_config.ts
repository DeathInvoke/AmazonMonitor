import dotenv from 'dotenv'
import path from 'path'
import {fileURLToPath} from 'url'
import debug from './common/debug.js'

export class EnvironmentConfig {


	get prefix(): any {
		return this._prefix
	}

	get token(): any {
		return this._token
	}

	get token_test(): any {
		return this._token_test
	}

	get minutes_per_check(): any {
		return this._minutes_per_check
	}

	get seconds_between_check(): any {
		return this._seconds_between_check
	}

	get url_params(): any {
		return this._url_params
	}

	get guild_item_limit(): any {
		return this._guild_item_limit
	}

	get cache_limit(): any {
		return this._cache_limit
	}

	get required_perms(): any {
		return this._required_perms
	}

	get tld(): any {
		return this._tld
	}

	get dev(): any {
		return this._dev
	}

	get auto_cart_link(): any {
		return this._auto_cart_link
	}

	get debug_enabled(): any {
		return this._debug_enabled
	}

	get custom_chromium_exec(): any {
		return this._custom_chromium_exec
	}

	get notification_channels_price_drops(): any {
		return this._notification_channels_price_drops
	}

	get notification_channels_restocks(): any {
		return this._notification_channels_restocks
	}

	get category_config_scan(): any {
		return this._category_config_scan
	}

	get category_config_full_scan(): any {
		return this._category_config_full_scan
	}

	get category_config_max_categories_per_sub(): any {
		return this._category_config_max_categories_per_sub
	}

	get category_config_max_tree_level(): any {
		return this._category_config_max_tree_level
	}

	get server_port(): any {
		return this._server_port
	}

	constructor() {
		dotenv.config()

		this._prefix = process.env.PREFIX
		this._token = process.env.TOKEN
		this._token_test = process.env.TOKEN_TEST
		this._minutes_per_check = parseInt(process.env.MINUTES_PER_CHECK)
		this._seconds_between_check = parseInt(process.env.SECONDS_BETWEEN_CHECK)
		this._url_params = process.env.URL_PARAMS
		this._guild_item_limit = parseInt(process.env.GUILD_ITEM_LIMIT)
		this._cache_limit = parseInt(process.env.CACHE_LIMIT)
		this._required_perms = process.env.REQUIRED_PERMS
		this._tld = process.env.TLD
		this._dev = Boolean(process.env.DEV)
		this._auto_cart_link = Boolean(process.env.AUTO_CART_LINK)
		this._debug_enabled = Boolean(process.env.DEBUG_ENABLED)
		this._custom_chromium_exec = process.env.CUSTOM_CHROMIUM_EXEC
		this._notification_channels_price_drops = process.env.NOTIFICATION_CHANNELS_PRICE_DROPS
		this._notification_channels_restocks = process.env.NOTIFICATION_CHANNELS_RESTOCKS
		this._category_config_scan = Boolean(process.env.CATEGORY_CONFIG_SCAN)
		this._category_config_full_scan = Boolean(process.env.CATEGORY_CONFIG_FULL_SCAN)
		this._category_config_max_categories_per_sub = parseInt(process.env.CATEGORY_CONFIG_MAX_CATEGORIES_PER_SUB)
		this._category_config_max_tree_level = parseInt(process.env.CATEGORY_CONFIG_MAX_TREE_LEVEL)
		this._server_port = parseInt(process.env.SERVER_PORT)

		console.log(this.token_test)
	}

	private _prefix: string
	private _token: string
	private _token_test: string
	private _minutes_per_check: number
	private _seconds_between_check: number
	private _url_params: string
	private _guild_item_limit: number
	private _cache_limit: number
	private _required_perms: any
	private _tld: string
	private _dev: boolean
	private _auto_cart_link: boolean
	private _debug_enabled: boolean
	private _custom_chromium_exec: any
	private _notification_channels_price_drops: string
	private _notification_channels_restocks: string
	private _category_config_scan: boolean
	private _category_config_full_scan: boolean
	private _category_config_max_categories_per_sub: number
	private _category_config_max_tree_level: number
	private _server_port: number
}