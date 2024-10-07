import express from 'express'
import { getNotes, getNote, addNotes, updateNote, deleteNote, registUser, login, guestLogin, getVotes, insertVote, insertVoteDetail, getVote, updateVote, deleteVote, updateVoting, tokenCheck, updateRunoffVoting, updateVoteClose } from "./database.js"
import { swaggerUi, specs } from "./swagger.js";
import jwt from "jsonwebtoken";
import "./swaggerVotePaths.js";
import cors from 'cors';

const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
const port = 9000

app.use(cors({
  origin: '*', // 모든 출처 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'] // 필요한 헤더 추가
}));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

app.get('/', (req, res) => {
  console.log('exit');
  res.send('Hello World!')
})

// 회원가입
app.post("/regist", async (req, res) => {
  const { id, password, username, gubun } = req.body;

  // 유효성 검사
  if (!id || !password || !username || !gubun) {
    return res.status(400).send({ success: false, message: "필수 항목이 누락되었습니다." });  // 400: Bad Request
  }

  // registUser 호출
  const result = await registUser(id, password, username, gubun);

  // 상태 코드에 따른 응답 처리
  res.status(result.statusCode).send({
    statusCode: result.statusCode,
    success: result.success,
    message: result.message,
    error: result.error || null  // 오류가 있으면 전송, 없으면 null
  });
});

// 로그인
app.post("/login", async (req, res) => {
  console.log('로그인');
  const { id, password } = req.body;
  const result = await login(id, password);
  if (!result) return res.status(401).json({ statusCode: 401, result, message: '로그인 실패' });
  console.log(result);
  const token = jwt.sign({ id: id, password: password }, "secret", {
    expiresIn: 3600 * 24 * 30, // 토큰 유효 시간 1시간 3600초 * 24 = 1일 * 30일
  });
  return res.send({ statusCode: 201, token, result, message: '로그인 성공' });
})

async function authorizationJWT(req, res, next) {
  try {
    const auth = req.headers.authorization;

    // Authorization 헤더가 없을 경우
    if (!auth) return res.status(401).json({ statusCode: 401, message: '인증 헤더가 없습니다.' });

    // Bearer 스키마 체크
    const authParts = auth.split(' ');
    if (authParts.length !== 2 || authParts[0] !== 'Bearer') {
      return res.status(401).json({ statusCode: 401, message: '잘못된 인증 형식입니다.' });
    }

    const token = authParts[1];

    // JWT 토큰 검증 (만료 시간 자동 체크)
    const decoded = jwt.verify(token, 'secret');

    // 토큰에서 id만 사용 (예: 추가적인 인증 체크가 필요 없다면)
    console.log(decoded.id);

    // 인증 성공 시 다음 미들웨어로 이동
    next();

  } catch (err) {
    console.error(err);

    // 만약 토큰이 만료된 경우
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ statusCode: 401, message: '토큰이 만료되었습니다.' });
    }

    // JWT 토큰 검증 실패 또는 기타 예외 처리
    return res.status(401).json({ statusCode: 401, message: '토큰 검증 중 오류가 발생했습니다.' });
  }
}

app.post("/token", (req, res) => {
  const { id, pw } = req.body;
  const user = users[0];
  if (id !== user.user) res.status(401).json({ statusCode: 401, message: '유효하지 않은 토큰입니다.' });
  if (pw !== user.password) res.status(401).json({ statusCode: 401, message: '유효하지 않은 토큰입니다.' });
  const token = jwt.sign({ id: id, name: user.name }, "secret", {
    expiresIn: 60, // 토큰 유효 시간 1시간 3600초
  });
  res.send({ token });
});

// 투표 날짜별 조회
app.post('/votes', authorizationJWT, async (req, res) => {
  const { gubun, userSeq, startDate, endDate, voteStateOption } = req.body;
  try {
    const result = await getVotes(gubun, userSeq, startDate, endDate, voteStateOption);
    res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: '투표 날짜별 조회에 실패하셨습니다.' });
  }
});

// 특정 투표 조회
app.post('/vote', authorizationJWT, async (req, res) => {
  const { voteId, userSeq } = req.body;
  try {
    if (!voteId || userSeq === undefined) {
      return res.status(400).json({ statusCode: 400, message: '투표 등록 실패' });
    }
    const result = await getVote(voteId, userSeq);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(401).json({ statusCode: 401, message: '투표 조회 실패' });
  }
});

// 투표항목 등록
app.put('/vote', authorizationJWT, async (req, res) => {
  console.log(req.body);

  const { votename, gubun, userSeq, startDate, endDate, username, voteOption, voteItems } = req.body;
  console.log(JSON.stringify(req.body));
  if (!votename || !gubun || !startDate || userSeq === undefined || !endDate || !voteOption || !voteItems || !username) {
    return res.status(400).json({ statusCode: 400, message: '투표 등록 실패' });
  }
  try {
    const result = await insertVote(votename, gubun, userSeq, startDate, endDate, username, voteOption, voteItems);
    res.json(result);
    // return res.status(201).json({ statusCode: 201, message: '투표가 정상 등록되었습니다.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: '투표 등록에 실패하셨습니다..' });
  }
});

// 투표항목 수정
app.post('/updateVote', authorizationJWT, async (req, res) => {
  const { voteId, voteItems, votename, startDate, endDate, voteOption } = req.body;
  console.log(JSON.stringify(req.body));
  if (!voteId || !votename || !startDate || !endDate || !voteOption || !voteItems) {
    return res.status(400).json({ statusCode: 400, message: '투표항목 수정에 실패하셨습니다.' });
  }
  try {
    const result = await updateVote(voteId, voteItems, votename, startDate, endDate, voteOption);
    return res.status(201).json({ statusCode: 201, message: '투표항목 수정에 성공하셨습니다.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 201, message: '투표항목 수정에 실패하셨습니다.' });
  }
});

// 투표하기
app.post('/voting', authorizationJWT, async (req, res) => {
  console.log('23');
  const { voteId, userSeq, gubun, voteItems } = req.body;
  try {
    const result = await updateVoting(voteId, userSeq, gubun, voteItems);
    console.log(result);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: '투표하기에 실패하셨습니다.' });
  }
});

// 투표항목 삭제
app.post('/deleteVote', authorizationJWT, async (req, res) => {
  console.log(req.body);
  const { voteId } = req.body;
  if (!voteId) {
    return res.status(400).json({ statusCode: 400, message: '투표삭제에 실패하셨습니다.' });
  }
  try {
    const result = await deleteVote(voteId);
    res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: '투표삭제에 실패하셨습니다.' });
  }
});


// 결선 투표로 업데이트
app.put('/runoffVoting', authorizationJWT, async (req, res) => {
  console.log(req.body);

  const { voteId, votename, voteItems } = req.body;
  console.log(JSON.stringify(req.body));
  if (!voteId || !voteItems || !votename) {
    return res.status(400).json({ statusCode: 400, message: '결선 두표 등록 실패' });
  }
  try {
    await updateRunoffVoting(voteId, votename, voteItems);
    return res.status(201).json({ statusCode: 201, message: '투표가 정상 등록되었습니다.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: '투표 등록에 실패하셨습니다..' });
  }
});

// 게스트 로그인
app.post("/guestLogin", async (req, res) => {
  const { id, password } = req.body;
  const result = await guestLogin(id, password);
  // if (!result) return res.status(401).json({ statusCode: 401, result, message: '게스트 로그인 실패' });
  console.log(result);
  const token = jwt.sign({ id: id }, "secret", {
    expiresIn: 3600 * 24 * 30, // 토큰 유효 시간 1시간 3600초 * 24시 하루
  });
  console.log(token);
  return res.send({ statusCode: 201, token, result, message: '게스트 로그인 성공' });
})

// 투표 종료
app.put('/voteClose', authorizationJWT, async (req, res) => {
  console.log(req.body);

  const { voteId } = req.body;
  console.log(JSON.stringify(req.body));
  if (!voteId) {
    return res.status(400).json({ statusCode: 400, message: '투표 종료 실패' });
  }
  try {
    const result = await updateVoteClose(voteId);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: '투표 종료에 실패하셨습니다..' });
  }
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

// 모든 IP 주소에서 접근할 수 있도록 설정
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// 투표상세 샘플
// app.put('/votedetail', async (req, res) => {
//   const { voteId, gubun, voteItemSeq, userSeq } = req.body;
//   console.log(JSON.stringify(req.body));
//   if (!voteId || !gubun || !voteItemSeq || (userSeq === undefined)) return res.sendStatus(401);
//   const result = await insertVoteDetail(voteId, gubun, voteItemSeq, userSeq);
//   res.sendStatus(201)
// })