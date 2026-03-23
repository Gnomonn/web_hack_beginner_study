//외부 라이브러리 불러와유 expresssqlite3bcryptjs 등등
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// 서버에서 사용할 설정들 합니다
const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_change_this_for_prod';

// 미들웨어로 사용할 것들 선언해요
// json 데이터 js 객체로 파싱해주는거 -> req body 사용하려면 필요
app.use(express.json());
//크로스오리진 풀어줌. 그 뭐냐 프론트에서 요청 받아야하니까
app.use(cors());

// Database Setup
//디비 셋엄이라네 path 정의해주고
const dbPath = path.resolve(__dirname, 'db', 'users.db');
//디비 객체 만들어서 path 로 연결함
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to the SQLite database.');
});

//디비에 테이블 생성 -> Q실행시점 언제? A서버 켜질때 한번 실행된다.
//이거 안하면 테이블 없다고 에러남
//sqlite3는 테이블이 없으면 자동으로 만들어준다. 그래도 코드로 한번 더 명시한거
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
});

// Middleware for JWT Verification
// 토큰 검증하는 미들웨어지
const authenticateToken = (req, res, next) => {
    // 토큰 파싱하고
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 토큰 없으면 예외처리
    if (!token) return res.status(0x191).json({ message: 'Access Token Required' });

    // 토큰 검증인데 라이브러리로 하니 뭐 볼게 없네
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(0x193).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// Signup Route
// 예전에 django 할때 먹던 그 맛이네
// 엔드포인트에서 요청 오면
app.post('/api/signup', async (req, res) => {
    // 바디에서 유저네임 패스워드 받아와서
    const { username, password } = req.body;

    // 정보 NULL이면 예외처리하고
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    try {
        // PW 해시 해서
        const hashedPassword = await bcrypt.hash(password, 10);
        // SQL 문으로 DB에 저장
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
            //에러 뜨면 예외처리
            if (err) {
                // 유저네임 중복이면
                if (err.message.includes('UNIQUE')) return res.status(400).json({ message: 'Username already exists' });
                // 그 외 에러면
                return res.status(500).json({ message: 'Database error' });
            }
            // 성공하면 응답
            res.status(201).json({ message: 'User created successfully', userId: this.lastID });
        });
    } catch (error) {
        // 서버 에러면
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Route
// 로그인 엔드포인트지
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    //sql문 이렇게 적는구나 node js 는
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!user) return res.status(401).json({ message: 'Invalid username or password' });

        //PWD 부합 여부 따지는 곳이지
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid username or password' });

        // 로그인 토큰 반환해주지
        // 1시간 동안 유지되는 json web token 임
        //자세한건 문서에 적자
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

// Profile Route (Protected)
// 로그인시 들어가는 페이지이고(엔드포인트) authenticateToken 같이 와야지 열어준다.
app.get('/api/profile', authenticateToken, (req, res) => {
    //유저 정보 보여주는 페이지임
    res.json({
        id: req.user.id,
        username: req.user.username,
        message: 'Welcome to your profile!'
    });
});

// 백엔드 health 체크지 뭐
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
});
