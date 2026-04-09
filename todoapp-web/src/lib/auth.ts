const TOKEN_KEY = "todoapp_token";
const USER_NAME_KEY = "todoapp_user_name";

export function saveAuthData(token: string, name: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_NAME_KEY, name);
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUserName(): string | null {
    return localStorage.getItem(USER_NAME_KEY);
}

export function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
}