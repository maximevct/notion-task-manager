const dotenv = require('dotenv')
const { Client } = require('@notionhq/client')

dotenv.config()
const notion = new Client({ auth: process.env.NOTION_KEY })

const DB_TASK_ID = process.env.NOTION_DATABASE_TASKS_ID

const addIdToTask = async (task, newId) => await updatePage(task.id, { "ID": { number: newId } })
const createBranchName = async (task, newId) => {
  const kind = task.properties["Kind"].select?.name
  const slug = task.properties["Slug"].rich_text[0]?.text.content.explode(' ').filter(a => a.length).join('-')
  if (!kind || !kind.length || !slug || !slug.length)
    return
  //TODO => Create Branch on Github. Use its name to update page
  await updatePage(task.id, { "Branch": { rich_text: [{ type: "text", text: { content: [newId, kind, slug].join('-') }}] } })
}

const TASKS_PROCESS = [
  addIdToTask,
  createBranchName
]

const getDB = async (dbId, options = {}) => await notion.databases.query({ database_id: dbId, ...options })

const getPendingTasks = async () => await getDB(DB_TASK_ID, {
  filter: { property: "ID", number: { is_empty: true } },
  sorts: [ { timestamp: "created_time", direction: "ascending" } ]
})

const getNeedPRTasks = async () => await getDB(DB_TASK_ID, {
  filter: { and: [
    { property: "Status", select: { equals: 'In Review' } },
    { property: "Branch", rich_text: { is_not_empty: true }}
  ]}
})

const getLastProcessedTask = async () => await getDB(DB_TASK_ID, {
  filter: { property: "ID", number: { is_not_empty: true } },
  sorts: [ { property: "ID", direction: "descending" } ],
  page_size: 1
})

const getPage = async (pageId) => await notion.pages.retrieve({ page_id: pageId })

const updatePage = async (pageId, properties) => await notion.pages.update({ page_id: pageId, properties })

const processNewTask = async () => {
  tasks = await getPendingTasks()
  lastProcessedTask = await getLastProcessedTask()
  lastId = lastProcessedTask.results[0]?.properties["ID"].number || 0
  tasks.results.map(async (task, i) => await TASKS_PROCESS.map(async fn => await fn(task, i + 1 + lastId)))
}

const createPRForTask = async(task) => {
  const prLink = `https://github.com/${task.properties.Branch.rich_text[0].text.content}`
  //TODO Create PR to Github
  await updatePage(task.id, { "Link PR": { rich_text: [{ type: "text", text: { content: prLink }}] } })
}

const processCreatedTasks = async () => {
  const { results: tasks } = await getNeedPRTasks()
  tasks.map(async (task) => await createPRForTask(task))
}

const main = async () => {
  // await processNewTask()
  await processCreatedTasks()
}

(async () => main())()
