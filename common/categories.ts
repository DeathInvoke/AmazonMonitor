import { getPage } from './browser.js'
import debug from './debug.js'
// @ts-ignore
import { CategoryNode } from '../global.js'
// @ts-ignore
import {Cheerio, CheerioAPI} from 'cheerio'

const SUBNODE_URL = 'https://www.commercedna.com/amazon.it/browseNodeLookup/2892859031.html'
const BASE_URL = 'https://www.commercedna.com/amazon.it/explore.node'


const recursiveCount = 3

export async function main(){
  debug.log('Extract categories...', 'debug')
  const $ = await getPage(BASE_URL)
  const list = extractNodeInfo($)

  list.forEach(value => {

    let link = `https://www.amazon.it/b/?node=${value.id}`
    debug.log(`Category: ${value.name}\nLink: ${link}`, 'debug')
  })

  debug.log('EXIT...', 'debug')
}

function extractNodeInfo($: CheerioAPI) {
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