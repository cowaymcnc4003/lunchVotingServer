import express from 'express'
import { getNotes, getNote, addNotes, updateNote, deleteNote, registUser, login, getVotes, insertVote, insertVoteDetail, getVote, insertVoting, updateVote, deleteVote } from "./database.js"
import { swaggerUi, specs } from "./swagger.js";
import jwt from "jsonwebtoken";

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
 *  /regist:
 *    post:
 *      summary: "회원가입"
 *      description: "새로운 사용자를 등록합니다."
 *      tags: [User]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  description: "사용자 ID"
 *                  example: "user123"
 *                password:
 *                  type: string
 *                  description: "사용자 비밀번호"
 *                  example: "password123"
 *                username:
 *                  type: string
 *                  description: "사용자 이름"
 *                  example: "John Doe"
 *      responses:
 *        201:
 *          description: "아이디 생성 완료"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: true
 *                  message:
 *                    type: string
 *                    example: "아이디 생성 완료"
 *        409:
 *          description: "중복된 아이디입니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: "중복된 아이디입니다."
 *        400:
 *          description: "필수 항목이 누락되었습니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: "필수 항목이 누락되었습니다."
 *        500:
 *          description: "서버 오류 발생"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: "서버 오류 발생"
 *                  error:
 *                    type: string
 *                    example: "Internal server error"
 */

// 회원가입
app.post("/regist", async (req, res) => {
  const { id, password, username } = req.body;

  // 유효성 검사
  if (!id || !password || !username) {
    return res.status(400).send({ success: false, message: "필수 항목이 누락되었습니다." });  // 400: Bad Request
  }

  // registUser 호출
  const result = await registUser(id, password, username);

  // 상태 코드에 따른 응답 처리
  res.status(result.statusCode).send({
    success: result.success,
    message: result.message,
    error: result.error || null  // 오류가 있으면 전송, 없으면 null
  });
});



// 로그인
app.post("/login", async (req, res) => {
  const { id, password } = req.body;
  const result = await login(id, password);
  if (!result) return res.sendStatus(401);
  console.log(result);
  const token = jwt.sign({ id: id, password: password }, "secret", {
    expiresIn: 3600, // 토큰 유효 시간 1시간 3600초
  });
  return res.send({ token });
})

// 투표항목 삭제
app.post('/deleteVote', async (req, res) => {
  console.log(req.body);
  const { voteId } = req.body;
  if (!voteId) return res.sendStatus(401);
  const result = await deleteVote(voteId);
  res.send(result)
})

function authorizationJWT(req, res, next) {
  const auth = req.headers.authorization;
  // Bearer ####
  if (!auth) res.sendStatus(401);
  const auth2 = auth.split(" ");
  if (!auth2) res.sendStatus(401);
  if (auth2.length !== 2) res.sendStatus(401);
  const value = auth2[1];
  const decoded = jwt.verify(value, "secret");
  const user = users[0];
  if (decoded.id !== user.user) res.sendStatus(401);
  if (decoded.name !== user.name) res.sendStatus(401);
  next();
}

app.post("/token", (req, res) => {
  const { id, pw } = req.body;
  const user = users[0];
  if (id !== user.user) res.sendStatus(401);
  if (pw !== user.password) res.sendStatus(401);
  const token = jwt.sign({ id: id, name: user.name }, "secret", {
    expiresIn: 3600, // 토큰 유효 시간 1시간 3600초
  });
  res.send({ token });
});

// 투표 날짜별 조회
app.post('/votes', async (req, res) => {
  const { gubun, userSeq, startDate, endDate } = req.body;
  const result = await getVotes(gubun, userSeq, startDate, endDate)
  res.send(result)
})

// 투표 조회
app.post('/vote', async (req, res) => {
  const { gubun, voteId, userSeq } = req.body;
  const result = await getVote(gubun, voteId, userSeq);
  console.log(result);
  res.send(result)
})

// 투표항목 등록
app.put('/vote', async (req, res) => {
  const { votename, gubun, userSeq, startDate, endDate, voteOption, voteItems } = req.body;
  console.log(JSON.stringify(req.body));
  if (!votename || !gubun || !startDate || (userSeq === undefined) || !endDate || !voteOption || !voteItems) return res.sendStatus(401);
  const result = await insertVote(votename, gubun, userSeq, startDate, endDate, voteOption, voteItems);
  res.sendStatus(201)
})

// 투표항목 수정
app.post('/updateVote', async (req, res) => {
  const { voteId, voteItems, votename, startDate, endDate, voteOption } = req.body;
  console.log(JSON.stringify(req.body));
  if (!voteId || !votename || !startDate || !voteOption || !endDate || !voteOption || !voteItems) return res.sendStatus(401);
  const result = await updateVote(voteId, voteItems, votename, startDate, endDate, voteOption);
  res.send(result)
})

// 투표상세 조회
app.put('/votedetail', async (req, res) => {
  const { voteId, gubun, voteItemSeq, userSeq } = req.body;
  console.log(JSON.stringify(req.body));
  if (!voteId || !gubun || !voteItemSeq || (userSeq === undefined)) return res.sendStatus(401);
  const result = await insertVoteDetail(voteId, gubun, voteItemSeq, userSeq);
  res.sendStatus(201)
})

// 투표하기
app.post('/voting', async (req, res) => {
  const { voteId, userSeq, gubun, voteItems } = req.body;
  const result = await insertVoting(voteId, userSeq, gubun, voteItems);
  console.log(result);
  res.send(result)
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})