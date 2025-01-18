let areas = [];
const areaInput = document.getElementById('area-input');
const priorityInput = document.getElementById('priority-input');
const timeInput = document.getElementById('time-input');
const addAreaButton = document.getElementById('add-area');
const goalsContainer = document.getElementById('goals-container');
const generateHabitsButton = document.getElementById('generate-habits');
const habitsContainer = document.getElementById('habits-container');
const modeToggle = document.getElementById('mode-toggle');

addAreaButton.addEventListener('click', () => {
    const area = areaInput.value.trim();
    const priority = priorityInput.value;
    const time = timeInput.value.trim();
    if (area && areas.length < 5) {
        if (priority === 'high' && areas.filter(a => a.priority === 'high').length >= 2) {
            alert('You can only have up to 2 high priority areas.');
            return;
        }
        areas.push({ area, priority, time, goals: [''] });
        areaInput.value = '';
        timeInput.value = '';
        updateGoalsUI();
    } else if (areas.length >= 5) {
        alert('You can only add up to 5 areas.');
    }
});

generateHabitsButton.addEventListener('click', generateHabits);

modeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    modeToggle.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
});

function updateGoalsUI() {
    goalsContainer.innerHTML = '';
    areas.forEach((areaObj, index) => {
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        goalCard.innerHTML = `
            <h3>${areaObj.area} (${areaObj.priority} priority)</h3>
            ${areaObj.goals.map((goal, goalIndex) => `
                <input type="text" placeholder="Enter goal ${goalIndex + 1} for ${areaObj.area}" 
                       value="${goal}" 
                       oninput="updateGoal(${index}, ${goalIndex}, this.value)">
            `).join('')}
            ${areaObj.goals.length < 2 ? `
                <button onclick="addGoal(${index})">Add Another Goal</button>
            ` : ''}
            ${areaObj.time ? `<p>Daily time commitment: ${areaObj.time} minutes</p>` : ''}
        `;
        goalsContainer.appendChild(goalCard);
    });
    generateHabitsButton.style.display = areas.length >= 2 ? 'block' : 'none';
    habitsContainer.style.display = 'none';
}

function updateGoal(areaIndex, goalIndex, value) {
    areas[areaIndex].goals[goalIndex] = value;
}

function addGoal(areaIndex) {
    if (areas[areaIndex].goals.length < 2) {
        areas[areaIndex].goals.push('');
        updateGoalsUI();
    }
}

async function generateHabits() {
    if (areas.length < 2) {
        alert('Please enter at least 2 areas of life.');
        return;
    }

    const goals = areas.flatMap(area => 
        area.goals.map(goal => ({
            area: area.area,
            goal: goal,
            priority: area.priority,
            time: area.time
        }))
    ).filter(goal => goal.goal.trim() !== '');

    if (goals.length === 0) {
        alert('Please enter at least one goal.');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/generate-habits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ goals }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch habits from AI');
        }

        const habits = await response.json();
        displayHabits(habits);
    } catch (error) {
        console.error('Error generating habits:', error);
        alert('Failed to generate habits. Please try again.');
    }
}

function displayHabits(habits) {
    let habitsHTML = '<h2>Your Personalized Habits</h2>';

    for (const [area, areaHabits] of Object.entries(habits)) {
        const areaObj = areas.find(a => a.area.toLowerCase() === area.toLowerCase());
        
        if (areaObj) {
            habitsHTML += `
                <div class="habit-area">
                    <h3>${area.toUpperCase()}</h3>
                    <ol class="habit-list">
                        ${areaHabits.map((habit, index) => `
                            <li>${habit}</li>
                        `).join('')}
                    </ol>
                </div>
            `;
        }
    }

    if (Object.keys(habits).length > 0) {
        habitsContainer.innerHTML = habitsHTML;
        habitsContainer.style.display = 'block';
    } else {
        habitsContainer.style.display = 'none';
    }
}

// Initialize UI
updateGoalsUI();

