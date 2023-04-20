const dotenv = require('dotenv')
const { Client } = require('@notionhq/client')

dotenv.config()
const notion = new Client({ auth: process.env.NOTION_KEY })

const DB_TASK_ID = process.env.NOTION_DATABASE_TASKS_ID

const getDB = async (dbId, options = {}) => await notion.databases.query({ database_id: dbId, ...options })

const getPage = async (pageId) => await notion.pages.retrieve({ page_id: pageId })

const updatePage = async (pageId, properties) => await notion.pages.update({ page_id: pageId, properties })

const main = async () => {
  tasks = await getDB(DB_TASK_ID)
  tasks.results.map(async (t) => console.log(await getPage(t.id)))
  await updatePage('b3e5b92e-7ee2-45c5-a30f-b2dedb94acac', {
    kind: { select: { name: 'feat' } }
  })
}

(async () => main())()
