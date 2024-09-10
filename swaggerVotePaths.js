/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: API Documentation
 *   description: API 문서입니다.
 *   version: 1.0.0
 * 
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT  # JWT 형식의 토큰 사용 시 명시
 *
 * security:
 *   - BearerAuth: []
 *
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
 *                  example: "mhlee4"
 *                password:
 *                  type: string
 *                  description: "사용자 비밀번호"
 *                  example: "qwer1234"
 *                username:
 *                  type: string
 *                  description: "사용자 이름"
 *                  example: "이명한4"
 *                gubun:
 *                  type: string
 *                  description: "시스템 구분"
 *                  example: "mcnc"
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
 *  /login:
 *    post:
 *      summary: "사용자 로그인"
 *      description: "사용자가 아이디와 비밀번호로 로그인하여 JWT 토큰을 발급받습니다."
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
 *                  example: "mhlee"
 *                password:
 *                  type: string
 *                  description: "사용자 비밀번호"
 *                  example: "qwer1234"
 *      responses:
 *        200:
 *          description: "성공적으로 로그인하고 JWT 토큰을 발급받습니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  token:
 *                    type: string
 *                    description: "JWT 인증 토큰"
 *                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *        401:
 *          description: "로그인 실패, 아이디 또는 비밀번호가 일치하지 않습니다."
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
 *                    example: "아이디 또는 비밀번호가 잘못되었습니다."
 * 
 * /votes:
 *   post:
 *     summary: "투표 리스트 조회"
 *     description: "지정된 날짜 범위와 기타 필터를 기반으로 투표 목록을 조회합니다."
 *     tags: [Vote]
 *     security:
 *        - BearerAuth: []  # 각 경로에 security 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gubun:
 *                 type: string
 *                 description: "투표 구분"
 *                 example: "mcnc"
 *               userSeq:
 *                 type: integer
 *                 description: "사용자 시퀀스 번호"
 *                 example: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: "조회 시작 날짜 및 시간 (예: 2024-09-03T07:31:26.898+00:00)"
 *                 example: "2024-01-01T00:00:00.000+00:00"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: "조회 종료 날짜 및 시간 (예: 2024-09-03T07:31:26.898+00:00)"
 *                 example: "2024-12-31T23:59:59.999+00:00"
 *     responses:
 *       200:
 *         description: "투표 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   voteId:
 *                     type: string
 *                     description: "투표 ID"
 *                     example: "66d9701e62a13f289618fb13"
 *                   title:
 *                     type: string
 *                     description: "투표 제목"
 *                     example: "2024 연말 파티"
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     description: "투표 시작 날짜 및 시간"
 *                     example: "2024-12-01T00:00:00.000+00:00"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     description: "투표 종료 날짜 및 시간"
 *                     example: "2024-12-31T23:59:59.999+00:00"
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: "투표 옵션 목록"
 *                     example: ["Option 1", "Option 2"]
 *       400:
 *         description: "잘못된 요청 파라미터"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청 파라미터입니다."
 *       500:
 *         description: "서버 오류 발생"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 * /vote:
 *   post:
 *     summary: "투표 조회"
 *     description: "특정 투표의 세부 사항을 조회합니다."
 *     tags: [Vote]
 *     security:
 *        - BearerAuth: []  # 각 경로에 security 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gubun:
 *                 type: string
 *                 description: "투표 구분"
 *                 example: "mcnc"
 *               voteId:
 *                 type: string
 *                 description: "투표 ID"
 *                 example: "66d9701e62a13f289618fb13"
 *     responses:
 *       200:
 *         description: "투표 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 voteId:
 *                   type: string
 *                   description: "투표 ID"
 *                   example: "66d9701e62a13f289618fb13"
 *                 title:
 *                   type: string
 *                   description: "투표 제목"
 *                   example: "2024 연말 파티"
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   description: "투표 시작 날짜 및 시간"
 *                   example: "2024-12-01T00:00:00.000+00:00"
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   description: "투표 종료 날짜 및 시간"
 *                   example: "2024-12-31T23:59:59.999+00:00"
 *                 options:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: "투표 옵션 목록"
 *                   example: ["Option 1", "Option 2"]
 *       400:
 *         description: "잘못된 요청 파라미터"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청 파라미터입니다."
 *       500:
 *         description: "서버 오류 발생"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *   put:
 *     summary: "투표항목 등록"
 *     description: "새로운 투표항목을 등록합니다."
 *     tags: [Vote]
 *     security:
 *        - BearerAuth: []  # 각 경로에 security 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               votename:
 *                 type: string
 *                 description: "투표 이름"
 *                 example: "2024 연말 파티"
 *               gubun:
 *                 type: string
 *                 description: "투표 구분"
 *                 example: "mcnc"
 *               userSeq:
 *                 type: integer
 *                 description: "사용자 시퀀스 번호"
 *                 example: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: "투표 시작 날짜 및 시간"
 *                 example: "2024-12-01T00:00:00.000+00:00"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: "투표 종료 날짜 및 시간"
 *                 example: "2024-12-31T23:59:59.999+00:00"
 *               voteOption:
 *                 type: object
 *                 description: "투표 옵션"
 *                 example: { "dupl": false, "randomize": false }
 *               voteItems:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "투표 항목 목록"
 *                 example: [{ "voteName": "영화관" }, { "voteName": "박물관" }, { "voteName": "집" }]
 *     responses:
 *       201:
 *         description: "투표항목 등록 성공"
 *       400:
 *         description: "잘못된 요청 파라미터"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청 파라미터입니다."
 *       500:
 *         description: "서버 오류 발생"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 * /updateVote:
 *   post:
 *     summary: "투표항목 수정"
 *     description: "기존 투표항목을 수정합니다."
 *     tags: [Vote]
 *     security:
 *        - BearerAuth: []  # 각 경로에 security 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voteId:
 *                 type: string
 *                 description: "투표 ID"
 *                 example: "66da530814b2eb97fea592a0"
 *               votename:
 *                 type: string
 *                 description: "투표 이름"
 *                 example: "2024 연말 휴가"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: "투표 시작 날짜 및 시간"
 *                 example: "2024-12-01T00:00:00.000+00:00"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: "투표 종료 날짜 및 시간"
 *                 example: "2024-12-31T23:59:59.999+00:00"
 *               voteOption:
 *                 type: object
 *                 description: "투표 옵션"
 *                 example: { "dupl": false, "randomize": false }
 *               voteItems:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "투표 항목 목록"
 *                 example: [{ "voteName": "고급빌라" }, { "voteName": "아파트" }, { "voteName": "해외여행" }]
 *     responses:
 *       200:
 *         description: "투표항목 수정 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "투표항목 수정 성공"
 *       400:
 *         description: "잘못된 요청 파라미터"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청 파라미터입니다."
 *       500:
 *         description: "서버 오류 발생"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 * /voting:
 *   post:
 *     summary: "투표하기"
 *     description: "사용자가 투표를 제출합니다."
 *     tags: [Vote]
 *     security:
 *        - BearerAuth: []  # 각 경로에 security 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voteId:
 *                 type: string
 *                 description: "투표 ID"
 *                 example: "66d9701e62a13f289618fb13"
 *               userSeq:
 *                 type: integer
 *                 description: "사용자 시퀀스 번호"
 *                 example: 0
 *               gubun:
 *                 type: string
 *                 description: "투표 구분"
 *                 example: "mcnc"
 *               voteItems:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "투표 항목 목록"
 *                 example: [{ "voteItemSeq": 42}]
 *     responses:
 *       200:
 *         description: "투표 제출 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "투표 제출 성공"
 *       400:
 *         description: "잘못된 요청 파라미터"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청 파라미터입니다."
 *       500:
 *         description: "서버 오류 발생"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 * /deleteVote:
 *   post:
 *     summary: "투표항목 삭제"
 *     description: "특정 투표항목을 삭제합니다."
 *     tags: [Vote]
 *     security:
 *        - BearerAuth: []  # 각 경로에 security 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voteId:
 *                 type: string
 *                 description: "투표 ID"
 *                 example: "66d9701e62a13f289618fb13"
 *     responses:
 *       200:
 *         description: "투표항목 삭제 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "투표항목 삭제 성공"
 *       400:
 *         description: "잘못된 요청 파라미터"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청 파라미터입니다."
 *       500:
 *         description: "서버 오류 발생"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
