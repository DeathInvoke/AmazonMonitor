import {getPage} from './browser.js'
import debug from './debug.js'
// @ts-ignore
import {CategoryNode} from '../global.js'
// @ts-ignore
import {CheerioAPI} from 'cheerio'
import fs from 'fs'

const BASE_PATH = 'https://www.commercedna.com/'
const NODE_LOOKUP = 'browseNodeLookup/'
const EXPLORE_NODE = 'explore.node'

const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())
export const CATEGORY_TREE: Map<string, any> = new Map<string, any>()


export async function getCategoryTree() {
	let treeIndex: number = 0
	const treeLevel = config.category_config.tree_level
	const macroCategoryNodes = await _scanMacroCategories()
	_populateTree(macroCategoryNodes, true)
	if(treeLevel === 0){
		return
	}
	const max_sub_cat = config.category_config.max_categories_per_sub
	while (treeIndex <= treeLevel) {
		for (const macro of macroCategoryNodes) {

			const nodeUrl = BASE_PATH + `amazon.${config.tld}/` + NODE_LOOKUP + `${macro.id}.html`
			const $ = await getPage(nodeUrl)

			let nodeInfos: CategoryNode[] = _extractNodeInfos($)
			if(nodeInfos.length > max_sub_cat){
				nodeInfos = nodeInfos.slice(0, max_sub_cat)
			}

			_populateTree(nodeInfos, false, macro.name)
		}

		treeIndex++
	}

}

/**
 *
 * @param nodes
 * @param isMacro
 * @param parent
 */
function _populateTree(nodes: CategoryNode[], isMacro: boolean, parent?: string) {
	let info = new Info()

	if (isMacro) {
		nodes.forEach(node => {
			info.url = _buildUrlFromNode(node)
			CATEGORY_TREE.set(node.name, info)
		})
	} else {
		let listOfMap = nodes.map(node => {
			let map = new Map<string, any>()
			info.url = _buildUrlFromNode(node)
			map.set(node.name, info)

			return map
		})
		if (parent) {
			CATEGORY_TREE.set(parent, listOfMap)
		}

	}
}

async function _scanMacroCategories() {
	debug.log('_scanMacroCategories(): Start extracting macro categories...', 'debug')
	const startingUrl = BASE_PATH + `amazon.${config.tld}/` + EXPLORE_NODE

	const $ = await getPage(startingUrl)

	return _extractNodeInfos($)
}

function _extractNodeInfos($: CheerioAPI) {
	const table = $('table')
	const list: CategoryNode[] = []

	table.find('tbody').find('tr').each((_i, tr) => {
		const _values = $(tr).find('td').map((_i, el) => {
			return $(el).text().trim()
		}).toArray()
		const _node: CategoryNode = {
			name: _values[0],
			id: _values[1]
		}
		list.push(_node)

	})

	return list
}

function _buildUrlFromNode(node: CategoryNode) {
	return `https://www.amazon.it/b/?node=${node.id}`
}

// ----------------------------------------------------------
// ----------------------------------------------------------

class Info {
	url: string
	sub: any
}