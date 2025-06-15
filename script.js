document.addEventListener('DOMContentLoaded', function () {
	// Элементы интерфейса
	const addPlayerBtn = document.getElementById('addPlayerBtn');
	const addPlayerForm = document.getElementById('addPlayerForm');
	const playerNameInput = document.getElementById('playerNameInput');
	const confirmAddPlayer = document.getElementById('confirmAddPlayer');
	const playersList = document.getElementById('playersList');
	const resetGameBtn = document.getElementById('resetGame');

	// Загружаем игроков из localStorage
	loadPlayers();

	// Обработчики событий
	addPlayerBtn.addEventListener('click', showAddPlayerForm);
	confirmAddPlayer.addEventListener('click', handleAddPlayer);
	playerNameInput.addEventListener('keypress', function (e) {
		if (e.key === 'Enter') handleAddPlayer();
	});
	resetGameBtn.addEventListener('click', resetGame);

	function showAddPlayerForm() {
		addPlayerForm.style.display = 'flex';
		addPlayerBtn.style.display = 'none';
		playerNameInput.focus();
	}

	function handleAddPlayer() {
		const playerName = playerNameInput.value.trim();
		if (playerName) {
			addPlayer(playerName);
			playerNameInput.value = '';
			addPlayerForm.style.display = 'none';
			addPlayerBtn.style.display = 'block';
		}
	}

	function addPlayer(name, score = 0) {
		const playerId = Date.now();
		const playerElement = createPlayerElement(name, score, playerId);
		playersList.appendChild(playerElement);
		savePlayers();
	}

	function createPlayerElement(name, score, id) {
		const playerDiv = document.createElement('div');
		playerDiv.className = 'player';
		playerDiv.dataset.id = id;
		playerDiv.innerHTML = `
					<div class="player-name">${name}</div>
					<div class="player-controls">
							<button class="score-btn minus-btn">-</button>
							<input type="number" class="points-input" value="100">
							<button class="score-btn plus-btn">+</button>
					</div>
					<div class="player-score">Очки: <span class="score-display">${score}</span></div>
					<input type="number" class="score-input" value="${score}" style="display:none">
			`;

		// Обработчики событий...

		return playerDiv;
	}

	function savePlayers() {
		const players = [];
		document.querySelectorAll('.player').forEach(player => {
			players.push({
				id: player.dataset.id,
				name: player.querySelector('.player-name').textContent,
				score: parseInt(player.querySelector('.score-input').value) || 0
			});
		});
		localStorage.setItem('quizPlayers', JSON.stringify(players));
	}

	function loadPlayers() {
		const savedPlayers = localStorage.getItem('quizPlayers');
		if (savedPlayers) {
			JSON.parse(savedPlayers).forEach(player => {
				const playerElement = createPlayerElement(player.name, player.score, player.id);
				playersList.appendChild(playerElement);
			});
		}
	}

	function resetGame() {
		if (confirm('Вы уверены, что хотите сбросить игру? Все данные будут удалены.')) {
			// Сброс игроков
			playersList.innerHTML = '';
			localStorage.removeItem('quizPlayers');
			addPlayerForm.style.display = 'none';
			addPlayerBtn.style.display = 'block';

			// Вызов сброса вопросов
			if (window.resetQuestions) {
				window.resetQuestions();
			}
		}
	}
});
