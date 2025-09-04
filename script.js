// StudyHub - Q&A 및 학습 플래너 웹앱 JavaScript

// 전역 상태 관리
class StudyHubApp {
    constructor() {
        // 데이터 저장소
        this.data = {
            user: JSON.parse(localStorage.getItem('studyhub_user')) || null,
            questions: JSON.parse(localStorage.getItem('studyhub_questions')) || [],
            tasks: JSON.parse(localStorage.getItem('studyhub_tasks')) || [],
            studyRecords: JSON.parse(localStorage.getItem('studyhub_study_records')) || [],
            communityPosts: JSON.parse(localStorage.getItem('studyhub_community_posts')) || [],
            notifications: JSON.parse(localStorage.getItem('studyhub_notifications')) || [],
            settings: JSON.parse(localStorage.getItem('studyhub_settings')) || {
                theme: 'light',
                notifications: {
                    questionAnswers: true,
                    goalAchievement: true,
                    breakTime: false
                }
            }
        };

        // 현재 활성 페이지
        this.currentPage = 'dashboard';
        
        // 차트 인스턴스 저장
        this.charts = {};

        // 앱 초기화
        this.init();
    }

    // 앱 초기화
    init() {
        console.log('StudyHub 앱 초기화 중...');
        
        // 로그인 상태 확인
        if (!this.data.user) {
            this.showLoginModal();
        } else {
            this.hideLoginModal();
            this.updateUserInterface();
        }

        // 이벤트 리스너 등록
        this.attachEventListeners();
        
        // 테마 적용
        this.applyTheme();
        
        // 대시보드 데이터 업데이트
        this.updateDashboard();
        
        // 통계 차트 초기화
        this.initializeCharts();

        console.log('StudyHub 앱 초기화 완료');
    }

    // 이벤트 리스너 등록
    attachEventListeners() {
        // 네비게이션 버튼
        document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // 모바일 메뉴 토글
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobileMenu');
            mobileMenu.classList.toggle('hidden');
        });

        // 테마 토글
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 사용자 메뉴 토글
        document.getElementById('userMenuBtn').addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('hidden');
        });

        // 문서 클릭으로 드롭다운 닫기
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenuBtn');
            const dropdown = document.getElementById('userDropdown');
            if (!userMenu.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // 로그인 관련 이벤트
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Q&A 관련 이벤트
        document.getElementById('askQuestionBtn').addEventListener('click', () => {
            this.showQuestionModal();
        });

        document.getElementById('closeQuestionModal').addEventListener('click', () => {
            this.hideQuestionModal();
        });

        document.getElementById('cancelQuestion').addEventListener('click', () => {
            this.hideQuestionModal();
        });

        document.getElementById('submitQuestion').addEventListener('click', () => {
            this.submitQuestion();
        });

        // Q&A 검색
        document.getElementById('qnaSearchInput').addEventListener('input', (e) => {
            this.searchQuestions(e.target.value);
        });

        // 플래너 관련 이벤트
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showAddTaskDialog();
        });

        document.getElementById('recordStudyBtn').addEventListener('click', () => {
            this.recordStudyTime();
        });

        // 프로필 저장
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfile();
        });

        // 커뮤니티 게시물 공유
        document.getElementById('sharePostBtn').addEventListener('click', () => {
            this.showSharePostDialog();
        });

        // 테마 옵션 선택
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectTheme(e.currentTarget);
            });
        });
    }

    // 페이지 네비게이션
    navigateToPage(page) {
        // 모든 페이지 숨기기
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.classList.add('hidden');
        });

        // 모든 네비게이션 버튼 비활성화
        document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 페이지 표시
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.classList.remove('hidden');
        }

        // 활성 버튼 표시
        document.querySelectorAll(`[data-page="${page}"]`).forEach(btn => {
            btn.classList.add('active');
        });

        // 모바일 메뉴 닫기
        document.getElementById('mobileMenu').classList.add('hidden');

        this.currentPage = page;

        // 페이지별 특별 처리
        switch (page) {
            case 'qna':
                this.loadQuestions();
                break;
            case 'planner':
                this.loadTasks();
                this.loadStudyRecords();
                break;
            case 'statistics':
                this.updateCharts();
                break;
            case 'community':
                this.loadCommunityPosts();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    // 특정 질문으로 이동
    navigateToQuestion(questionId) {
        // Q&A 페이지로 이동
        this.navigateToPage('qna');
        
        // 잠시 후에 해당 질문으로 스크롤
        setTimeout(() => {
            const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
            if (questionElement) {
                // 기존 하이라이트 제거
                document.querySelectorAll('.question-card').forEach(card => {
                    card.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-75');
                });
                
                // 해당 질문 하이라이트
                questionElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-75');
                
                // 부드럽게 스크롤
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // 3초 후 하이라이트 제거
                setTimeout(() => {
                    questionElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-75');
                }, 3000);
            }
        }, 200);
    }

    // 로그인 처리
    handleLogin() {
        const name = document.getElementById('loginName').value.trim();
        const email = document.getElementById('loginEmail').value.trim();

        if (!name || !email) {
            alert('이름과 이메일을 모두 입력해주세요.');
            return;
        }

        // 간단한 이메일 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('올바른 이메일 주소를 입력해주세요.');
            return;
        }

        // 사용자 정보 저장
        this.data.user = {
            name: name,
            email: email,
            joinDate: new Date().toISOString(),
            studyGoal: 4, // 기본 4시간
            sleepGoal: 8  // 기본 8시간
        };

        this.saveToStorage('studyhub_user', this.data.user);
        this.hideLoginModal();
        this.updateUserInterface();
        this.updateDashboard();

        // 환영 알림 추가
        this.addNotification(`안녕하세요, ${name}님! StudyHub에 오신 것을 환영합니다.`, 'success');
    }

    // 로그아웃 처리
    handleLogout() {
        if (confirm('로그아웃 하시겠습니까?')) {
            this.data.user = null;
            this.saveToStorage('studyhub_user', null);
            this.showLoginModal();
        }
    }

    // 사용자 인터페이스 업데이트
    updateUserInterface() {
        if (this.data.user) {
            document.getElementById('userName').textContent = this.data.user.name;
            document.getElementById('userInitial').textContent = this.data.user.name.charAt(0).toUpperCase();
            document.getElementById('profileName').value = this.data.user.name;
            document.getElementById('profileEmail').value = this.data.user.email;
            document.getElementById('dailyGoal').value = this.data.user.studyGoal || 4;
            document.getElementById('sleepGoal').value = this.data.user.sleepGoal || 8;
        }
    }

    // 로그인 모달 표시/숨기기
    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
    }

    // 테마 토글
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            this.data.settings.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            this.data.settings.theme = 'dark';
        }
        this.saveToStorage('studyhub_settings', this.data.settings);
    }

    // 테마 적용
    applyTheme() {
        if (this.data.settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // 질문 모달 표시/숨기기
    showQuestionModal() {
        document.getElementById('questionModal').classList.remove('hidden');
    }

    hideQuestionModal() {
        document.getElementById('questionModal').classList.add('hidden');
        // 폼 초기화
        document.getElementById('questionTitle').value = '';
        document.getElementById('questionContent').value = '';
        document.getElementById('questionImage').value = '';
    }

    // 질문 제출
    submitQuestion() {
        const title = document.getElementById('questionTitle').value.trim();
        const content = document.getElementById('questionContent').value.trim();
        const imageFile = document.getElementById('questionImage').files[0];

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        const question = {
            id: Date.now().toString(),
            title: title,
            content: content,
            author: this.data.user.name,
            authorEmail: this.data.user.email,
            createdAt: new Date().toISOString(),
            answers: [],
            image: imageFile ? URL.createObjectURL(imageFile) : null
        };

        this.data.questions.unshift(question);
        this.saveToStorage('studyhub_questions', this.data.questions);
        this.hideQuestionModal();
        this.loadQuestions();
        this.updateDashboard();

        // 알림 추가
        this.addNotification('질문이 성공적으로 등록되었습니다!', 'success');
    }

    // 질문 목록 로드
    loadQuestions() {
        const qnaList = document.getElementById('qnaList');
        
        if (this.data.questions.length === 0) {
            qnaList.innerHTML = `
                <div class="text-gray-500 dark:text-gray-400 text-center py-8">
                    아직 질문이 없습니다. 첫 번째 질문을 작성해보세요!
                </div>
            `;
            return;
        }

        qnaList.innerHTML = this.data.questions.map(question => `
            <div class="question-card" data-question-id="${question.id}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold">${question.author.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 dark:text-white">${question.title}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${question.author} • ${this.formatDate(question.createdAt)}</p>
                        </div>
                    </div>
                    <button class="answer-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" onclick="studyHub.showAnswerDialog('${question.id}')">
                        <i class="fas fa-reply mr-1"></i> 답변
                    </button>
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-3">${question.content}</p>
                ${question.image ? `<img src="${question.image}" class="max-w-full h-64 object-cover rounded-lg mb-3" alt="첨부 이미지">` : ''}
                <div class="border-t dark:border-gray-600 pt-3">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">답변 ${question.answers.length}개</p>
                    <div class="space-y-2">
                        ${question.answers.map(answer => `
                            <div class="answer-card">
                                <div class="flex items-center space-x-2 mb-1">
                                    <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">${answer.author.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span class="font-medium text-sm">${answer.author}</span>
                                    <span class="text-xs text-gray-500">${this.formatDate(answer.createdAt)}</span>
                                </div>
                                <p class="text-sm ml-8">${answer.content}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 답변 다이얼로그 표시
    showAnswerDialog(questionId) {
        const answer = prompt('답변을 입력하세요:');
        if (answer && answer.trim()) {
            this.addAnswer(questionId, answer.trim());
        }
    }

    // 답변 추가
    addAnswer(questionId, content) {
        const question = this.data.questions.find(q => q.id === questionId);
        if (!question) return;

        const answer = {
            id: Date.now().toString(),
            content: content,
            author: this.data.user.name,
            authorEmail: this.data.user.email,
            createdAt: new Date().toISOString()
        };

        question.answers.push(answer);
        this.saveToStorage('studyhub_questions', this.data.questions);
        this.loadQuestions();

        // 질문 작성자에게 알림 (본인이 아닌 경우)
        if (question.authorEmail !== this.data.user.email) {
            this.addNotification(`"${question.title}" 질문에 새로운 답변이 달렸습니다.`, 'info');
        }
    }

    // 질문 검색
    searchQuestions(query) {
        if (!query.trim()) {
            this.loadQuestions();
            return;
        }

        const filteredQuestions = this.data.questions.filter(question =>
            question.title.toLowerCase().includes(query.toLowerCase()) ||
            question.content.toLowerCase().includes(query.toLowerCase()) ||
            question.answers.some(answer =>
                answer.content.toLowerCase().includes(query.toLowerCase())
            )
        );

        const qnaList = document.getElementById('qnaList');
        if (filteredQuestions.length === 0) {
            qnaList.innerHTML = `
                <div class="text-gray-500 dark:text-gray-400 text-center py-8">
                    "${query}" 검색 결과가 없습니다.
                </div>
            `;
        } else {
            // 검색 결과 표시 (동일한 로직으로 렌더링)
            this.renderQuestions(filteredQuestions, qnaList);
        }
    }

    // 할일 추가 다이얼로그
    showAddTaskDialog() {
        const task = prompt('할일을 입력하세요:');
        if (task && task.trim()) {
            this.addTask(task.trim());
        }
    }

    // 할일 추가
    addTask(content) {
        const task = {
            id: Date.now().toString(),
            content: content,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.data.tasks.push(task);
        this.saveToStorage('studyhub_tasks', this.data.tasks);
        this.loadTasks();
        this.updateDashboard();
    }

    // 할일 목록 로드
    loadTasks() {
        const taskList = document.getElementById('taskList');
        
        if (this.data.tasks.length === 0) {
            taskList.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-4">할일이 없습니다.</div>';
            return;
        }

        taskList.innerHTML = this.data.tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="studyHub.toggleTask('${task.id}')">
                <span class="flex-1">${task.content}</span>
                <button class="text-red-500 hover:text-red-700 ml-2" onclick="studyHub.deleteTask('${task.id}')">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        `).join('');
    }

    // 할일 완료/미완료 토글
    toggleTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        this.saveToStorage('studyhub_tasks', this.data.tasks);
        this.loadTasks();
        this.updateDashboard();

        if (task.completed) {
            this.addNotification('할일을 완료했습니다! 🎉', 'success');
        }
    }

    // 할일 삭제
    deleteTask(taskId) {
        if (confirm('이 할일을 삭제하시겠습니까?')) {
            this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
            this.saveToStorage('studyhub_tasks', this.data.tasks);
            this.loadTasks();
            this.updateDashboard();
        }
    }

    // 학습 시간 기록
    recordStudyTime() {
        const subject = document.getElementById('subjectSelect').value;
        const minutes = parseInt(document.getElementById('studyTimeInput').value);

        if (!minutes || minutes < 1) {
            alert('학습 시간을 1분 이상 입력해주세요.');
            return;
        }

        const record = {
            id: Date.now().toString(),
            subject: subject,
            minutes: minutes,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
            createdAt: new Date().toISOString()
        };

        this.data.studyRecords.push(record);
        this.saveToStorage('studyhub_study_records', this.data.studyRecords);
        
        // 입력 필드 초기화
        document.getElementById('studyTimeInput').value = '';
        
        this.loadStudyRecords();
        this.updateDashboard();
        this.updateCharts();

        this.addNotification(`${subject} ${minutes}분 학습이 기록되었습니다!`, 'success');
    }

    // 학습 기록 로드
    loadStudyRecords() {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = this.data.studyRecords.filter(record => record.date === today);
        
        const recordsContainer = document.getElementById('todayStudyRecords');
        
        if (todayRecords.length === 0) {
            recordsContainer.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-4">오늘 학습 기록이 없습니다.</div>';
            return;
        }

        recordsContainer.innerHTML = todayRecords.map(record => `
            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span class="font-medium">${record.subject}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">${record.minutes}분</span>
            </div>
        `).join('');
    }

    // 프로필 저장
    saveProfile() {
        const name = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const dailyGoal = parseInt(document.getElementById('dailyGoal').value);
        const sleepGoal = parseInt(document.getElementById('sleepGoal').value);

        if (!name || !email) {
            alert('이름과 이메일을 모두 입력해주세요.');
            return;
        }

        this.data.user.name = name;
        this.data.user.email = email;
        this.data.user.studyGoal = dailyGoal;
        this.data.user.sleepGoal = sleepGoal;

        this.saveToStorage('studyhub_user', this.data.user);
        this.updateUserInterface();
        
        this.addNotification('프로필이 저장되었습니다!', 'success');
    }

    // 프로필 로드
    loadProfile() {
        if (this.data.user) {
            document.getElementById('profileName').value = this.data.user.name;
            document.getElementById('profileEmail').value = this.data.user.email;
            document.getElementById('dailyGoal').value = this.data.user.studyGoal || 4;
            document.getElementById('sleepGoal').value = this.data.user.sleepGoal || 8;
        }
    }

    // 대시보드 업데이트
    updateDashboard() {
        // 오늘 공부 시간
        const today = new Date().toISOString().split('T')[0];
        const todayStudyMinutes = this.data.studyRecords
            .filter(record => record.date === today)
            .reduce((sum, record) => sum + record.minutes, 0);
        
        const todayStudyHours = Math.floor(todayStudyMinutes / 60);
        const todayStudyMins = todayStudyMinutes % 60;
        
        document.getElementById('todayStudyTime').textContent = 
            todayStudyHours > 0 ? `${todayStudyHours}시간 ${todayStudyMins}분` : `${todayStudyMins}분`;

        // 완료된 할일
        const completedTasks = this.data.tasks.filter(task => task.completed).length;
        document.getElementById('completedTasks').textContent = completedTasks;

        // 내 질문 수
        const myQuestions = this.data.questions.filter(q => q.authorEmail === this.data.user?.email).length;
        document.getElementById('myQuestions').textContent = myQuestions;

        // 최근 Q&A 표시
        const recentQnA = document.getElementById('recentQnA');
        const recentQuestions = this.data.questions.slice(0, 3);
        
        if (recentQuestions.length === 0) {
            recentQnA.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-8">질문을 작성해보세요!</div>';
        } else {
            recentQnA.innerHTML = recentQuestions.map(q => `
                <div class="border-b dark:border-gray-600 pb-2 mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-2 transition-colors" onclick="studyHub.navigateToQuestion('${q.id}')">
                    <h4 class="font-medium text-sm">${q.title}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${q.answers.length}개 답변</p>
                </div>
            `).join('');
        }

        // 오늘의 할일 표시
        const todayTasks = document.getElementById('todayTasks');
        const incompleteTasks = this.data.tasks.filter(task => !task.completed).slice(0, 3);
        
        if (incompleteTasks.length === 0) {
            todayTasks.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-8">할일을 추가해보세요!</div>';
        } else {
            todayTasks.innerHTML = incompleteTasks.map(task => `
                <div class="flex items-center space-x-2">
                    <input type="checkbox" class="w-4 h-4" onchange="studyHub.toggleTask('${task.id}')">
                    <span class="text-sm">${task.content}</span>
                </div>
            `).join('');
        }
    }

    // 통계 차트 초기화
    initializeCharts() {
        this.initWeeklyStudyChart();
        this.initSubjectChart();
        this.initSleepChart();
    }

    // 주간 학습 시간 차트
    initWeeklyStudyChart() {
        const ctx = document.getElementById('weeklyStudyChart');
        if (!ctx) return;

        // 최근 7일 데이터 준비
        const last7Days = [];
        const studyData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            
            last7Days.push(dayName);
            
            const dayStudy = this.data.studyRecords
                .filter(record => record.date === dateStr)
                .reduce((sum, record) => sum + record.minutes, 0);
            
            studyData.push(Math.round(dayStudy / 60 * 100) / 100); // 시간 단위로 변환
        }

        if (this.charts.weeklyStudy) {
            this.charts.weeklyStudy.destroy();
        }

        this.charts.weeklyStudy = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: '학습 시간 (시간)',
                    data: studyData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '시간'
                        }
                    }
                }
            }
        });
    }

    // 과목별 학습 시간 차트
    initSubjectChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx) return;

        // 과목별 데이터 집계
        const subjectData = {};
        this.data.studyRecords.forEach(record => {
            if (!subjectData[record.subject]) {
                subjectData[record.subject] = 0;
            }
            subjectData[record.subject] += record.minutes;
        });

        const labels = Object.keys(subjectData);
        const data = Object.values(subjectData).map(minutes => Math.round(minutes / 60 * 100) / 100);
        
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

        if (this.charts.subject) {
            this.charts.subject.destroy();
        }

        this.charts.subject = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 수면 패턴 차트 (시뮬레이션 데이터)
    initSleepChart() {
        const ctx = document.getElementById('sleepChart');
        if (!ctx) return;

        // 시뮬레이션 수면 데이터 (실제로는 사용자 입력이나 연동된 데이터 사용)
        const last7Days = [];
        const sleepData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            
            last7Days.push(dayName);
            sleepData.push(Math.random() * 3 + 6); // 6-9시간 랜덤
        }

        if (this.charts.sleep) {
            this.charts.sleep.destroy();
        }

        this.charts.sleep = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days,
                datasets: [{
                    label: '수면 시간 (시간)',
                    data: sleepData,
                    backgroundColor: '#8B5CF6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 12,
                        title: {
                            display: true,
                            text: '시간'
                        }
                    }
                }
            }
        });
    }

    // 차트 업데이트
    updateCharts() {
        if (this.currentPage === 'statistics') {
            this.initializeCharts();
        }
    }

    // 커뮤니티 게시물 로드
    loadCommunityPosts() {
        const postsContainer = document.getElementById('communityPosts');
        
        if (this.data.communityPosts.length === 0) {
            postsContainer.innerHTML = `
                <div class="text-gray-500 dark:text-gray-400 text-center py-8">
                    아직 게시물이 없습니다. 첫 번째 게시물을 공유해보세요!
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = this.data.communityPosts.map(post => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold">${post.author.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h4 class="font-semibold">${post.author}</h4>
                        <p class="text-sm text-gray-500">${this.formatDate(post.createdAt)}</p>
                    </div>
                </div>
                <p class="text-gray-700 dark:text-gray-300">${post.content}</p>
                <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <button class="hover:text-blue-600">
                        <i class="far fa-heart mr-1"></i> ${post.likes || 0}
                    </button>
                    <button class="hover:text-blue-600">
                        <i class="far fa-comment mr-1"></i> ${post.comments?.length || 0}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 게시물 공유 다이얼로그
    showSharePostDialog() {
        const content = prompt('학습 성과나 경험을 공유해주세요:');
        if (content && content.trim()) {
            this.sharePost(content.trim());
        }
    }

    // 게시물 공유
    sharePost(content) {
        const post = {
            id: Date.now().toString(),
            content: content,
            author: this.data.user.name,
            authorEmail: this.data.user.email,
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: []
        };

        this.data.communityPosts.unshift(post);
        this.saveToStorage('studyhub_community_posts', this.data.communityPosts);
        this.loadCommunityPosts();

        this.addNotification('게시물이 공유되었습니다!', 'success');
    }

    // 테마 선택
    selectTheme(element) {
        // 모든 테마 옵션에서 선택 해제
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
            option.classList.add('border-gray-300', 'dark:border-gray-600');
            option.querySelector('i')?.remove();
        });

        // 선택된 테마 활성화
        element.classList.remove('border-gray-300', 'dark:border-gray-600');
        element.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        element.querySelector('div').insertAdjacentHTML('beforeend', '<i class="fas fa-check text-blue-600"></i>');
    }

    // 알림 추가
    addNotification(message, type = 'info') {
        const notification = {
            id: Date.now().toString(),
            message: message,
            type: type,
            createdAt: new Date().toISOString(),
            read: false
        };

        this.data.notifications.unshift(notification);
        this.saveToStorage('studyhub_notifications', this.data.notifications);
        this.updateNotificationCount();
        
        // 브라우저 알림 (권한이 있는 경우)
        if (Notification.permission === 'granted') {
            new Notification('StudyHub', { body: message });
        }
    }

    // 알림 카운트 업데이트
    updateNotificationCount() {
        const unreadCount = this.data.notifications.filter(n => !n.read).length;
        const countElement = document.getElementById('notificationCount');
        
        if (unreadCount > 0) {
            countElement.textContent = unreadCount;
            countElement.classList.remove('hidden');
        } else {
            countElement.classList.add('hidden');
        }
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return date.toLocaleDateString('ko-KR');
    }

    // 로컬 스토리지에 저장
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('데이터 저장 실패:', error);
        }
    }

    // 질문 렌더링 헬퍼
    renderQuestions(questions, container) {
        container.innerHTML = questions.map(question => `
            <div class="question-card" data-question-id="${question.id}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold">${question.author.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 dark:text-white">${question.title}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${question.author} • ${this.formatDate(question.createdAt)}</p>
                        </div>
                    </div>
                    <button class="answer-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" onclick="studyHub.showAnswerDialog('${question.id}')">
                        <i class="fas fa-reply mr-1"></i> 답변
                    </button>
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-3">${question.content}</p>
                ${question.image ? `<img src="${question.image}" class="max-w-full h-64 object-cover rounded-lg mb-3" alt="첨부 이미지">` : ''}
                <div class="border-t dark:border-gray-600 pt-3">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">답변 ${question.answers.length}개</p>
                    <div class="space-y-2">
                        ${question.answers.map(answer => `
                            <div class="answer-card">
                                <div class="flex items-center space-x-2 mb-1">
                                    <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">${answer.author.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span class="font-medium text-sm">${answer.author}</span>
                                    <span class="text-xs text-gray-500">${this.formatDate(answer.createdAt)}</span>
                                </div>
                                <p class="text-sm ml-8">${answer.content}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 전역 인스턴스 생성
let studyHub;

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    studyHub = new StudyHubApp();
    
    // 알림 권한 요청
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    console.log('StudyHub 앱이 성공적으로 로드되었습니다!');
});