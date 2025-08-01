// Скрипт для проверки содержимого localStorage
document.addEventListener('DOMContentLoaded', function() {
    // Создаем кнопку для проверки localStorage
    const checkButton = document.createElement('button');
    checkButton.textContent = 'Проверить данные контрагентов';
    checkButton.style.position = 'fixed';
    checkButton.style.bottom = '20px';
    checkButton.style.right = '20px';
    checkButton.style.zIndex = '9999';
    checkButton.style.padding = '10px 15px';
    checkButton.style.backgroundColor = '#4CAF50';
    checkButton.style.color = 'white';
    checkButton.style.border = 'none';
    checkButton.style.borderRadius = '4px';
    checkButton.style.cursor = 'pointer';
    
    // Добавляем обработчик события клика
    checkButton.addEventListener('click', function() {
        // Получаем данные из localStorage
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Создаем модальное окно для отображения данных
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        // Создаем содержимое модального окна
        const content = document.createElement('div');
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '5px';
        content.style.maxWidth = '80%';
        content.style.maxHeight = '80%';
        content.style.overflow = 'auto';
        
        // Создаем заголовок
        const heading = document.createElement('h2');
        heading.textContent = 'Данные пользователей и контрагентов';
        content.appendChild(heading);
        
        // Проверяем наличие пользователей
        if (registeredUsers.length === 0) {
            const noData = document.createElement('p');
            noData.textContent = 'В localStorage нет данных о зарегистрированных пользователях.';
            content.appendChild(noData);
        } else {
            // Создаем таблицу для отображения данных
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            
            // Создаем заголовок таблицы
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const headers = ['Имя', 'Email', 'Организация', 'ИНН', 'КПП', 'Контактное лицо'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.padding = '8px';
                th.style.borderBottom = '1px solid #ddd';
                th.style.textAlign = 'left';
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Создаем тело таблицы
            const tbody = document.createElement('tbody');
            
            registeredUsers.forEach(user => {
                const row = document.createElement('tr');
                
                // Добавляем ячейки с данными
                const nameCell = document.createElement('td');
                nameCell.textContent = user.name || 'Н/Д';
                nameCell.style.padding = '8px';
                nameCell.style.borderBottom = '1px solid #ddd';
                row.appendChild(nameCell);
                
                const emailCell = document.createElement('td');
                emailCell.textContent = user.email || 'Н/Д';
                emailCell.style.padding = '8px';
                emailCell.style.borderBottom = '1px solid #ddd';
                row.appendChild(emailCell);
                
                const orgNameCell = document.createElement('td');
                orgNameCell.textContent = user.counterparty?.orgName || 'Н/Д';
                orgNameCell.style.padding = '8px';
                orgNameCell.style.borderBottom = '1px solid #ddd';
                row.appendChild(orgNameCell);
                
                const innCell = document.createElement('td');
                innCell.textContent = user.counterparty?.inn || 'Н/Д';
                innCell.style.padding = '8px';
                innCell.style.borderBottom = '1px solid #ddd';
                row.appendChild(innCell);
                
                const kppCell = document.createElement('td');
                kppCell.textContent = user.counterparty?.kpp || 'Н/Д';
                kppCell.style.padding = '8px';
                kppCell.style.borderBottom = '1px solid #ddd';
                row.appendChild(kppCell);
                
                const contactPersonCell = document.createElement('td');
                contactPersonCell.textContent = user.counterparty?.contactPerson || 'Н/Д';
                contactPersonCell.style.padding = '8px';
                contactPersonCell.style.borderBottom = '1px solid #ddd';
                row.appendChild(contactPersonCell);
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            content.appendChild(table);
            
            // Добавляем кнопку для просмотра полных данных в консоли
            const consoleButton = document.createElement('button');
            consoleButton.textContent = 'Вывести полные данные в консоль';
            consoleButton.style.marginTop = '15px';
            consoleButton.style.padding = '8px 15px';
            consoleButton.style.backgroundColor = '#2196F3';
            consoleButton.style.color = 'white';
            consoleButton.style.border = 'none';
            consoleButton.style.borderRadius = '4px';
            consoleButton.style.cursor = 'pointer';
            
            consoleButton.addEventListener('click', function() {
                console.log('Зарегистрированные пользователи:', registeredUsers);
            });
            
            content.appendChild(consoleButton);
        }
        
        // Добавляем кнопку закрытия
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.style.marginTop = '15px';
        closeButton.style.padding = '8px 15px';
        closeButton.style.backgroundColor = '#f44336';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.marginLeft = '10px';
        
        closeButton.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        content.appendChild(closeButton);
        modal.appendChild(content);
        document.body.appendChild(modal);
    });
    
    // Добавляем кнопку на страницу
    document.body.appendChild(checkButton);
}); 