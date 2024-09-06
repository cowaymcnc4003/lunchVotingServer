
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
const uri = "mongodb+srv://mongo:adminadmin@cluster0.wpkzo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
await client.connect();
const db = client.db("db_test");
const coll = db.collection("notes");
const collUser = db.collection("userInfo");
const collVote = db.collection("vote");
const collVoteDetail = db.collection("voteDetail");


export async function addNotes(title, contents) {
  const res = await coll.insertOne({
    title: title,
    contents: contents,
    created: new Date(),
  });
  console.log(res);
  return res;
}

export async function getNotes() {
  const cursor = coll.find({}, {
    projection: {
      _id: 0,
      id: { $toString: "$_id" },
      title: 1,
      contents: 1,
      created: 1
    }
  });
  const results = await cursor.toArray();
  console.log(results)
  return results
}
export async function getNote(id) {
  console.log(id);
  const res = await coll.findOne({ _id: new ObjectId(id) }, {
    projection: {
      _id: 0,
      id: { $toString: "$_id" },
      title: 1,
      contents: 1,
      created: 1
    }
  });
  console.log(res)
  return res;
}
export async function updateNote(id, title, contents) {
  const res = await coll.updateOne(
    { _id: new ObjectId(id) },
    { $set: { 'title': title, 'contents': contents } })
  console.log(res);
  return res
}
export async function deleteNote(id) {
  const res = await coll.deleteOne({ _id: new ObjectId(id) });
  console.log(res)
  return res
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    console.log("Connected successfully to server");
    const db = client.db("db_test");
    db.createCollection("userInfo");
    const collection = db.collection("userInfo");
    // await collection.insertOne({ x: 1, y: "string" });
    await collection.insertOne({
      userNumber: 0,
      id: "mhlee",
      password: "qwer1234",
      username: "이명한",
      created: new Date(),
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

async function getNextSequence(name) {
  const db = client.db("db_test");
  const collection = db.collection("counters");
  const sequenceDocument = await collection.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence_value: 1 } },
    { returnNewDocument: true } // 업데이트 후의 값을 반환
  );
  console.log(sequenceDocument.sequence_value);

  return sequenceDocument.sequence_value;
}

export async function registUser(id, password, username) {
  try {
    // ID 중복 체크
    const existingId = await collUser.findOne({ id: id });
    if (existingId) {
      return { statusCode: 409, success: false, message: "중복된 아이디입니다." };  // 409: Conflict
    }

    // 사용자 등록
    const res = await collUser.insertOne({
      userNumber: await getNextSequence("userId"),  // 고유한 사용자 번호
      id: id,
      password: password,
      username: username,
      created: new Date(),
    });

    return { statusCode: 201, success: true, message: "아이디 생성 완료" };  // 201: Created
  } catch (error) {
    // 서버 오류 처리
    return { statusCode: 500, success: false, message: "서버 오류 발생", error: error.message };  // 500: Internal Server Error
  }
}

export async function login(id, password) {
  const res = await collUser.findOne({ id: id, password: password }, {
    projection: {
      _id: 0,
      id: { $toString: "$_id" },
      id: 1,
      password: 1,
      created: 1
    }
  });
  return res;
}

export async function getVotes(gubun, userSeq, startDate, endDate) {

  const query = {};

  // 시스템 구분(gubun) 필터
  if (gubun) {
    query.gubun = gubun;
  }

  // 사용자 식별자(userSeq) 필터
  // if (userSeq) {
  //   query.userSeq = parseInt(userSeq, 10);
  // }

  // 시작일(startDate) 및 종료일(endDate) 필터
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) {
      query.startDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }
  }
  console.log(query);
  // 투표 리스트 조회
  const res = await collVote.find(query).toArray();
  console.log(res)
  return res;
}

// 새로운 orderSeq를 생성하는 함수
async function generateUniqueOrderSeq(existingOrderSeqs) {
  let newOrderSeq = Math.max(...existingOrderSeqs, 0) + 1;
  while (existingOrderSeqs.includes(newOrderSeq)) {
    newOrderSeq += 1; // 중복된 경우 다음 값으로 이동
  }
  return newOrderSeq;
}

// 투표 항목 수정 및 추가 API
export async function updateVote(voteId, voteItems, votename, startDate, endDate, voteOption) {
  // 투표 데이터 조회
  const existingVote = await collVote.findOne({ voteId: new ObjectId(voteId) });
  if (!existingVote) {
    return { success: false, message: "투표를 찾을 수 없습니다." };
  }

  // 기존 항목들의 orderSeq 추출
  const existingOrderSeqs = existingVote.voteItems.map(item => item.orderSeq);

  // 기존 투표 항목을 voteItemSeq로 매핑
  const existingVoteItemsMap = new Map(
    existingVote.voteItems.map(item => [item.voteItemSeq, item])
  );

  // 새로 들어온 항목을 업데이트하거나 추가
  const updatedVoteItems = [];

  for (const item of voteItems) {
    const existingItem = existingVoteItemsMap.get(item.voteItemSeq);

    if (existingItem) {
      // 기존 항목 수정
      updatedVoteItems.push({
        ...existingItem,
        voteName: item.voteName || existingItem.voteName,
        orderSeq: existingItem.orderSeq, // 기존 순서 유지
        voteCount: item.voteCount || existingItem.voteCount
      });
    } else {
      // 새로운 항목 추가 - 새로운 orderSeq 생성
      const newOrderSeq = await generateUniqueOrderSeq(existingOrderSeqs);
      updatedVoteItems.push({
        voteItemSeq: await getNextSequence("voteItemSeq"),
        voteName: item.voteName,
        orderSeq: newOrderSeq, // 새로운 순서 할당
        voteCount: item.voteCount || 0
      });
      existingOrderSeqs.push(newOrderSeq); // 생성된 새로운 orderSeq 추가
    }
  }

  // totalVoteCount 재계산
  const totalVoteCount = updatedVoteItems.reduce((total, item) => total + (item.voteCount || 0), 0);

  // 투표 항목 및 관련 정보 업데이트
  const updatedVoteData = {
    votename,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    voteOption: voteOption || existingVote.voteOption,
    voteItems: updatedVoteItems,
    totalVoteCount, // 총 투표 수 업데이트
    updateDate: new Date(), // 업데이트 시간 갱신
  };

  // 데이터베이스 업데이트
  await collVote.updateOne(
    { voteId: new ObjectId(voteId) },
    { $set: updatedVoteData }
  );

  return { success: true, message: "투표 항목이 성공적으로 업데이트되었습니다." };
}


// 투표생성
export async function insertVote(votename, gubun, userSeq, startDate, endDate, voteOption, voteItems) {
  // 새 투표 객체 생성
  const processedVoteItems = await Promise.all(
    voteItems.map(async (item, index) => ({
      voteItemSeq: await getNextSequence("voteItemSeq"), // 비동기적으로 시퀀스 가져오기
      voteName: item.voteName,
      orderSeq: index + 1, // 인덱스를 기본 값으로 설정
      voteCount: item.voteCount || 0 // 기본 값 0으로 설정
    }))
  );
  const newVote = {
    voteId: new ObjectId(),
    votename,
    gubun,
    userSeq,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    createdDate: new Date(),
    updateDate: new Date(),
    voteOption: voteOption || { dupl: false },
    voteItems: processedVoteItems,
    totalVoteCount: voteItems.reduce((total, item) => total + (item.voteCount || 0), 0)
  };

  // 투표 정보를 MongoDB에 삽입
  const res = await collVote.insertOne(newVote);
  return res;
}

export async function getVotedetail(gubun, voteId, userSeq) {
  const query = {};

  // 시스템 구분(gubun) 필터
  if (gubun) {
    query.gubun = gubun;
  }

  // 투표 식별자(voteId) 필터, ObjectId로 변환해서 처리
  if (voteId) {
    query.voteId = new ObjectId(voteId);  // 문자열을 ObjectId로 변환
  }

  // 사용자 식별자(userSeq) 필터
  if (userSeq !== undefined) {
    query.userSeq = userSeq;
  }

  console.log(query);  // 디버깅을 위해 쿼리 로그 출력
  const res = await collVoteDetail.find(query).toArray();
  return res;
}

export async function getVote(gubun, voteId, userSeq) {
  const query = {};
  const objectIdVoteId = new ObjectId(voteId);

  // 시스템 구분(gubun) 필터
  if (gubun) {
    query.gubun = gubun;
  }

  // 투표 식별자(voteId) 필터, ObjectId로 변환
  if (voteId) {
    query.voteId = objectIdVoteId;
  }

  // 투표 리스트 조회
  const voteData = await collVote.find(query).toArray();

  // 사용자의 투표 내역 조회
  const votedetailData = await getVotedetail(gubun, objectIdVoteId, userSeq);

  // 투표 항목 중 사용자가 투표한 항목 찾기
  const votedItemSeqs = votedetailData.map(detail => detail.voteItemSeq);

  // voteData에 duplicated 및 isVoted 플래그 추가
  const extendedVoteData = voteData.map(item => ({
    ...item,
    duplicated: votedetailData.length !== 0,  // 사용자가 이미 투표했는지 여부
    voteItems: item.voteItems.map(voteItem => ({
      ...voteItem,
      isVoted: votedItemSeqs.includes(voteItem.voteItemSeq),  // 사용자가 해당 항목에 투표했는지 여부
    })),
  }));

  return extendedVoteData;
}

// 투표하기
export async function insertVoting(voteId, userSeq, gubun, voteItems) {
  const objectIdVoteId = new ObjectId(voteId);

  // 사용자의 투표 내역 조회
  const votedetailData = await getVotedetail(gubun, objectIdVoteId, userSeq);

  if (votedetailData.length !== 0) {
    // 이미 투표한 경우, 중복 투표 방지
    return { success: false, message: "User has already voted." };
  }

  const voteDetails = voteItems.map((item) => ({
    voteDetailId: new ObjectId(), // 새로운 ID 생성
    voteId: objectIdVoteId,       // 투표 ID
    userSeq,                      // 사용자 ID
    gubun,
    voteItemSeq: item.voteItemSeq, // 투표 항목 ID
    createdDate: new Date(),
    updateDate: new Date(),
    deleteYn: "N"
  }));
  // 각 투표 항목의 카운트 업데이트
  for (const item of voteItems) {
    await collVote.updateOne(
      { "voteId": objectIdVoteId, "voteItems.voteItemSeq": item.voteItemSeq },
      { $inc: { "voteItems.$.voteCount": 1 } }
    );
  }
  const result = await collVoteDetail.insertMany(voteDetails);
  return result;
}

// 투표 수정 API
export async function updateVoting(gubun, voteId, userSeq, newVoteItemSeqs) {
  const objectIdVoteId = new ObjectId(voteId);

  // 사용자가 이미 해당 투표에 투표했는지 확인
  const votedetailData = await getVotedetail(gubun, voteId, userSeq);

  if (votedetailData.length === 0) {
    // 투표 기록이 없는 경우, 투표하지 않았다는 메시지 반환
    return { success: false, message: "User has not voted yet." };
  }

  // 기존 투표 항목의 투표 항목 시퀀스 배열을 가져옴
  const oldVoteItemSeqs = votedetailData.map(detail => detail.voteItemSeq);

  // 중복된 항목만 처리
  const duplicateVoteItemSeqs = oldVoteItemSeqs.filter(seq => newVoteItemSeqs.includes(seq));
  const newVoteItemSeqsToAdd = newVoteItemSeqs.filter(seq => !oldVoteItemSeqs.includes(seq));

  // 기존 투표 항목의 투표 수 감소 (중복된 항목만)
  if (duplicateVoteItemSeqs.length > 0) {
    await collVote.updateMany(
      { _id: objectIdVoteId, "voteItems.voteItemSeq": { $in: duplicateVoteItemSeqs } },
      { $inc: { "voteItems.$[elem].voteCount": -1, totalVoteCount: -duplicateVoteItemSeqs.length } },
      { arrayFilters: [{ "elem.voteItemSeq": { $in: duplicateVoteItemSeqs } }] }
    );
  }

  // 새로운 투표 항목의 투표 수 증가
  if (newVoteItemSeqsToAdd.length > 0) {
    await collVote.updateMany(
      { _id: objectIdVoteId, "voteItems.voteItemSeq": { $in: newVoteItemSeqsToAdd } },
      { $inc: { "voteItems.$[elem].voteCount": 1, totalVoteCount: newVoteItemSeqsToAdd.length } },
      { arrayFilters: [{ "elem.voteItemSeq": { $in: newVoteItemSeqsToAdd } }] }
    );

    // 기존 투표 기록 업데이트
    await collVoteDetail.updateOne(
      { voteId: objectIdVoteId, userSeq: userSeq },
      { $set: { voteItemSeq: newVoteItemSeqsToAdd[0], updateDate: new Date() } } // 이 부분은 새로운 투표 항목으로 업데이트
    );
  }

  return { success: true, message: "Votes updated successfully." };
}

export async function deleteVote(voteId) {
  // 투표 데이터 조회
  const existingVote = await collVote.findOne({ voteId: new ObjectId(voteId) });
  if (!existingVote) {
    return { success: false, message: "투표를 찾을 수 없습니다." };
  }

  // 투표 데이터 삭제
  const result = await collVote.deleteOne({ voteId: new ObjectId(voteId) });
  console.log(result);
  if (result.deletedCount === 1) {
    return { success: true, message: "투표가 성공적으로 삭제되었습니다." };
  } else {
    return { success: false, message: "투표 삭제에 실패하였습니다." };
  }
}



export async function insertVoteDetail(voteId, gubun, voteItemSeq, userSeq) {
  const newVoteDetail = {
    voteDetailId: new ObjectId(),
    voteId: new ObjectId(voteId),
    gubun,
    userSeq,
    voteItemSeq,
    userSeq,
    createdDate: new Date(),
    updateDate: new Date(),
    deleteYn: "N"
  };

  // 투표 정보를 MongoDB에 삽입
  const res = await collVoteDetail.insertOne(newVoteDetail);
  return res;
}


export async function insertSempleVote() {
  collVote.insertOne({
    "voteId": new ObjectId("64fbf7e6a2c2e6f8d89e4568"),
    "gubun": "mcnc",
    "votename": "Best Player of the Year2",
    "userSeq": 0,
    "startDate": new Date("2024-09-01T00:00:00Z"),
    "endDate": new Date("2024-09-10T23:59:59Z"),
    "createdDate": new Date("2024-08-25T10:20:30Z"),
    "updateDate": new Date("2024-09-03T14:45:00Z"),
    "voteOption": { "dupl": false, "randomize": false },
    "voteItem": [
      { "voteItemSeq": 4, "voteName": "Player1", "orderSeq": 1, "voteCount": 150 },
      { "voteItemSeq": 5, "voteName": "Player2", "orderSeq": 2, "voteCount": 120 },
      { "voteItemSeq": 6, "voteName": "Player3", "orderSeq": 3, "voteCount": 90 }
    ],
    "totalVoteCount": 360
  });
}

// insertSempleVote();

// registUser('karyo', '1234', '이명한2');
