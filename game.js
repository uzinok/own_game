document.addEventListener('DOMContentLoaded', function () {
	// Основные элементы интерфейса
	const roundTitle = document.querySelector('.round');
	const topicsContainer = document.querySelector('.topics');
	const questionDisplay = document.querySelector('.question-text');

	// Переменные состояния игры
	let gameState = {
		rounds: [],
		currentRoundIndex: 0,
		openedQuestions: []
	};

	// Загрузка данных игры
	loadGameData();

	// Функция загрузки данных игры
	async function loadGameData() {
		try {
			const response = await fetch('quiz.json');
			const data = await response.json();
			gameState.rounds = data.rounds;

			// Загрузка сохранённого состояния
			const savedState = localStorage.getItem('quizGameState');
			if (savedState) {
				const parsedState = JSON.parse(savedState);
				if (parsedState.currentRoundIndex < gameState.rounds.length) {
					gameState.currentRoundIndex = parsedState.currentRoundIndex;
					gameState.openedQuestions = parsedState.openedQuestions || [];
				}
			}

			initRound();
		} catch (error) {
			console.error('Ошибка загрузки данных:', error);
		}
	}

	// Инициализация раунда
	function initRound() {
		if (gameState.currentRoundIndex >= gameState.rounds.length) {
			questionDisplay.textContent = 'Игра завершена!';
			return;
		}

		const round = gameState.rounds[gameState.currentRoundIndex];
		roundTitle.textContent = round.quizTitle;
		topicsContainer.innerHTML = '';

		// Создаём сетку вопросов
		round.quiz.forEach((topic, topicIndex) => {
			// Добавляем название темы
			const topicElement = document.createElement('div');
			topicElement.className = 'topic-name';
			topicElement.textContent = topic.theme;
			topicsContainer.appendChild(topicElement);

			// Добавляем вопросы
			topic.questions.forEach((question, questionIndex) => {
				const questionElement = document.createElement('div');
				questionElement.className = 'question';

				// Проверяем, был ли вопрос уже открыт
				const isOpened = gameState.openedQuestions.some(
					q => q.round === gameState.currentRoundIndex &&
						q.topic === topicIndex &&
						q.question === questionIndex
				);

				if (isOpened) {
					questionElement.classList.add('opened');
					questionElement.innerHTML = `<div class="question-value">✓</div>`;
				} else {
					questionElement.innerHTML = `<div class="question-value">${question.value}</div>`;

					questionElement.addEventListener('click', () => handleQuestionClick(
						topicIndex,
						questionIndex,
						questionElement
					));
				}

				topicsContainer.appendChild(questionElement);
			});
		});
	}

	// Обработка клика по вопросу
	function handleQuestionClick(topicIndex, questionIndex, element) {
		if (element.classList.contains('active') || element.classList.contains('opened')) return;

		const round = gameState.rounds[gameState.currentRoundIndex];
		const question = round.quiz[topicIndex].questions[questionIndex];

		// Показываем вопрос
		element.classList.add('active');
		questionDisplay.textContent = question.question;

		// Обработка повторного клика для показа ответа
		const showAnswer = () => {
			questionDisplay.textContent = `Ответ: ${question.answer}`;
			element.classList.remove('active');
			element.classList.add('opened');
			element.innerHTML = `<div class="question-value">✓</div>`;

			// Сохраняем открытый вопрос
			gameState.openedQuestions.push({
				round: gameState.currentRoundIndex,
				topic: topicIndex,
				question: questionIndex
			});

			// Проверяем завершение раунда
			checkRoundCompletion();

			saveGameState();
		};

		element.addEventListener('click', showAnswer, { once: true });
	}

	// Проверка завершения раунда
	function checkRoundCompletion() {
		const round = gameState.rounds[gameState.currentRoundIndex];
		const totalQuestions = round.quiz.reduce((sum, topic) => sum + topic.questions.length, 0);
		const openedInRound = gameState.openedQuestions.filter(
			q => q.round === gameState.currentRoundIndex
		).length;

		if (openedInRound >= totalQuestions) {
			setTimeout(() => {
				gameState.currentRoundIndex++;
				if (gameState.currentRoundIndex < gameState.rounds.length) {
					initRound();
					questionDisplay.textContent = 'Выберите вопрос';
					saveGameState();
				} else {
					questionDisplay.textContent = 'Игра завершена!';
				}
			}, 2000);
		}
	}

	// Сохранение состояния игры
	function saveGameState() {
		localStorage.setItem('quizGameState', JSON.stringify({
			currentRoundIndex: gameState.currentRoundIndex,
			openedQuestions: gameState.openedQuestions
		}));
	}

	// Функция сброса вопросов (доступна глобально)
	window.resetQuestions = function () {
		gameState = {
			rounds: gameState.rounds,
			currentRoundIndex: 0,
			openedQuestions: []
		};

		localStorage.removeItem('quizGameState');
		questionDisplay.textContent = 'Выберите вопрос';
		initRound();
	};
});
