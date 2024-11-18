// Шифрование сообщения с возвратом строки
export const encryptMessage = async (
    message: string,
    keyString: string
): Promise<string> => {
    const encoder = new TextEncoder();

    // Преобразуем строку ключа в CryptoKey
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(keyString), // Преобразуем строку ключа в байты
        {
            name: "AES-GCM",
        },
        false,
        ["encrypt"]
    );

    // Генерация инициализационного вектора (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Шифруем сообщение
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
        },
        key,
        encoder.encode(message)
    );

    // Объединяем IV и зашифрованные данные, затем преобразуем их в Base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
};

// Расшифровка сообщения из строки
export const decryptMessage = async (
    encryptedMessage: string,
    keyString: string
): Promise<string> => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Преобразуем строку ключа в CryptoKey
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(keyString),
        {
            name: "AES-GCM",
        },
        false,
        ["decrypt"]
    );

    // Преобразуем Base64 обратно в байты
    const combined = Uint8Array.from(atob(encryptedMessage), (c) => c.charCodeAt(0));

    // Извлекаем IV и зашифрованные данные
    const iv = combined.slice(0, 12); // Первые 12 байт — IV
    const encryptedData = combined.slice(12); // Остальное — зашифрованные данные

    // Расшифровываем сообщение
    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv,
        },
        key,
        encryptedData
    );

    return decoder.decode(decryptedData);
};

