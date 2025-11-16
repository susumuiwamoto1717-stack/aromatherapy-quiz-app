// アプリケーションのメインロジック

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let currentUser = null;
let currentQuestionType = null; // "truefalse" or "multiple"

// ユーザーデータの管理
function getUserData(username) {
    const data = localStorage.getItem(`user_${username}`);
    return data ? JSON.parse(data) : { answers: {} };
}

function saveUserData(username, data) {
    localStorage.setItem(`user_${username}`, JSON.stringify(data));
}

function getAllUsers() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('user_')) {
            users.push(key.replace('user_', ''));
        }
    }
    return users;
}

// 画面の表示切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ユーザー登録画面を表示
function showUserScreen() {
    showScreen('user-screen');
    displayUserList();
}

// ユーザー登録
function registerUser() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    
    if (!username) {
        alert('ユーザー名を入力してください。');
        return;
    }
    
    currentUser = username;
    const userData = getUserData(username);
    saveUserData(username, userData);
    
    // ユーザー名を表示
    document.getElementById('current-username').textContent = username;
    document.getElementById('start-username').textContent = username;
    
    showTypeSelection();
    input.value = '';
}

// 既存ユーザーを選択
function selectUser(username) {
    currentUser = username;
    document.getElementById('current-username').textContent = username;
    document.getElementById('start-username').textContent = username;
    showTypeSelection();
}

// ユーザーリストを表示
function displayUserList() {
    const userList = document.getElementById('user-list');
    const users = getAllUsers();
    
    if (users.length === 0) {
        userList.innerHTML = '<p>登録されているユーザーはありません。</p>';
        return;
    }
    
    userList.innerHTML = '<h3>既存のユーザーを選択</h3>' + 
        users.map(user => 
            `<button class="btn btn-category" onclick="selectUser('${user}')">${user}</button>`
        ).join('');
}

// 問題タイプ選択画面を表示
function showTypeSelection() {
    showScreen('type-selection-screen');
}

// 問題タイプを選択
function selectQuestionType(type) {
    currentQuestionType = type;
    showStartScreen();
}

function showStartScreen() {
    showScreen('start-screen');
    resetQuiz();
}

// クイズ開始
function startQuiz(mode) {
    resetQuiz();
    
    // フィルターを取得
    const filter = document.querySelector('input[name="filter"]:checked').value;
    
    // 問題タイプに応じて問題を取得
    let allQuestions = getQuestionsByCategoryAndType('皮膚', currentQuestionType);
    
    // フィルター適用
    if (filter === 'wrong' && currentUser) {
        const userData = getUserData(currentUser);
        allQuestions = allQuestions.filter(q => {
            const answerData = userData.answers[q.id];
            return answerData && !answerData.isCorrect;
        });
        
        if (allQuestions.length === 0) {
            alert('間違った問題がありません。全問題に挑戦してください！');
            return;
        }
    }
    
    // 問題数を決定
    if (mode === 'all') {
        currentQuestions = [...allQuestions];
    } else {
        const count = parseInt(mode);
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        currentQuestions = shuffled.slice(0, Math.min(count, allQuestions.length));
    }
    
    shuffleArray(currentQuestions);
    showScreen('quiz-screen');
    displayQuestion();
}

// 配列をシャッフル
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 問題を表示
function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    const totalQuestions = currentQuestions.length;
    
    // 進捗バー更新
    const progress = (questionNumber / totalQuestions) * 100;
    document.getElementById('progress').style.width = progress + '%';
    
    // 問題番号とカテゴリー表示
    document.getElementById('question-number').textContent = `問題 ${questionNumber} / ${totalQuestions}`;
    document.getElementById('category-badge').textContent = question.category;
    
    // 過去の回答状況を表示
    if (currentUser) {
        const userData = getUserData(currentUser);
        const answerData = userData.answers[question.id];
        const statusEl = document.getElementById('question-status');
        
        if (answerData) {
            if (answerData.isCorrect) {
                statusEl.textContent = '✓ 前回正解';
                statusEl.className = 'question-status correct-status';
            } else {
                statusEl.textContent = '✗ 前回不正解';
                statusEl.className = 'question-status wrong-status';
            }
        } else {
            statusEl.textContent = '未回答';
            statusEl.className = 'question-status';
        }
    }
    
    // 問題文表示
    document.getElementById('question-text').textContent = question.question;
    
    // 選択肢表示
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        optionBtn.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(optionBtn);
    });
    
    // フィードバックを非表示
    document.getElementById('answer-feedback').classList.add('hidden');
}

// 答えを選択
function selectAnswer(selectedIndex) {
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;
    
    // 選択肢を無効化
    document.querySelectorAll('.option-btn').forEach((btn, index) => {
        btn.classList.add('disabled');
        btn.onclick = null;
        
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // スコア更新
    if (isCorrect) {
        score++;
    }
    
    // ユーザーの回答を記録
    userAnswers.push({
        question: question,
        selectedIndex: selectedIndex,
        isCorrect: isCorrect
    });
    
    // ユーザーデータに保存
    if (currentUser) {
        const userData = getUserData(currentUser);
        userData.answers[question.id] = {
            isCorrect: isCorrect,
            selectedIndex: selectedIndex,
            timestamp: new Date().toISOString()
        };
        saveUserData(currentUser, userData);
    }
    
    // フィードバック表示
    showFeedback(question, isCorrect);
}

// フィードバック表示
function showFeedback(question, isCorrect) {
    const feedbackContent = document.getElementById('feedback-content');
    
    let html = `
        <div class="explanation">
            <h3>${isCorrect ? '✅ 正解！' : '❌ 不正解'}</h3>
            <p><strong>正解:</strong> ${String.fromCharCode(65 + question.correct)}. ${question.options[question.correct]}</p>
            <p><strong>解説:</strong></p>
            <p>${question.explanation}</p>
            <div class="simple-explanation">
                <h4>🎓 噛み砕いた説明</h4>
                <p>${question.simpleExplanation}</p>
            </div>
        </div>
    `;
    
    feedbackContent.innerHTML = html;
    document.getElementById('answer-feedback').classList.remove('hidden');
}

// 次の問題へ
function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

// 結果表示
function showResults() {
    showScreen('result-screen');
    
    const totalQuestions = currentQuestions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    document.getElementById('score-percentage').textContent = percentage + '%';
    document.getElementById('correct-count').textContent = score;
    document.getElementById('total-count').textContent = totalQuestions;
    
    // カテゴリー別の結果
    const breakdown = {};
    userAnswers.forEach(answer => {
        const category = answer.question.category;
        if (!breakdown[category]) {
            breakdown[category] = { correct: 0, total: 0 };
        }
        breakdown[category].total++;
        if (answer.isCorrect) {
            breakdown[category].correct++;
        }
    });
    
    const breakdownHtml = Object.keys(breakdown).map(category => {
        const data = breakdown[category];
        const catPercentage = Math.round((data.correct / data.total) * 100);
        return `
            <div class="breakdown-item">
                <span>${category}</span>
                <span>${data.correct} / ${data.total} (${catPercentage}%)</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('result-breakdown').innerHTML = breakdownHtml || '<p>結果データがありません。</p>';
}

// クイズをリセット
function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    currentQuestions = [];
}

// 再挑戦
function restartQuiz() {
    if (currentQuestions.length > 0) {
        resetQuiz();
        shuffleArray(currentQuestions);
        showScreen('quiz-screen');
        displayQuestion();
    } else {
        showStartScreen();
    }
}

// ページ読み込み時にユーザーリストを表示
window.addEventListener('DOMContentLoaded', () => {
    displayUserList();
    
    // Enterキーでユーザー登録
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                registerUser();
            }
        });
    }
});
