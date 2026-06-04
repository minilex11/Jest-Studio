// ==================== ПЕРЕМЕННЫЕ ПРИЛОЖЕНИЯ ====================
let userPhone = null;
let userBalance = 0;
let promoDiscount = 0;
let userAccounts = []; // Массив всех аккаунтов
let currentUserData = null; // Текущие данные пользователя
let currentPaymentMethod = 'sberbank'; // Текущий способ оплаты
const validPromoCodes = ['fostvar', 'jestvor', 'jest'];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    // Запускаем таймер технических работ
    startMaintenanceTimer();
    
    checkUserAuth();
    setupQuestCounterDisplay();
    
    // Добавляем слушатель на изменение суммы
    const balanceAmountInput = document.getElementById('balance-amount');
    if (balanceAmountInput) {
        balanceAmountInput.addEventListener('input', updatePaymentDetails);
    }
});

// ==================== ТАЙМЕР ТЕХНИЧЕСКИХ РАБОТ ====================
function startMaintenanceTimer() {
    // Дата и время окончания технических работ: 5 июня 2026, 12:00
    const targetDate = new Date('2026-06-05T12:00:00').getTime();
    
    function updateTimer() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        // Расчет времени
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        // Обновляем элементы
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        
        // Если время истекло, скрываем оверлей
        if (difference <= 0) {
            document.getElementById('maintenance-overlay').style.display = 'none';
            clearInterval(timerInterval);
        }
    }
    
    // Обновляем сразу
    updateTimer();
    
    // Затем обновляем каждую секунду
    const timerInterval = setInterval(updateTimer, 1000);
}

// ==================== СИСТЕМА АВТОРИЗАЦИИ ====================
function confirmAuth() {
    const phoneInput = document.getElementById('phone-input').value.trim();
    
    if (!phoneInput) {
        alert('Пожалуйста, введите номер телефона!');
        return;
    }
    
    if (phoneInput.length < 10) {
        alert('Номер должен содержать минимум 10 цифр!');
        return;
    }
    
    // Проверяем, есть ли уже аккаунт с таким номером
    const existingAccount = userAccounts.find(acc => acc.phone === phoneInput);
    
    if (existingAccount) {
        // Восстанавливаем существующий аккаунт
        currentUserData = existingAccount;
    } else {
        // Создаем новый аккаунт
        currentUserData = {
            phone: phoneInput,
            balance: 500,
            regDate: new Date().toLocaleDateString('ru-RU'),
            purchases: [],
            totalSpent: 0,
            activePromo: null,
            questProgress: {}
        };
        userAccounts.push(currentUserData);
    }
    
    userPhone = currentUserData.phone;
    userBalance = currentUserData.balance;
    
    saveAllData();
    hideAuthModal();
    showUserProfile();
    
    alert(`✅ Добро пожаловать, ${userPhone}!\n\nВам начислен стартовый бонус: 500₽`);
}

function checkUserAuth() {
    loadAllData();
    
    if (userAccounts.length > 0) {
        // Берем последний использованный аккаунт
        currentUserData = userAccounts[userAccounts.length - 1];
        userPhone = currentUserData.phone;
        userBalance = currentUserData.balance;
        hideAuthModal();
        showUserProfile();
    }
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'none';
}

function showUserProfile() {
    const profileDiv = document.getElementById('user-profile');
    profileDiv.style.display = 'flex';
    updateBalanceDisplay();
}

function updateBalanceDisplay() {
    const balanceSpan = document.getElementById('user-phone');
    balanceSpan.textContent = `💰 Баланс: ${userBalance}₽`;
}

function logout() {
    const accountIndex = userAccounts.findIndex(acc => acc.phone === userPhone);
    if (accountIndex !== -1) {
        userAccounts[accountIndex] = currentUserData;
    }
    saveAllData();
    
    userPhone = null;
    userBalance = 0;
    promoDiscount = 0;
    currentUserData = null;
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('user-profile').style.display = 'none';
    closeProfileModal();
}

// ==================== СИСТЕМА ПРОФИЛЯ ====================
function openProfileModal() {
    updateProfileDisplay();
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function updateProfileDisplay() {
    // Личная информация
    document.getElementById('profile-phone').textContent = userPhone || '—';
    document.getElementById('profile-balance').textContent = `${userBalance}₽`;
    document.getElementById('profile-purchases-count').textContent = currentUserData.purchases.length;
    document.getElementById('profile-total-spent').textContent = `${currentUserData.totalSpent}₽`;
    document.getElementById('profile-reg-date').textContent = currentUserData.regDate;
    document.getElementById('profile-active-promo').textContent = currentUserData.activePromo || 'Нет';
    
    // История покупок
    displayPurchasesHistory();
}

function displayPurchasesHistory() {
    const purchasesList = document.getElementById('purchases-list');
    
    if (currentUserData.purchases.length === 0) {
        purchasesList.innerHTML = '<p style="text-align: center; color: #a0a0a5;">У вас еще нет покупок</p>';
        return;
    }
    
    purchasesList.innerHTML = currentUserData.purchases.map((purchase, index) => `
        <div class="purchase-item">
            <div class="purchase-info">
                <h4>${purchase.name}</h4>
                <p>Дата: ${purchase.date}</p>
            </div>
            <div class="purchase-price">
                ${purchase.price}₽
            </div>
        </div>
    `).join('');
}

function switchProfileTab(tabName) {
    // Скрыть все табы
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранный таб
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'info') {
        updateProfileDisplay();
    }
}

function editProfileInfo() {
    alert('✏️ Функция редактирования профиля находится в разработке.\n\nТекущие данные сохраняются автоматически.');
}

// ==================== УПРАВЛЕНИЕ БАЛАНСОМ ====================
function openAddBalanceModal() {
    document.getElementById('add-balance-modal').style.display = 'flex';
    selectPaymentMethod('sberbank');
    document.getElementById('balance-amount').value = '';
    const balanceAmountInput = document.getElementById('balance-amount');
    if (balanceAmountInput) {
        balanceAmountInput.addEventListener('input', updatePaymentDetails);
    }
}

function closeAddBalanceModal() {
    document.getElementById('add-balance-modal').style.display = 'none';
    document.getElementById('balance-amount').value = '';
    document.getElementById('payment-details').style.display = 'none';
}

function selectPaymentMethod(method) {
    currentPaymentMethod = method;
    
    // Обновляем визуальное отображение
    document.querySelectorAll('.payment-method').forEach((btn, index) => {
        if ((index === 0 && method === 'sberbank') ||
            (index === 1 && method === 'yandex') ||
            (index === 2 && method === 'qiwi') ||
            (index === 3 && method === 'webmoney')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updatePaymentDetails();
}

function setQuickAmount(amount) {
    document.getElementById('balance-amount').value = amount;
    updatePaymentDetails();
}

function updatePaymentDetails() {
    const amount = parseInt(document.getElementById('balance-amount').value) || 0;
    
    if (amount < 100 || amount > 100000) {
        document.getElementById('payment-details').style.display = 'none';
        return;
    }
    
    // Скрыть все детали
    document.querySelectorAll('.payment-details').forEach(detail => {
        detail.style.display = 'none';
    });
    
    // Показать выбранный способ
    const detailsDiv = document.getElementById('payment-details');
    detailsDiv.style.display = 'block';
    
    if (currentPaymentMethod === 'sberbank') {
        document.getElementById('sberbank-details').style.display = 'block';
        document.getElementById('sberbank-amount').textContent = `${amount}₽`;
    } else if (currentPaymentMethod === 'yandex') {
        document.getElementById('yandex-details').style.display = 'block';
        document.getElementById('yandex-amount').textContent = `${amount}₽`;
    } else if (currentPaymentMethod === 'qiwi') {
        document.getElementById('qiwi-details').style.display = 'block';
        document.getElementById('qiwi-amount').textContent = `${amount}₽`;
    } else if (currentPaymentMethod === 'webmoney') {
        document.getElementById('webmoney-details').style.display = 'block';
        document.getElementById('webmoney-amount').textContent = `${amount}₽`;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Скопировано в буфер обмена!');
    }).catch(err => {
        alert('❌ Ошибка при копировании');
    });
}

function openYandexPayment() {
    alert('🔄 В реальном приложении вы будете перенаправлены на Яндекс.Касса\n\nДля демонстрации отправьте скриншот подтверждения менеджеру.');
}

function confirmTopupRequest() {
    const amount = parseInt(document.getElementById('balance-amount').value);
    
    if (!amount || amount < 100 || amount > 100000) {
        alert('❌ Введите сумму от 100₽ до 100 000₽');
        return;
    }
    
    const methodNames = {
        'sberbank': 'Сбербанк',
        'yandex': 'Яндекс.Касса',
        'qiwi': 'QIWI Кошелёк',
        'webmoney': 'WebMoney'
    };
    
    // Сохраняем информацию о платеже
    if (!currentUserData.topupRequests) {
        currentUserData.topupRequests = [];
    }
    
    const topupRequest = {
        amount: amount,
        method: currentPaymentMethod,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU'),
        status: 'pending'
    };
    
    currentUserData.topupRequests.push(topupRequest);
    saveAllData();
    
    alert(`✅ Запрос на пополнение создан!\n\nСумма: ${amount}₽\nСпособ: ${methodNames[currentPaymentMethod]}\n\n📱 Менеджер свяжется с вами для подтверждения платежа.\n\nКонтакты:\n📞 Telegram: https://t.me/jestudiobot\n💬 VK: https://vk.com/jest_studio`);
    
    closeAddBalanceModal();
}

function processBalanceTopup() {
    const amount = parseInt(document.getElementById('balance-amount').value);
    
    if (!amount || amount < 100) {
        alert('❌ Минимальная сумма пополнения: 100₽');
        return;
    }
    
    alert(`✅ Для пополнения баланса на ${amount}₽ напишите менеджеру:\n\n📱 Telegram: https://t.me/jestudiobot\n👥 VK: https://vk.com/jest_studio\n\nМенеджер поможет вам произвести платеж.`);
    closeAddBalanceModal();
}

function addBalanceAdmin(amount) {
    userBalance += amount;
    currentUserData.balance = userBalance;
    saveAllData();
    updateBalanceDisplay();
}

// ==================== СМЕНА НОМЕРА ТЕЛЕФОНА ====================
function openChangePhoneModal() {
    document.getElementById('change-phone-modal').style.display = 'flex';
}

function closeChangePhoneModal() {
    document.getElementById('change-phone-modal').style.display = 'none';
    document.getElementById('new-phone').value = '';
}

function processPhoneChange() {
    const newPhone = document.getElementById('new-phone').value.trim();
    
    if (!newPhone || newPhone.length < 10) {
        alert('❌ Введите корректный номер телефона!');
        return;
    }
    
    // Проверяем, не занят ли номер
    if (userAccounts.find(acc => acc.phone === newPhone)) {
        alert('❌ Номер уже используется в другом аккаунте!');
        return;
    }
    
    currentUserData.phone = newPhone;
    userPhone = newPhone;
    saveAllData();
    updateBalanceDisplay();
    alert(`✅ Номер телефона успешно изменён на ${newPhone}`);
    closeChangePhoneModal();
}

// ==================== УПРАВЛЕНИЕ АККАУНТАМИ ====================
function createNewAccount() {
    const response = confirm('🆕 Создать новый аккаунт?\n\nВы будете перенаправлены на экран авторизации.');
    if (response) {
        logout();
        document.getElementById('phone-input').value = '';
        document.getElementById('phone-input').focus();
    }
}

function showOtherAccounts() {
    if (userAccounts.length === 0) {
        alert('У вас нет других аккаунтов');
        return;
    }
    
    const accountsList = userAccounts
        .map((acc, index) => `${index + 1}. ${acc.phone} (Баланс: ${acc.balance}₽)`)
        .join('\n');
    
    const selected = prompt(`📱 Ваши аккаунты:\n\n${accountsList}\n\nВведите номер для переключения:`, '1');
    
    if (selected && selected >= 1 && selected <= userAccounts.length) {
        switchAccount(parseInt(selected) - 1);
    }
}

function switchAccount(index) {
    if (index >= 0 && index < userAccounts.length) {
        // Сохраняем текущие данные
        const currentIndex = userAccounts.findIndex(acc => acc.phone === userPhone);
        if (currentIndex !== -1) {
            userAccounts[currentIndex] = currentUserData;
        }
        
        // Переключаемся на новый аккаунт
        currentUserData = userAccounts[index];
        userPhone = currentUserData.phone;
        userBalance = currentUserData.balance;
        promoDiscount = 0;
        
        saveAllData();
        updateBalanceDisplay();
        updateProfileDisplay();
        
        alert(`✅ Переключились на аккаунт: ${userPhone}`);
    }
}

function clearAllData() {
    const confirmed = confirm('⚠️ ВНИМАНИЕ!\n\nЭто удалит ВСЕ ваши данные и аккаунты (невозможно отменить).\n\nВы уверены?');
    if (confirmed) {
        userAccounts = [];
        currentUserData = null;
        localStorage.removeItem('jestStudioAccounts');
        localStorage.removeItem('jestStudioUserPhone');
        alert('✅ Все данные удалены. Перезагрузите страницу.');
        location.reload();
    }
}

// ==================== СИСТЕМА ТОВАРОВ И ПОКУПОК ====================
function openBuyModal(productName, basePrice) {
    // Проверка авторизации
    if (!userPhone) {
        alert('Пожалуйста, авторизуйтесь чтобы покупать товары!');
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }
    
    // Применение скидки
    let finalPrice = basePrice;
    if (promoDiscount > 0) {
        finalPrice = Math.floor(basePrice * (1 - promoDiscount / 100));
    }
    
    // Проверка баланса
    if (userBalance < finalPrice) {
        alert(`❌ Недостаточно средств!\n\nТребуется: ${finalPrice}₽\nВаш баланс: ${userBalance}₽\n\nПополните баланс у менеджера.`);
        return;
    }
    
    // Открытие модального окна
    document.getElementById('modal-product-name').textContent = productName;
    document.getElementById('modal-product-price').textContent = finalPrice;
    
    // Показ скидки если применена
    let priceDisplay = document.querySelector('.final-price-tag');
    if (promoDiscount > 0) {
        const originalPrice = document.createElement('span');
        originalPrice.style.cssText = 'text-decoration: line-through; color: #a0a0a5; margin-right: 10px;';
        originalPrice.textContent = `${basePrice}₽`;
        
        const priceValue = priceDisplay.querySelector('span');
        priceDisplay.innerHTML = '';
        priceDisplay.appendChild(originalPrice);
        priceDisplay.appendChild(priceValue);
    }
    
    // Store current product info for payment processing
    window.currentProduct = {
        name: productName,
        basePrice: basePrice,
        finalPrice: finalPrice
    };
    
    document.getElementById('payment-modal').style.display = 'flex';
}

function closeBuyModal() {
    document.getElementById('payment-modal').style.display = 'none';
    promoDiscount = 0;
}

function completePayment() {
    if (!window.currentProduct) return;
    
    // Вычитание средств
    userBalance -= window.currentProduct.finalPrice;
    currentUserData.balance = userBalance;
    
    // Добавление в историю покупок
    currentUserData.purchases.push({
        name: window.currentProduct.name,
        price: window.currentProduct.finalPrice,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU')
    });
    
    currentUserData.totalSpent += window.currentProduct.finalPrice;
    
    saveAllData();
    updateBalanceDisplay();
    
    // Уведомление об успешном платеже
    alert(`✅ Товар "${window.currentProduct.name}" (${window.currentProduct.finalPrice}₽) добавлен в корзину!\n\nОтправьте чек боту для получения файла.`);
    
    closeBuyModal();
    window.currentProduct = null;
}

// ==================== СИСТЕМА ПРОМОКОДОВ ====================
function applyPromo() {
    const promoInput = document.getElementById('promo-code').value.trim().toLowerCase();
    const promoStatus = document.getElementById('promo-status');
    
    if (!promoInput) {
        promoStatus.textContent = '❌ Введите код автора!';
        promoStatus.style.color = '#ff6b6b';
        return;
    }
    
    if (validPromoCodes.includes(promoInput)) {
        promoDiscount = 10;
        currentUserData.activePromo = promoInput.toUpperCase();
        promoStatus.innerHTML = `✅ Успешно! Скидка <strong>10%</strong> применена на все товары. Используйте её перед покупкой!`;
        promoStatus.style.color = '#38b000';
        document.getElementById('promo-code').disabled = true;
        saveAllData();
    } else {
        promoStatus.textContent = `❌ Неверный код! Попробуйте: Fostvar, Jestvor или Jest`;
        promoStatus.style.color = '#ff6b6b';
        promoDiscount = 0;
    }
}

// ==================== СИСТЕМА КВЕСТОВ ====================
function setupQuestCounterDisplay() {
    const questsList = document.querySelectorAll('.quest-item input[type="checkbox"]');
    
    questsList.forEach((checkbox, index) => {
        checkbox.addEventListener('change', updateQuestCounter);
        
        // Загружаем состояние квестов из сохраненных данных
        if (currentUserData && currentUserData.questProgress && currentUserData.questProgress[`quest_${index}`]) {
            checkbox.checked = true;
        }
    });
    
    updateQuestCounter();
}

function updateQuestCounter() {
    const questsList = document.querySelectorAll('.quest-item input[type="checkbox"]');
    const completedQuests = Array.from(questsList).filter(q => q.checked).length;
    
    // Сохраняем состояние квестов
    if (currentUserData) {
        Array.from(questsList).forEach((checkbox, index) => {
            currentUserData.questProgress[`quest_${index}`] = checkbox.checked;
        });
        saveAllData();
    }
    
    // Обновляем текст счетчика
    const counterElement = document.getElementById('quest-counter') || createQuestCounter();
    counterElement.textContent = `Выполнено: ${completedQuests}/4`;
    
    // Проверка на завершение
    if (completedQuests === 4) {
        alert('🎉 Поздравляем! Вы выполнили все основные квесты сезона!\n\nВаш подарок ждёт вас. Свяжитесь с менеджером для получения награды.');
    }
}

function createQuestCounter() {
    const questsSection = document.getElementById('quests');
    const counter = document.createElement('div');
    counter.id = 'quest-counter';
    counter.style.cssText = `
        text-align: center;
        padding: 15px;
        background: rgba(157, 78, 221, 0.1);
        border: 1px solid #9d4edd;
        border-radius: 10px;
        margin-bottom: 30px;
        font-weight: 600;
        color: #ff9e00;
    `;
    questsSection.insertBefore(counter, questsSection.querySelector('.quests-list'));
    return counter;
}

// ==================== ПОДДЕРЖКА И ИИ ====================
function askAI() {
    const questions = [
        'Какие товары вы предоставляете?',
        'Каких авторов вы поддерживаете?',
        'Как работает система квестов?',
        'Как пополнить баланс?',
        'Как работают промокоды?'
    ];
    
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    const responses = {
        'Какие товары вы предоставляете?': 'Мы предоставляем цифровые товары: аватарки, шапки каналов, логотипы, превью, оверлеи и полное оформление для блогеров и стримеров.',
        'Каких авторов вы поддерживаете?': 'Мы активно сотрудничаем с авторами: Jestvor, Fostvar и Jest. Используйте их коды при покупке для скидки 10%!',
        'Как работает система квестов?': 'Каждый сезон мы предлагаем квесты. Выполните все задания и получите эксклюзивные подарки от Jest Studio!',
        'Как пополнить баланс?': 'Обратитесь к менеджеру через Telegram или VK. Он поможет вам пополнить баланс и ответит на любые вопросы.',
        'Как работают промокоды?': 'Введите код автора (Fostvar, Jestvor или Jest) в раздел "Поддержи автора" чтобы получить 10% скидку на все товары!'
    };
    
    alert(`🤖 Вопрос: ${randomQ}\n\n💬 Ответ:\n${responses[randomQ]}`);
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const paymentModal = document.getElementById('payment-modal');
    if (event.target === paymentModal) {
        closeBuyModal();
    }
    
    const profileModal = document.getElementById('profile-modal');
    if (event.target === profileModal) {
        closeProfileModal();
    }
    
    const addBalanceModal = document.getElementById('add-balance-modal');
    if (event.target === addBalanceModal) {
        closeAddBalanceModal();
    }
    
    const changePhoneModal = document.getElementById('change-phone-modal');
    if (event.target === changePhoneModal) {
        closeChangePhoneModal();
    }
    
    const authModal = document.getElementById('auth-modal');
    if (event.target === authModal && userPhone) {
        hideAuthModal();
    }
};

// ==================== СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ ====================
function saveAllData() {
    // Сохраняем все аккаунты
    localStorage.setItem('jestStudioAccounts', JSON.stringify(userAccounts));
    localStorage.setItem('jestStudioUserPhone', userPhone);
}

function loadAllData() {
    // Загружаем все аккаунты
    const saved = localStorage.getItem('jestStudioAccounts');
    if (saved) {
        userAccounts = JSON.parse(saved);
    }
    
    const savedPhone = localStorage.getItem('jestStudioUserPhone');
    if (savedPhone) {
        userPhone = savedPhone;
    }
}

// ==================== УТИЛИТЫ ====================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}
