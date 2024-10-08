
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
      userSeq: 0,
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
  // _id가 존재하지 않으면 0으로 초기화하고 생성
  const sequenceDocument = await collection.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence_value: 1 } }, // sequence_value를 1씩 증가
    { upsert: true, returnDocument: 'after' } // upsert 옵션 사용
  );
  console.log(sequenceDocument.sequence_value);

  return sequenceDocument.sequence_value;
}


export async function registUser(id, password, username, gubun) {
  try {
    // ID 중복 체크
    const existingId = await collUser.findOne({ id: id });
    if (existingId) {
      return { statusCode: 409, success: false, message: "중복된 아이디입니다." };  // 409: Conflict
    }

    // 사용자 등록
    const res = await collUser.insertOne({
      userSeq: await getNextSequence("userId"),  // 고유한 사용자 번호
      id: id,
      password: password,
      username: username,
      gubun: gubun,
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
      username: 1,
      userSeq: 1,
      created: 1,
      gubun: 1
    }
  });
  return res;
}

export async function tokenCheck(id, password) {
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

export async function getVotes(gubun, userSeq, startDate, endDate, voteStateOption) {
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
  // if (startDate && endDate) {
  //   query.startDate = {};
  //   if (startDate) {
  //     query.startDate.$gte = new Date(startDate);
  //   }
  //   if (endDate) {
  //     query.endDate = { $lte: new Date(endDate) };
  //   }
  // } else {
  //   return { statusCode: 401, success: false };
  // }

  // 현재 날짜 가져오기
  const currentDate = new Date();

  // voteStateOption이 'ING'인 경우, 종료일(endDate)이 현재 날짜보다 큰 투표만 필터링
  if (voteStateOption === 'ING') {
    query.$and = [
      { endDate: { $gt: currentDate } }, // endDate가 현재 날짜보다 작은 경우
      { isClosed: false } // isClosed가 false 경우
    ];
  }

  // voteStateOption이 'END'인 경우, 종료일(endDate)이 현재 날짜보다 작은 투표만 필터링
  if (voteStateOption === 'END') {
    query.$or = [
      { endDate: { $lte: currentDate } }, // endDate가 현재 날짜보다 작은 경우
      { isClosed: true } // isClosed가 true인 경우
    ];
  }


  // 투표 리스트 조회
  const res = await collVote.find(query).sort({ createdDate: -1 }).toArray(); // createdAt을 기준으로 내림차순 정렬
  console.log(res);
  // 각 투표 항목에 대해 duplicated 필드 추가
  const voteData = await Promise.all(res.map(async (vote) => {
    const votedetailData = await getVoteDetailsByDate(vote.voteId, userSeq, startDate, endDate);
    const isClosed = vote?.isClosed || false;

    return {
      ...vote,
      duplicated: votedetailData.length !== 0, // 투표 기록이 있으면 duplicated=true
      voteState: vote.endDate < currentDate || isClosed ? 'END' : 'ING', // 현재 날짜보다 endDate가 이전이면 END 아니면 ING
      // isClosed,
    };
  }));

  return { statusCode: 200, success: true, voteData };
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
    return { statusCode: 404, success: false, message: "Vote not found." };
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
        voteCount: existingItem.voteCount
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

  // 투표의 전체 사용자 내역 조회
  const votedetailData = await getVotedetail(voteId, undefined);
  console.log(`votedetailData ${JSON.stringify(votedetailData)}`);

  // 투표의 전체 사용자 내역 조회 voteItemSeq 만 뽑기
  const oldVoteItemSeqsValues = votedetailData.map(detail => detail.voteItemSeq);
  console.log(voteItems);
  // 신규 투표항목에서 seq만 있는 항목 뽑기
  const newVoteItem = [];
  for (const item of voteItems) {
    if (item.voteItemSeq) {
      newVoteItem.push({ "voteItemSeq": item.voteItemSeq });
    }
  }
  console.log(`newVoteItem ${newVoteItem}`);
  const newVoteItemSeqsValues = newVoteItem.map(item => item.voteItemSeq);
  console.log(`oldVoteItemSeqsValues ${JSON.stringify(oldVoteItemSeqsValues)}`);
  console.log(`newVoteItemSeqsValues ${JSON.stringify(newVoteItemSeqsValues)}`);
  // 선택되지 않은 이전 항목 voteItemSeq 뽑기
  const notDuplicateOldVoteItemSeqs = oldVoteItemSeqsValues.filter(seq => !newVoteItemSeqsValues.includes(seq));
  console.log(`notDuplicateOldVoteItemSeqs ${JSON.stringify(notDuplicateOldVoteItemSeqs)}`);

  // 투표 항목에서 선택되지 않은 이전 항목 voteItemSeq 제거
  await collVoteDetail.deleteMany(
    { voteId: new ObjectId(voteId), voteItemSeq: { $in: notDuplicateOldVoteItemSeqs } }
  );

  return { statusCode: 200, success: true, message: "Vote items updated successfully." };
}

// 투표생성
export async function insertVote(votename, gubun, userSeq, startDate, endDate, username, voteOption, voteItems) {
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
    username,
    voteOption: voteOption || { dupl: false },
    voteItems: processedVoteItems,
    totalVoteCount: voteItems.reduce((total, item) => total + (item.voteCount || 0), 0),
    isClosed: false
  };

  // 투표 정보를 MongoDB에 삽입
  const res = await collVote.insertOne(newVote);

  return {
    statusCode: 201,
    success: true,
    message: "투표가 정상 등록되었습니다.",
    data: {
      ...res,
      voteId: newVote.voteId // voteId 추가
    }
  };
}

export async function getVotedetail(voteId, userSeq) {
  const query = {};

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

export async function getVoteDetailsByDate(voteId, userSeq, startDate, endDate) {
  const query = {};

  // 투표 식별자(voteId) 필터, ObjectId로 변환해서 처리
  if (voteId) {
    query.voteId = voteId;  // 문자열을 ObjectId로 변환
  }

  // 사용자 식별자(userSeq) 필터
  if (userSeq !== undefined) {
    query.userSeq = userSeq;
  }

  // 날짜 필터링: 시작 날짜와 종료 날짜를 기준으로
  if (startDate) {
    query.createdDate = { $gte: new Date(startDate) }; // 시작 날짜 이상
  }

  if (endDate) {
    query.createdDate = { ...query.createdDate, $lte: new Date(endDate) }; // 종료 날짜 이하
  }

  console.log(query);  // 디버깅을 위해 쿼리 로그 출력
  const res = await collVoteDetail.find(query).toArray();
  return res;
}

export async function getVote(voteId, userSeq) {
  const query = {};
  const objectIdVoteId = new ObjectId(voteId);


  // 투표 식별자(voteId) 필터, ObjectId로 변환
  if (voteId) {
    query.voteId = objectIdVoteId;
  }

  // 투표 리스트 조회
  const voteData = await collVote.find(query).toArray();

  // 사용자의 투표 내역 조회
  const votedetailData = await getVotedetail(objectIdVoteId, userSeq);

  // 투표 항목 중 사용자가 투표한 항목 찾기
  const votedItemSeqs = votedetailData.map(detail => detail.voteItemSeq);
  const currentDate = new Date();

  // voteData에 duplicated 및 isVoted 플래그 추가
  const extendedVoteData = voteData.map(item => {
    console.log(item.isClosed);
    return ({
      ...item,
      duplicated: votedetailData.length !== 0,  // 사용자가 이미 투표했는지 여부
      voteItems: item.voteItems.map(voteItem => ({
        ...voteItem,
        isVoted: votedItemSeqs.includes(voteItem.voteItemSeq),  // 사용자가 해당 항목에 투표했는지 여부
      })),
    })
  });

  return extendedVoteData;
}

// 투표 등록 수정 API
export async function updateVoting(voteId, userSeq, gubun, newVoteItemSeqs) {
  const objectIdVoteId = new ObjectId(voteId);
  console.log(objectIdVoteId);

  // 투표 내용있는지 체크

  const checkVote = await getVote(voteId, userSeq);
  console.log(`checkVote ${JSON.stringify(checkVote)}`);
  if (checkVote.length === 0) {
    // 투표 기록이 없는 경우, 투표하지 않았다는 메시지 반환
    return { statusCode: 400, success: false, message: "not found vote." };
  } else {
    // 투표 항목에서 유효한 항목 시퀀스만 추출
    const validVoteItemSeqs = checkVote[0].voteItems.map(item => item.voteItemSeq);
    console.log(`validVoteItemSeqs ${JSON.stringify(validVoteItemSeqs)}`);

    // 투표 항목에 없는 새로운 투표 항목 체크
    const invalidVoteItems = newVoteItemSeqs.filter(item => !validVoteItemSeqs.includes(item.voteItemSeq));
    if (invalidVoteItems.length > 0) {
      return { statusCode: 400, success: false, message: "Invalid vote items found.", invalidItems: invalidVoteItems };
    }
  }


  // 사용자가 투표내용
  const votedetailData = await getVotedetail(voteId, userSeq);

  // if (votedetailData.length === 0) {
  //   // 투표 기록이 없는 경우, 투표하지 않았다는 메시지 반환
  //   return { success: false, message: "User has not voted yet." };
  // }

  // 속성만 추출하여 비교
  const oldVoteItemSeqsValues = votedetailData.map(detail => detail.voteItemSeq);
  const newVoteItemSeqsValues = newVoteItemSeqs.map(item => item.voteItemSeq);

  console.log(`oldVoteItemSeqsValues ${JSON.stringify(oldVoteItemSeqsValues)}`);
  console.log(`newVoteItemSeqsValues ${JSON.stringify(newVoteItemSeqsValues)}`);


  // 중복된 항목만 처리
  const duplicateVoteItemSeqs = oldVoteItemSeqsValues.filter(seq => newVoteItemSeqsValues.includes(seq));
  const notDuplicateOldVoteItemSeqs = oldVoteItemSeqsValues.filter(seq => !newVoteItemSeqsValues.includes(seq));
  const newVoteItemSeqsToAdd = newVoteItemSeqsValues.filter(seq => !oldVoteItemSeqsValues.includes(seq));

  console.log(`duplicateVoteItemSeqs ${JSON.stringify(duplicateVoteItemSeqs)}`);
  console.log(`newVoteItemSeqsValues ${JSON.stringify(newVoteItemSeqsValues)}`);
  console.log(`newVoteItemSeqs ${JSON.stringify(newVoteItemSeqs)}`);
  console.log(`notDuplicateOldVoteItemSeqs ${JSON.stringify(notDuplicateOldVoteItemSeqs)}`);
  console.log(`newVoteItemSeqsToAdd ${JSON.stringify(newVoteItemSeqsToAdd)}`);


  // 중복된 항목은 그대로 두고
  // 중복되지 않은 예전 항목의 투표 수 감소 및 votedetail 제거
  if (notDuplicateOldVoteItemSeqs.length > 0) {
    await collVote.updateMany(
      { voteId: objectIdVoteId, "voteItems.voteItemSeq": { $in: notDuplicateOldVoteItemSeqs } },
      { $inc: { "voteItems.$[elem].voteCount": -1, totalVoteCount: -notDuplicateOldVoteItemSeqs.length } },
      { arrayFilters: [{ "elem.voteItemSeq": { $in: notDuplicateOldVoteItemSeqs } }] }
    );

    // 투표 기록에서 제거
    await collVoteDetail.deleteMany(
      { voteId: objectIdVoteId, userSeq: userSeq, voteItemSeq: { $in: notDuplicateOldVoteItemSeqs } }
    );
  }

  // 새로운 투표 항목의 투표 수 증가 및 votedetail 생성
  if (newVoteItemSeqsToAdd.length > 0) {
    await collVote.updateMany(
      { voteId: objectIdVoteId, "voteItems.voteItemSeq": { $in: newVoteItemSeqsToAdd } },
      { $inc: { "voteItems.$[elem].voteCount": 1, totalVoteCount: newVoteItemSeqsToAdd.length } },
      { arrayFilters: [{ "elem.voteItemSeq": { $in: newVoteItemSeqsToAdd } }] }
    );

    // 새로운 투표 항목에 대한 votedetail 생성
    const voteDetails = newVoteItemSeqsToAdd.map((seq) => ({
      voteDetailId: new ObjectId(), // 새로운 ID 생성
      voteId: objectIdVoteId,       // 투표 ID
      userSeq,                      // 사용자 ID
      gubun,
      voteItemSeq: seq, // 투표 항목 ID
      createdDate: new Date(),
      updateDate: new Date(),
      deleteYn: "N"
    }));
    console.log(`voteDetails ${JSON.stringify(voteDetails)}`);
    // 각 투표 항목의 카운트 업데이트
    const result = await collVoteDetail.insertMany(voteDetails);
  }

  return { statusCode: 200, success: true, message: "Votes updated successfully." };
}

export async function deleteVote(voteId) {
  const objectIdVoteId = new ObjectId(voteId);

  // 투표 데이터 조회
  const existingVote = await collVote.findOne({ voteId: objectIdVoteId });
  if (!existingVote) {
    return { statusCode: 400, success: false, message: "투표를 찾을 수 없습니다." };
  }

  // 투표 데이터 삭제
  const voteDeleteResult = await collVote.deleteOne({ voteId: objectIdVoteId });
  if (voteDeleteResult.deletedCount === 1) {
    // 투표 상세 데이터 (collVoteDetail) 삭제
    const voteDetailDeleteResult = await collVoteDetail.deleteMany({ voteId: objectIdVoteId });
    console.log(voteDetailDeleteResult);

    return {
      statusCode: 200,
      success: true,
      message: `Vote successfully deleted. ${voteDetailDeleteResult.deletedCount} related vote details also removed.`
    };
  } else {
    return { statusCode: 500, success: false, message: "Failed to delete vote." };
  }
}

// 결선 투표 수정 API
export async function updateRunoffVoting(voteId, votename, runoffVoteItems) {
  const objectIdVoteId = new ObjectId(voteId);
  console.log(objectIdVoteId);

  // 투표 데이터 조회
  const existingVote = await collVote.findOne({ voteId: objectIdVoteId });
  if (!existingVote) {
    return { statusCode: 400, success: false, message: "투표를 찾을 수 없습니다." };
  }

  // 새 투표 객체 생성
  const processedVoteItems = await Promise.all(
    runoffVoteItems.map(async (item, index) => ({
      voteItemSeq: await getNextSequence("voteItemSeq"), // 비동기적으로 시퀀스 가져오기
      voteName: item.voteName,
      orderSeq: index + 1, // 인덱스를 기본 값으로 설정
      voteCount: 0 // 기본 값 0으로 설정
    }))
  );

  console.log(processedVoteItems);

  // 기존 투표 항목을 새로 받은 항목으로 교체
  const updateResult = await collVote.updateOne(
    { voteId: objectIdVoteId },
    { $set: { votename: votename, voteItems: processedVoteItems, totalVoteCount: 0, isClosed: false } } // 기존 항목을 클라이언트가 보낸 항목으로 대체
  );

  // 투표 이전 투표 기록 삭제
  try {
    const deleteResult = await collVoteDetail.deleteMany(
      { voteId: objectIdVoteId } // voteId에 해당하는 모든 투표 세부 정보 삭제
    );

    if (deleteResult.deletedCount === 0) {
      console.warn("삭제할 투표 기록이 없습니다."); // 로그로 경고
    }
  } catch (deleteError) {
    console.error("투표 기록 삭제 중 오류 발생:", deleteError);
    return { statusCode: 500, success: false, message: "투표 기록 삭제 중 오류가 발생했습니다." };
  }

  if (updateResult.modifiedCount === 0) {
    return { statusCode: 500, success: false, message: "투표 항목을 업데이트하지 못했습니다." };
  }

  return { statusCode: 200, success: true, message: "투표 항목이 성공적으로 업데이트되었습니다." };
}


// 결선 투표 종료 플래그 업데이트 API
export async function updateVoteClose(voteId) {
  const objectIdVoteId = new ObjectId(voteId);

  // 투표 데이터 조회
  const existingVote = await collVote.findOne({ voteId: objectIdVoteId });
  if (!existingVote) {
    return { statusCode: 400, success: false, message: "투표를 찾을 수 없습니다." };
  }

  // 투표 종료 플래그 업데이트
  const updateVoteCloseResult = await collVote.updateOne(
    { voteId: objectIdVoteId },
    { $set: { isClosed: true } } // isClosed 필드만 업데이트
  );

  if (updateVoteCloseResult.modifiedCount === 0) {
    return { statusCode: 500, success: false, message: "투표 종료 플래그를 업데이트하지 못했습니다." };
  }

  return { statusCode: 200, success: true, message: "투표 종료 플래그가 성공적으로 업데이트되었습니다." };
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

export async function guestLogin(id, password) {
  try {
    const guestSeq = await getNextSequence("guestSeq");
    // 사용자 등록
    const res = {
      userSeq: 'guest_' + guestSeq,  // 고유한 사용자 번호
      id: 'guest_' + guestSeq,
      username: 'guest_' + guestSeq,
      gubun: 'guest',
      created: new Date(),
    };

    return res;  // 201: Created
  } catch (error) {
    // 서버 오류 처리
    return { statusCode: 500, success: false, message: "서버 오류 발생", error: error.message };  // 500: Internal Server Error
  }
}

// insertSempleVote();

// registUser('karyo', '1234', '이명한2');
