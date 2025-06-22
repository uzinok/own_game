document.addEventListener('DOMContentLoaded', function () {
	const CACHE_KEY = 'quiz_game_data';
	let currentQuestionValue = 0;
	let rounds = [];
	let currentRound = 0;
	let answeredQuestions = 0;
	const totalQuestions = 25;

	// Загрузка сохраненных данных
	function loadFromCache() {
		const cachedData = localStorage.getItem(CACHE_KEY);
		if (cachedData) {
			try {
				const data = JSON.parse(cachedData);
				currentRound = data.currentRound || 0;
				answeredQuestions = data.answeredQuestions || 0;

				// Восстанавливаем игроков
				if (data.players && Array.isArray(data.players)) {
					data.players.forEach(player => {
						addPlayer(player.name, player.score);
					});
				}

				// Восстанавливаем состояние вопросов
				if (data.questionsState && Array.isArray(data.questionsState)) {
					data.questionsState.forEach(q => {
						const cell = document.querySelector(`.question-cell[data-theme="${q.theme}"][data-scores="${q.scores}"]`);
						if (cell) {
							cell.textContent = q.text;
							cell.style.color = q.color;
						}
					});
				}

				// Восстанавливаем текущий вопрос/ответ
				if (data.currentQuestion) {
					document.getElementById('question-text').textContent = data.currentQuestion.question;
					document.getElementById('answer-text').textContent = data.currentQuestion.answer;
				}

				// Пересчитываем answeredQuestions на основе состояния вопросов
				if (!answeredQuestions) {
					answeredQuestions = document.querySelectorAll('.question-cell[text="✓"]').length;
				}
			} catch (e) {
				console.error('Ошибка загрузки из кеша:', e);
			}
		}
	}

	// Сохранение данных
	function saveToCache() {
		const players = [];
		document.querySelectorAll('.player').forEach(playerEl => {
			players.push({
				name: playerEl.querySelector('.player-name').textContent,
				score: parseInt(playerEl.querySelector('.total-score').textContent) || 0
			});
		});

		// Сохраняем состояние вопросов
		const questionsState = [];
		document.querySelectorAll('.question-cell').forEach(cell => {
			questionsState.push({
				theme: cell.getAttribute('data-theme'),
				scores: cell.getAttribute('data-scores'),
				text: cell.textContent,
				color: cell.style.color
			});
		});

		const data = {
			currentRound,
			answeredQuestions,
			players,
			questionsState,
			currentQuestion: {
				question: document.getElementById('question-text').textContent,
				answer: document.getElementById('answer-text').textContent
			}
		};

		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
	}

	// Добавление игрока
	function addPlayer(name, score = 0) {
		const playerTemplate = document.getElementById('player-template');
		const newPlayer = playerTemplate.content.cloneNode(true);

		newPlayer.querySelector('.player-name').textContent = name;
		const scoreInput = newPlayer.querySelector('.score-input');
		scoreInput.value = currentQuestionValue || 0;
		scoreInput.readOnly = true;

		const totalElement = newPlayer.querySelector('.total-score');
		totalElement.textContent = score;
		updateScoreColor(totalElement);

		newPlayer.querySelector('.plus').addEventListener('click', function () {
			updatePlayerScore(this, 1);
		});

		newPlayer.querySelector('.minus').addEventListener('click', function () {
			updatePlayerScore(this, -1);
		});

		document.getElementById('players-container').appendChild(newPlayer);
	}

	// Обновление цвета счета
	function updateScoreColor(element) {
		const total = parseInt(element.textContent) || 0;
		element.style.color = total < 0 ? '#ff5252' : '#ffffff';
	}

	// Инициализация приложения
	function init() {
		loadFromCache();

		fetch('quiz.json')
			.then(response => {
				if (!response.ok) throw new Error('Network response was not ok');
				return response.json();
			})
			.then(data => {
				if (!data.rounds || !Array.isArray(data.rounds)) {
					throw new Error('Invalid data format');
				}

				rounds = data.rounds;
				initRound(rounds[currentRound]);

				setupQuestionCells();
			})
			.catch(error => {
				console.error('Ошибка загрузки:', error);
				alert('Ошибка загрузки вопросов. Попробуйте позже.');
			});

		setupEventListeners();
	}

	// Настройка обработчиков событий
	function setupEventListeners() {
		document.getElementById('confirm-add-player').addEventListener('click', function () {
			const playerNameInput = document.getElementById('player-name');
			const playerName = playerNameInput.value.trim();

			if (!playerName) {
				alert('Введите имя игрока');
				playerNameInput.focus();
				return;
			}

			addPlayer(playerName);
			playerNameInput.value = '';
			saveToCache();
		});

		document.getElementById('reset-game').addEventListener('click', function () {
			if (confirm('Сбросить игру?')) {
				localStorage.removeItem(CACHE_KEY);
				location.reload();
			}
		});
	}

	// Настройка ячеек с вопросами
	function setupQuestionCells() {
		document.querySelectorAll('.question-cell').forEach(cell => {
			cell.addEventListener('click', function () {
				if (this.textContent === '✓') return;

				const theme = this.getAttribute('data-theme');
				const scores = parseInt(this.getAttribute('data-scores'));

				if (!rounds[currentRound] || !rounds[currentRound].quiz) {
					console.error('Нет данных раунда');
					return;
				}

				const themeData = rounds[currentRound].quiz[theme - 1];
				if (!themeData || !themeData.questions) {
					console.error('Нет данных темы');
					return;
				}

				const questionData = themeData.questions.find(q => q.value == scores);
				if (!questionData) {
					console.error('Вопрос не найден');
					return;
				}

				if (this.textContent === '?') {
					currentQuestionValue = scores;
					document.querySelectorAll('.score-input').forEach(input => {
						input.value = currentQuestionValue;
					});

					document.getElementById('question-text').textContent = questionData.question;
					document.getElementById('answer-text').textContent = '';
					this.textContent = '😊';
					saveToCache();
				} else if (this.textContent === '😊') {
					document.getElementById('answer-text').textContent = questionData.answer;
					this.textContent = '✓';
					this.style.color = '#4CAF50';

					answeredQuestions++;
					checkRoundCompletion();
					saveToCache();
				}
			});
		});
	}

	// Проверка завершения раунда
	function checkRoundCompletion() {
		if (answeredQuestions >= totalQuestions && currentRound < rounds.length - 1) {
			const roundTitle = document.querySelector('.round-title');
			if (!roundTitle.querySelector('.next-round-btn')) {
				const nextBtn = document.createElement('button');
				nextBtn.className = 'next-round-btn';
				nextBtn.textContent = 'Дальше';
				nextBtn.addEventListener('click', goToNextRound);
				roundTitle.appendChild(nextBtn);
				saveToCache();
			}
		}
	}

	// Переход к следующему раунду
	function goToNextRound() {
		currentRound++;
		answeredQuestions = 0;

		document.querySelector('.next-round-btn')?.remove();
		document.getElementById('question-text').textContent = '';
		document.getElementById('answer-text').textContent = '';

		initRound(rounds[currentRound]);

		document.querySelectorAll('.question-cell').forEach(cell => {
			cell.textContent = '?';
			cell.style.color = '';
		});

		saveToCache();
	}

	// Инициализация раунда
	function initRound(roundData) {
		if (!roundData) return;

		const roundTitleElement = document.querySelector('.round-title');
		if (roundTitleElement) {
			roundTitleElement.textContent = roundData.quizTitle || 'Название раунда';
			roundTitleElement.querySelector('.next-round-btn')?.remove();
		}

		const tableRows = document.querySelectorAll('table tr:not(:first-child)');
		if (!tableRows) return;

		if (roundData.quiz) {
			roundData.quiz.forEach((theme, index) => {
				if (index < tableRows.length) {
					const themeCell = tableRows[index].querySelector('td:first-child');
					if (themeCell) {
						themeCell.textContent = theme.theme || `Тема ${index + 1}`;
					}
				}
			});
		}
	}

	// Обновление счета игрока
	function updatePlayerScore(button, modifier) {
		const player = button.closest('.player');
		const inputValue = parseInt(player.querySelector('.score-input').value) || 0;
		const totalElement = player.querySelector('.total-score');
		let total = parseInt(totalElement.textContent) || 0;

		total += inputValue * modifier;
		totalElement.textContent = total;
		updateScoreColor(totalElement);
		saveToCache();
	}

	// Запуск приложения
	init();
});
