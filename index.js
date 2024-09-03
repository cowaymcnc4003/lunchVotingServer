import express from 'express'
import { getNotes, getNote, addNotes, updateNote, deleteNote, registUser } from "./database.js"
import { swaggerUi, specs } from "./swagger.js";

const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
const port = 3000

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

/**
 * @swagger
 * paths:
 *  /notes:
 *    get:
 *      summary: "notes 데이터 전체조회"
 *      description: "Get방식으로 요청"
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: 전체 notes 정보
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    notes:
 *                      type: object
 *                      example:
 *                          [
 *                            { "id": 1, "name": "유저1" },
 *                            { "id": 2, "name": "유저2" },
 *                            { "id": 3, "name": "유저3" },
 *                          ]
 */


app.get('/notes', async (req, res) => {
  const result = await getNotes()
  res.send(result)
})

app.get('/note/:id', async (req, res) => {
  const id = req.params.id;
  const result = await getNote(id)
  res.send(result)
})

app.post("/notes", async (req, res) => {
  const { title, contents } = req.body;
  const result = await addNotes(title, contents)
  res.sendStatus(201)
})

app.post("/regist", async (req, res) => {
  const { id, password, username } = req.body;
  const result = await registUser(id, password, username)
  res.sendStatus(201)
})

app.put("/note/:id", async (req, res) => {
  const id = req.params.id;
  const { title, contents } = req.body;
  const result = await updateNote(id, title, contents)
  res.sendStatus(204)
})

app.delete("/note/:id", async (req, res) => {
  const id = req.params.id;
  const result = await deleteNote(id)
  res.sendStatus(204)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})