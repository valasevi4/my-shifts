let shifts = JSON.parse(localStorage.getItem('myShifts')) || [];
let editIndex = -1;

// Переменные для календаря
let currentDate = new Date();

// Цвета для точек в календаре
const dotClasses = {
    'Колоно 1': 'dot-colono1',
    'Колоно 2': 'dot-colono2',
    'ЭГДС': 'dot-egds',
    'Отпуск': 'dot-vacation',
    'Выходной': 'dot-weekend',
    'Курсы': 'dot-courses'
};

function saveToStorage() {
    localStorage.setItem('myShifts', JSON.stringify(shifts));
}

// Переключение вида (Список / Календарь)
function toggleView(view) {
    const listView = document.getElementById('list-view');
    const calView = document.getElementById('calendar-view');
    const btnList = document.getElementById('btn-list');
    const btnCal = document.getElementById('btn-calendar');

    if (view === 'list') {
        listView.classList.remove('hidden');
        calView.classList.add('hidden');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
    } else {
        listView.classList.add('hidden');
        calView.classList.remove('hidden');
        btnList.classList.remove('active');
        btnCal.classList.add('active');
        renderCalendar(); // Обновляем календарь при переходе
    }
}

// --- ОТРИСОВКА СПИСКА ---
function renderShifts() {
    const list = document.getElementById('shifts-list');
    list.innerHTML = '';

    if (shifts.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">Смен пока нет</p>';
        return;
    }

    shifts.sort((a, b) => new Date(a.date) - new Date(b.date));

    shifts.forEach((shift, index) => {
        const card = document.createElement('div');
        
        const colorMap = {
            'Колоно 1': 'room-colono1', 'Колоно 2': 'room-colono2',
            'ЭГДС': 'room-egds', 'Отпуск': 'room-vacation',
            'Выходной': 'room-weekend', 'Курсы': 'room-courses'
        };
        
        const roomClass = colorMap[shift.room] || '';
        card.className = `shift-card ${roomClass}`;
        
        // Исправляем парсинг даты для iOS, чтобы не сдвигался часовой пояс
        const dateObj = new Date(shift.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });

        card.innerHTML = `
            <div class="shift-info">
                <div class="date">${dateStr}</div>
                <div class="room-name">${shift.room}</div>
                ${shift.note ? `<div class="note">📌 ${shift.note}</div>` : ''}
            </div>
            <div class="shift-actions">
                <button class="icon-btn edit-btn" onclick="openEdit(${index})">✏️</button>
                <button class="icon-btn delete-btn" onclick="deleteShift(${index})">🗑</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// --- ОТРИСОВКА КАЛЕНДАРЯ ---
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('cal-month-year').innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 - Вс, 1 - Пн, делаем так, чтобы Пн был 0)
    let startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; 
    const totalDays = lastDay.getDate();

    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    // Пустые ячейки перед началом месяца
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-day empty';
        grid.appendChild(emptyCell);
    }

    // Дни месяца
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        
        // Форматируем дату как YYYY-MM-DD для сравнения
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Проверяем, есть ли смена в этот день
        const shiftForDay = shifts.find(s => s.date === dateString);
        
        const dayNumber = document.createElement('span');
        dayNumber.innerText = day;
        cell.appendChild(dayNumber);

        // Если есть смена, рисуем цветную точку
        if (shiftForDay) {
            const dot = document.createElement('div');
            const dotClass = dotClasses[shiftForDay.room] || '';
            dot.className = `cal-dot ${dotClass}`;
            cell.appendChild(dot);
        }

        // Выделяем сегодняшний день
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('today');
        }

        // Клик по дню подставляет дату в форму
        cell.onclick = () => {
            document.getElementById('shift-date').value = dateString;
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Прокрутка наверх к форме
        };

        grid.appendChild(cell);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// --- ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ / УДАЛЕНИЕ ---
function addShift() {
    const date = document.getElementById('shift-date').value;
    const room = document.getElementById('shift-room').value;
    const note = document.getElementById('shift-note').value;

    if (!date || !room) {
        alert('Пожалуйста, выберите дату и тип смены!');
        return;
    }

    shifts.push({ date, room, note });
    saveToStorage();
    renderShifts();      // Обновляем список
    renderCalendar();    // Обновляем календарь

    document.getElementById('shift-date').value = '';
    document.getElementById('shift-room').value = '';
    document.getElementById('shift-note').value = '';
}

function deleteShift(index) {
    if (confirm('Удалить эту запись?')) {
        shifts.splice(index, 1);
        saveToStorage();
        renderShifts();
        renderCalendar();
    }
}

function openEdit(index) {
    editIndex = index;
    const shift = shifts[index];
    
    document.getElementById('edit-date').value = shift.date;
    document.getElementById('edit-room').value = shift.room;
    document.getElementById('edit-note').value = shift.note || '';

    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    editIndex = -1;
}

function saveEdit() {
    if (editIndex === -1) return;

    shifts[editIndex].date = document.getElementById('edit-date').value;
    shifts[editIndex].room = document.getElementById('edit-room').value;
    shifts[editIndex].note = document.getElementById('edit-note').value;

    saveToStorage();
    renderShifts();
    renderCalendar();
    closeModal();
}

// Инициализация
window.onload = () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shift-date').value = today;
    renderShifts();
};
