import React, { useState, useEffect } from 'react';
import axios from 'axios';

//api base 정함 솔직히 주석 달 필요도 없지 않나
const API_BASE = '/api';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'signup', 'profile'
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    }
  }, []);


  // 각 이벤트에 따른 동작을 미리 정의해둠
  // 프로필 가져오는 함수겠지
  const fetchProfile = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setView('profile');
    } catch (err) {
      localStorage.removeItem('token');
      setView('login');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = view === 'login' ? '/login' : '/signup';
    try {
      const res = await axios.post(`${API_BASE}${endpoint}`, formData);
      if (view === 'login') {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setView('profile');
      } else {
        alert('회원가입 성공! 로그인해주세요.');
        setView('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };


  //이쯤부터 html 이 보이기 시작 if 문으로 대충 분기해두고 return 으로 동작하는구만 
  // 버튼 클릭하면 위에서 정의한 이벤트 일어나는거니 아래는 눈에 띄는 부분만 함
  if (view === 'profile' && user) {
    return (
      <div className="container">
        <div className="glass-card profile-card animate-fade-in">
          <h1>환영합니다, {user.username}님!</h1>
          <div className="info-section">
            <p><strong>아이디:</strong> {user.username}</p>
            <p><strong>사용자 식별번호:</strong> {user.id}</p>
            <p className="description">이곳은 당신의 개인 프로필 페이지입니다. 안전하게 로그인되었습니다.</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">로그아웃</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="glass-card auth-card animate-slide-up">
        <h1>{view === 'login' ? '로그인' : '회원가입'}</h1>
        <p className="subtitle">{view === 'login' ? '서비스에 접속하여 정보를 확인하세요' : '새로운 계정을 생성하세요'}</p>

        <form onSubmit={handleAuth}>
          <div className="input-group">
            <label>아이디</label>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              /// ...formData는 뭐지
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '처리 중...' : (view === 'login' ? '로그인' : '가입하기')}
          </button>
        </form>

        <div className="auth-footer">
          {view === 'login' ? (
            <p>계정이 없으신가요? <span onClick={() => { setView('signup'); setError('') }}>회원가입</span></p>
          ) : (
            <p>이미 계정이 있으신가요? <span onClick={() => { setView('login'); setError('') }}>로그인</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
