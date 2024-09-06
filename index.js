import express from 'express'
import { getNotes, getNote, addNotes, updateNote, deleteNote, registUser, login, getVotes, insertVote, insertVoteDetail, getVote, updateVote, deleteVote, updateVoting } from "./database.js"
import { swaggerUi, specs } from "./swagger.js";
import jwt from "jsonwebtoken";
import "./swaggerVotePaths.js";

const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
const port = 3000

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

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
  try {
    const result = await getVotes(gubun, userSeq, startDate, endDate);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 특정 투표 조회
app.post('/vote', async (req, res) => {
  const { gubun, voteId, userSeq } = req.body;
  try {
    const result = await getVote(gubun, voteId, userSeq);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 투표항목 등록
app.put('/vote', async (req, res) => {
  const { votename, gubun, userSeq, startDate, endDate, voteOption, voteItems } = req.body;
  console.log(JSON.stringify(req.body));
  if (!votename || !gubun || !startDate || userSeq === undefined || !endDate || !voteOption || !voteItems) {
    return res.sendStatus(400); // 401 대신 400으로 변경: 잘못된 요청
  }
  try {
    await insertVote(votename, gubun, userSeq, startDate, endDate, voteOption, voteItems);
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 투표항목 수정
app.post('/updateVote', async (req, res) => {
  const { voteId, voteItems, votename, startDate, endDate, voteOption } = req.body;
  console.log(JSON.stringify(req.body));
  if (!voteId || !votename || !startDate || !endDate || !voteOption || !voteItems) {
    return res.sendStatus(400); // 401 대신 400으로 변경: 잘못된 요청
  }
  try {
    const result = await updateVote(voteId, voteItems, votename, startDate, endDate, voteOption);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 투표하기
app.post('/voting', async (req, res) => {
  console.log('23');
  const { voteId, userSeq, gubun, voteItems } = req.body;
  try {
    const result = await updateVoting(voteId, userSeq, gubun, voteItems);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 투표항목 삭제
app.post('/deleteVote', async (req, res) => {
  console.log(req.body);
  const { voteId } = req.body;
  if (!voteId) {
    return res.sendStatus(400); // 401 대신 400으로 변경: 잘못된 요청
  }
  try {
    const result = await deleteVote(voteId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// 투표상세 샘플
// app.put('/votedetail', async (req, res) => {
//   const { voteId, gubun, voteItemSeq, userSeq } = req.body;
//   console.log(JSON.stringify(req.body));
//   if (!voteId || !gubun || !voteItemSeq || (userSeq === undefined)) return res.sendStatus(401);
//   const result = await insertVoteDetail(voteId, gubun, voteItemSeq, userSeq);
//   res.sendStatus(201)
// })