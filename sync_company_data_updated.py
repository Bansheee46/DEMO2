# Обновленная функция sync_company_data для server.py
# Замените существующую функцию в server.py на эту

@app.route('/api/sync-company-data', methods=['POST'])
def sync_company_data():
    try:
        print("Получен запрос на синхронизацию данных компании")
        
        # Получаем данные из запроса
        request_data = request.get_json() if request.is_json else {}
        document_dates = request_data.get('document_dates', {})
        document_info = request_data.get('document_info', {})
        
        # Получаем данные компании из настроек
        conn = sqlite3.connect('store.db')
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        settings_rows = cursor.fetchall()
        conn.close()
        
        company_data = {}
        for key, value in settings_rows:
            company_data[key] = value
        
        # Список файлов для обновления
        files_to_update = [
            'terms-of-use.html',
            'delivery-payment.html',
            'licenses.html',
            'privacy-consent.html',
            'privacy-policy.html',
            'warranty-return.html'
        ]
        
        # Формируем данные компании
        company_name = company_data.get('company_name', 'ООО «Дамакс»')
        company_inn = company_data.get('company_inn', '')
        company_ogrn = company_data.get('company_ogrn', '')
        company_kpp = company_data.get('company_kpp', '')
        company_legal_address = company_data.get('company_legal_address', '')
        company_actual_address = company_data.get('company_actual_address', '')
        company_postal_address = company_data.get('company_postal_address', '')
        company_email = company_data.get('company_email', '')
        company_privacy_email = company_data.get('company_privacy_email', '')
        company_phone = company_data.get('company_phone', '')
        company_bank_name = company_data.get('company_bank_name', '')
        company_bank_account = company_data.get('company_bank_account', '')
        company_bank_corr_account = company_data.get('company_bank_corr_account', '')
        company_bank_bik = company_data.get('company_bank_bik', '')
        working_hours = company_data.get('working_hours', '')
        
        # Сопоставление имени файла с ключами дат и дополнительной информации
        file_to_date_key = {
            'terms-of-use.html': 'terms_last_update',
            'privacy-policy.html': 'privacy_last_update',
            'privacy-consent.html': 'consent_last_update',
            'delivery-payment.html': 'delivery_last_update',
            'licenses.html': 'licenses_last_update',
            'warranty-return.html': 'warranty_last_update'
        }
        
        file_to_info_key = {
            'terms-of-use.html': 'terms_additional_info',
            'privacy-policy.html': 'privacy_additional_info',
            'privacy-consent.html': 'consent_additional_info',
            'delivery-payment.html': 'delivery_additional_info',
            'licenses.html': 'licenses_additional_info',
            'warranty-return.html': 'warranty_additional_info'
        }
        
        updated_files = []
        
        # Обрабатываем каждый файл
        for filename in files_to_update:
            try:
                if not os.path.exists(filename):
                    print(f"Файл {filename} не найден")
                    continue
                    
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Создаем копию исходного содержимого для сравнения
                original_content = content
                
                # 1. Обновляем основные данные компании в различных форматах
                
                # Формат 1: "Настоящие ... регулируют отношения между ООО "Дамакс" (ИНН: ..., ОГРН: ..., юридический адрес: ...)"
                company_info_pattern1 = r'Настоящие [^(]+ \(далее — «[^»]+»\) регулируют отношения между ([^(]+) \(ИНН: ([^,]+), ОГРН: ([^,]+), юридический адрес: ([^)]+)\)'
                new_company_info1 = f'Настоящие Условия пользования (далее — «Условия») регулируют отношения между {company_name} (ИНН: {company_inn}, ОГРН: {company_ogrn}, юридический адрес: {company_legal_address})'
                content = re.sub(company_info_pattern1, new_company_info1, content)
                
                # Формат 2: "Настоящая политика ... описывает, как ООО "Дамакс" (далее - "Компания") ..."
                company_info_pattern2 = r'Настоящая политика [^(]+ описывает, как ([^(]+) \(далее - "Компания"\)'
                new_company_info2 = f'Настоящая политика конфиденциальности описывает, как {company_name} (далее - "Компания")'
                content = re.sub(company_info_pattern2, new_company_info2, content)
                
                # 2. Обновляем блок с реквизитами компании
                requisites_pattern = r'<strong>Реквизиты компании:</strong><br>([^<]+)<br>ИНН: ([^<]+)<br>ОГРН: ([^<]+)<br>Юридический адрес: ([^<]+)<br>Фактический адрес: ([^<]+)<br>Телефон: ([^<(]+)(?:\([^)]+\))?<br>Email: ([^<(]+)(?:\([^)]+\))?'
                if re.search(requisites_pattern, content):
                    new_requisites = f'<strong>Реквизиты компании:</strong><br>{company_name}<br>ИНН: {company_inn}<br>ОГРН: {company_ogrn}<br>КПП: {company_kpp}<br>Юридический адрес: {company_legal_address}<br>Фактический адрес: {company_actual_address}<br>Почтовый адрес: {company_postal_address}<br>Телефон: {company_phone}<br>Email: {company_email}'
                    content = re.sub(requisites_pattern, new_requisites, content)
                
                # 3. Обновляем контактную информацию в разделе "Контактная информация"
                contact_info_pattern = r'<li class="[^"]+">Почтовый адрес: ([^<]+)</li>\s*<li class="[^"]+">Электронная почта: ([^<]+)</li>\s*<li class="[^"]+">Телефон: ([^<]+)</li>'
                
                # Определяем класс элемента списка на основе имени файла
                list_item_class = "terms__list-item" if "terms" in filename else "legal-document__list-item"
                
                new_contact_info = f'<li class="{list_item_class}">Почтовый адрес: {company_postal_address}</li>\n                        <li class="{list_item_class}">Электронная почта: {company_email}</li>\n                        <li class="{list_item_class}">Телефон: {company_phone}</li>'
                content = re.sub(contact_info_pattern, new_contact_info, content)
                
                # 4. Обновляем отдельные упоминания ИНН, КПП, ОГРН
                content = re.sub(r'ИНН: \d+', f'ИНН: {company_inn}', content)
                content = re.sub(r'КПП: \d+', f'КПП: {company_kpp}', content)
                content = re.sub(r'ОГРН: \d+', f'ОГРН: {company_ogrn}', content)
                
                # 5. Обновляем адреса компании
                content = re.sub(r'юридический адрес: [^<\)]+[<\)]', f'юридический адрес: {company_legal_address})', content)
                content = re.sub(r'Юридический адрес: [^<]+', f'Юридический адрес: {company_legal_address}', content)
                content = re.sub(r'Фактический адрес: [^<]+', f'Фактический адрес: {company_actual_address}', content)
                
                # 6. Обновляем email для приватности
                content = re.sub(r'privacy@damax\.ru(?:\([^)]+\))?', f'{company_privacy_email}', content)
                
                # 7. Обновляем информацию о банковских реквизитах (если она есть в файле)
                bank_info_pattern = r'Банк: ([^<]+)<br>Расчетный счет: ([^<]+)<br>Корреспондентский счет: ([^<]+)<br>БИК: ([^<]+)'
                if re.search(bank_info_pattern, content):
                    new_bank_info = f'Банк: {company_bank_name}<br>Расчетный счет: {company_bank_account}<br>Корреспондентский счет: {company_bank_corr_account}<br>БИК: {company_bank_bik}'
                    content = re.sub(bank_info_pattern, new_bank_info, content)
                
                # 8. Обновляем режим работы (если он есть в файле)
                content = re.sub(r'Режим работы: [^<]+', f'Режим работы: {working_hours}', content)
                
                # 9. Обновляем дату последнего обновления документа
                date_key = file_to_date_key.get(filename)
                if date_key and date_key in document_dates and document_dates[date_key]:
                    date_pattern = r'<p class="(?:terms|legal-document)__date">Последнее обновление: ([^<]+)</p>'
                    new_date = f'<p class="{"terms" if "terms" in filename else "legal-document"}__date">Последнее обновление: {document_dates[date_key]}</p>'
                    content = re.sub(date_pattern, new_date, content)
                
                # 10. Добавляем дополнительную информацию в документ (если она есть)
                info_key = file_to_info_key.get(filename)
                if info_key and info_key in document_info and document_info[info_key]:
                    # Проверяем, существует ли уже блок с дополнительной информацией
                    additional_info_pattern = r'<div class="(?:terms|legal-document)__additional-info">(.*?)</div>'
                    additional_info_match = re.search(additional_info_pattern, content, re.DOTALL)
                    
                    if additional_info_match:
                        # Обновляем существующий блок
                        new_additional_info = f'<div class="{"terms" if "terms" in filename else "legal-document"}__additional-info">{document_info[info_key]}</div>'
                        content = re.sub(additional_info_pattern, new_additional_info, content, flags=re.DOTALL)
                    else:
                        # Добавляем новый блок перед ссылкой "Вернуться на главную"
                        back_link_pattern = r'<a href="index.html" class="(?:terms|legal-document)__back-link">'
                        additional_info_block = f'''
                <div class="{"terms" if "terms" in filename else "legal-document"}__additional-info">
                    {document_info[info_key]}
                </div>

                '''
                        content = re.sub(back_link_pattern, additional_info_block + '<a href="index.html" class="' + ('terms' if 'terms' in filename else 'legal-document') + '__back-link">', content)
                
                # Проверяем, были ли внесены изменения
                if content != original_content:
                    # Записываем обновленный контент обратно в файл
                    with open(filename, 'w', encoding='utf-8') as file:
                        file.write(content)
                    
                    updated_files.append(filename)
                    print(f"Файл {filename} успешно обновлен")
                else:
                    print(f"В файле {filename} не требуется обновлений")
                
            except Exception as file_error:
                print(f"Ошибка при обновлении файла {filename}: {file_error}")
        
        return jsonify({
            "success": True, 
            "message": "Данные компании успешно синхронизированы", 
            "updated_files": updated_files
        }), 200
    except Exception as e:
        print(f"Ошибка при синхронизации данных компании: {e}")
        return jsonify({"success": False, "error": str(e)}), 500 