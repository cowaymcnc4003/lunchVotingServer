import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const port = 3000;

const users = [{ user: "user-1", password: "password-1", name: "name-1" }];
const db = [{ title: "title-1", contents: "contents-1" }];

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

app.get("/notes", authorizationJWT, (req, res) => {
  const data = db[0];
  res.send(data);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
